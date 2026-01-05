/**
 * MetaAPI Trading Service
 * Handles real trading operations via MetaAPI with intelligent position management
 */

import { prisma } from '@/lib/prisma';
import {
  analyzeMarket,
  analyzePositionClose,
  calculatePositionSize,
  getMaxConcurrentTrades,
  TIER1_PAIRS,
  TIER2_PAIRS,
  TIER3_PAIRS,
  TRADING_PAIRS,
  TradingSignal,
  CandleData,
  PositionCloseSignal,
} from './tradingStrategy';
import axios from 'axios';
import https from 'https';

// Create https agent that accepts self-signed certs (for serverless)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// Simple ATR calculation for forced signals
function calculateATRSimple(candles: CandleData[], period: number = 14): number {
  if (candles.length < period + 1) return 0;
  
  let trSum = 0;
  for (let i = candles.length - period; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1]?.close || candles[i].open;
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    trSum += tr;
  }
  return trSum / period;
}

// MetaAPI configuration - read at runtime
function getMetaApiToken() {
  return process.env.METAAPI_TOKEN || process.env.META_API_TOKEN;
}

// MetaAPI endpoints
const PROVISIONING_API_URL = 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai';

// Region-specific client API endpoints
const REGION_ENDPOINTS: Record<string, string> = {
  'vint-hill': 'https://mt-client-api-v1.vint-hill.agiliumtrade.ai',
  'new-york': 'https://mt-client-api-v1.new-york.agiliumtrade.ai',
  'london': 'https://mt-client-api-v1.london.agiliumtrade.ai',
  'singapore': 'https://mt-client-api-v1.singapore.agiliumtrade.ai',
};

interface MetaApiAccount {
  _id: string;
  id?: string;
  login: string;
  server: string;
  state: string;
  region?: string;
}

interface MetaApiTrade {
  id: string;
  type: string;
  symbol: string;
  volume: number;
  openPrice: number;
  currentPrice?: number;
  profit: number;
  openTime: string;
  stopLoss?: number;
  takeProfit?: number;
}

/**
 * Get all MetaAPI accounts
 */
async function getAllMetaApiAccounts(): Promise<MetaApiAccount[]> {
  const token = getMetaApiToken();
  if (!token) {
    console.error('METAAPI_TOKEN not configured');
    return [];
  }

  try {
    const response = await axios.get(
      `${PROVISIONING_API_URL}/users/current/accounts`,
      {
        headers: {
          'auth-token': token,
          'Content-Type': 'application/json',
        },
        httpsAgent,
      }
    );

    return response.data || [];
  } catch (error: any) {
    console.error('Error fetching MetaAPI accounts:', error.message);
    return [];
  }
}

/**
 * Get MetaAPI account by login
 */
async function getMetaApiAccount(mt5Login: string): Promise<MetaApiAccount | null> {
  const accounts = await getAllMetaApiAccounts();
  return accounts.find(acc => String(acc.login) === String(mt5Login)) || null;
}

/**
 * Get the client API URL for an account
 */
function getClientApiUrl(account: MetaApiAccount): string {
  const region = account.region || 'vint-hill';
  return REGION_ENDPOINTS[region] || REGION_ENDPOINTS['vint-hill'];
}

/**
 * Get historical candles for a symbol
 */
async function getCandles(
  metaApiAccountId: string,
  symbol: string,
  timeframe: string = '1h',
  limit: number = 200
): Promise<CandleData[]> {
  const token = getMetaApiToken();
  if (!token) return [];

  // First get the account to determine region
  const accounts = await getAllMetaApiAccounts();
  const account = accounts.find(a => a._id === metaApiAccountId);
  if (!account) {
    console.error('Account not found:', metaApiAccountId);
    return [];
  }

  const clientApiUrl = getClientApiUrl(account);

  try {
    const response = await axios.get(
      `${clientApiUrl}/users/current/accounts/${metaApiAccountId}/historical-market-data/symbols/${symbol}/timeframes/${timeframe}/candles`,
      {
        params: { limit },
        headers: {
          'auth-token': token,
          'Content-Type': 'application/json',
        },
        httpsAgent,
      }
    );

    return (response.data || []).map((candle: any) => ({
      time: new Date(candle.time),
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.tickVolume || 0,
    }));
  } catch (error: any) {
    console.error(`Error fetching candles for ${symbol}:`, error.message);
    return [];
  }
}

/**
 * Get account balance and equity
 */
export async function getAccountInfo(metaApiAccountId: string): Promise<{
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
} | null> {
  const token = getMetaApiToken();
  if (!token) return null;

  // First get the account to determine region
  const accounts = await getAllMetaApiAccounts();
  const account = accounts.find(a => a._id === metaApiAccountId);
  if (!account) {
    console.error('Account not found:', metaApiAccountId);
    return null;
  }

  const clientApiUrl = getClientApiUrl(account);

  try {
    const response = await axios.get(
      `${clientApiUrl}/users/current/accounts/${metaApiAccountId}/account-information`,
      {
        headers: {
          'auth-token': token,
          'Content-Type': 'application/json',
        },
        httpsAgent,
      }
    );

    const data = response.data;
    return {
      balance: data.balance || 0,
      equity: data.equity || 0,
      margin: data.margin || 0,
      freeMargin: data.freeMargin || 0,
    };
  } catch (error: any) {
    console.error('Error fetching account info:', error.message);
    return null;
  }
}

/**
 * Place a trade via MetaAPI
 */
export async function placeTrade(
  metaApiAccountId: string,
  signal: TradingSignal,
  volume: number
): Promise<{ success: boolean; tradeId?: string; error?: string }> {
  const token = getMetaApiToken();
  if (!token) {
    return { success: false, error: 'METAAPI_TOKEN not configured' };
  }

  // First get the account to determine region
  const accounts = await getAllMetaApiAccounts();
  const account = accounts.find(a => a._id === metaApiAccountId);
  if (!account) {
    return { success: false, error: 'Account not found' };
  }

  const clientApiUrl = getClientApiUrl(account);

  try {
    const response = await axios.post(
      `${clientApiUrl}/users/current/accounts/${metaApiAccountId}/trade`,
      {
        actionType: signal.type === 'BUY' ? 'ORDER_TYPE_BUY' : 'ORDER_TYPE_SELL',
        symbol: signal.symbol,
        volume: volume,
        stopLoss: signal.stopLoss,
        takeProfit: signal.takeProfit,
        comment: `AlgoEdge ${signal.confidence}% confidence`,
      },
      {
        headers: {
          'auth-token': token,
          'Content-Type': 'application/json',
        },
        httpsAgent,
      }
    );

    const data = response.data;

    if (data.orderId || data.positionId) {
      return { success: true, tradeId: data.orderId || data.positionId };
    } else {
      return { success: false, error: data.message || 'Trade execution failed' };
    }
  } catch (error: any) {
    console.error('Error placing trade:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.message || 'Network error' };
  }
}

/**
 * Get open positions
 */
export async function getOpenPositions(metaApiAccountId: string): Promise<MetaApiTrade[]> {
  const token = getMetaApiToken();
  if (!token) return [];

  // First get the account to determine region
  const accounts = await getAllMetaApiAccounts();
  const account = accounts.find(a => a._id === metaApiAccountId);
  if (!account) {
    console.error('Account not found:', metaApiAccountId);
    return [];
  }

  const clientApiUrl = getClientApiUrl(account);

  try {
    const response = await axios.get(
      `${clientApiUrl}/users/current/accounts/${metaApiAccountId}/positions`,
      {
        headers: {
          'auth-token': token,
          'Content-Type': 'application/json',
        },
        httpsAgent,
      }
    );

    return response.data || [];
  } catch (error: any) {
    console.error('Error fetching positions:', error.message);
    return [];
  }
}

/**
 * Get trade history
 */
export async function getTradeHistory(
  metaApiAccountId: string,
  startTime?: Date,
  endTime?: Date
): Promise<MetaApiTrade[]> {
  const token = getMetaApiToken();
  if (!token) return [];

  // First get the account to determine region
  const accounts = await getAllMetaApiAccounts();
  const account = accounts.find(a => a._id === metaApiAccountId);
  if (!account) {
    console.error('Account not found:', metaApiAccountId);
    return [];
  }

  const clientApiUrl = getClientApiUrl(account);

  try {
    const start = startTime?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const end = endTime?.toISOString() || new Date().toISOString();

    const response = await axios.get(
      `${clientApiUrl}/users/current/accounts/${metaApiAccountId}/history-deals/time/${start}/${end}`,
      {
        headers: {
          'auth-token': token,
          'Content-Type': 'application/json',
        },
        httpsAgent,
      }
    );

    return response.data || [];
  } catch (error: any) {
    console.error('Error fetching trade history:', error.message);
    return [];
  }
}

/**
 * Run robot trading logic - INTELLIGENT VERSION
 * Prioritizes profitable pairs and manages positions intelligently
 */
export async function runRobotTrading(
  userId: number,
  robotId: string,
  mt5AccountDbId: number,
  metaApiAccountId: string,
  riskPercent: number = 1,
  timeframe: string = '1h'
): Promise<{
  tradesExecuted: number;
  tradesClosed: number;
  signals: TradingSignal[];
  errors: string[];
}> {
  let tradesExecuted = 0;
  let tradesClosed = 0;
  const signals: TradingSignal[] = [];
  const errors: string[] = [];

  try {
    // Get account info
    const accountInfo = await getAccountInfo(metaApiAccountId);
    if (!accountInfo) {
      errors.push('Could not fetch account information');
      return { tradesExecuted, tradesClosed, signals, errors };
    }

    console.log(`💰 Account Balance: $${accountInfo.balance}, Equity: $${accountInfo.equity}`);

    // Get current positions
    const openPositions = await getOpenPositions(metaApiAccountId);
    const openSymbols = new Set(openPositions.map(p => p.symbol));

    // Determine max trades based on account size
    const maxTrades = getMaxConcurrentTrades(accountInfo.balance);
    const availableSlots = maxTrades - openPositions.length;

    console.log(`📊 Open positions: ${openPositions.length}/${maxTrades}, Available slots: ${availableSlots}`);

    // =========================================================================
    // STEP 1: MANAGE EXISTING POSITIONS INTELLIGENTLY
    // =========================================================================
    for (const position of openPositions) {
      try {
        // Get fresh candle data for the position's symbol
        const candles = await getCandles(metaApiAccountId, position.symbol, timeframe, 100);
        if (candles.length < 50) continue;

        const currentPrice = candles[candles.length - 1].close;

        // Analyze if we should close/modify the position
        const closeSignal = analyzePositionClose({
          symbol: position.symbol,
          type: position.type.includes('BUY') ? 'BUY' : 'SELL',
          openPrice: position.openPrice,
          currentPrice: position.currentPrice || currentPrice,
          stopLoss: position.stopLoss || position.openPrice,
          takeProfit: position.takeProfit || position.openPrice,
          profit: position.profit,
          volume: position.volume,
        }, candles);

        console.log(`🔍 Position ${position.symbol}: ${closeSignal.action} - ${closeSignal.reason}`);

        // Execute position management actions
        if (closeSignal.action === 'CLOSE') {
          const result = await closePosition(metaApiAccountId, position.id);
          if (result.success) {
            tradesClosed++;
            console.log(`✅ Closed ${position.symbol} - Reason: ${closeSignal.reason}`);

            // Update database
            await prisma.trade.updateMany({
              where: {
                mt5AccountId: mt5AccountDbId,
                pair: position.symbol,
                status: 'open',
              },
              data: {
                status: 'closed',
                profit: position.profit,
                closePrice: currentPrice,
                closeTime: new Date(),
              },
            });

            // Log the close
            await prisma.auditLog.create({
              data: {
                userId,
                action: 'TRADE_CLOSED',
                details: {
                  robotId,
                  symbol: position.symbol,
                  profit: position.profit,
                  reason: closeSignal.reason,
                },
                ipAddress: 'system',
              },
            });
          }
        } else if (closeSignal.action === 'PARTIAL_CLOSE' && closeSignal.closePercent) {
          const closeVolume = position.volume * (closeSignal.closePercent / 100);
          const result = await partialClosePosition(metaApiAccountId, position.id, closeVolume);
          if (result.success) {
            console.log(`✅ Partial close ${position.symbol} (${closeSignal.closePercent}%) - ${closeSignal.reason}`);
          }

          // Also move stop loss if specified
          if (closeSignal.newStopLoss) {
            await modifyPosition(metaApiAccountId, position.id, closeSignal.newStopLoss, position.takeProfit);
          }
        } else if (closeSignal.action === 'MOVE_SL' && closeSignal.newStopLoss) {
          const result = await modifyPosition(metaApiAccountId, position.id, closeSignal.newStopLoss, position.takeProfit);
          if (result.success) {
            console.log(`✅ Moved SL for ${position.symbol} to ${closeSignal.newStopLoss.toFixed(5)}`);
          }
        }
      } catch (err) {
        errors.push(`Error managing position ${position.symbol}: ${err}`);
      }
    }

    // =========================================================================
    // STEP 2: OPEN NEW POSITIONS (Prioritized by Profitability)
    // =========================================================================
    if (availableSlots <= 0) {
      console.log('⚠️ No available slots for new trades');
      return { tradesExecuted, tradesClosed, signals, errors };
    }

    // Analyze pairs in priority order (Tier 1 first - most profitable)
    const pairsToAnalyze = [...TIER1_PAIRS, ...TIER2_PAIRS, ...TIER3_PAIRS];
    const analyzedSignals: TradingSignal[] = [];

    console.log(`🔍 Analyzing ${pairsToAnalyze.length} pairs for trading signals...`);

    for (const symbol of pairsToAnalyze) {
      // Skip if already have an open position
      if (openSymbols.has(symbol)) {
        console.log(`⏭️ Skipping ${symbol} - already have open position`);
        continue;
      }

      try {
        // Get candle data
        console.log(`📊 Fetching candles for ${symbol}...`);
        const candles = await getCandles(metaApiAccountId, symbol, timeframe, 200);
        
        if (candles.length < 100) {
          console.log(`⚠️ Insufficient data for ${symbol} (${candles.length} candles)`);
          continue;
        }

        console.log(`✅ Got ${candles.length} candles for ${symbol}`);

        // Analyze market
        const signal = analyzeMarket(symbol, candles);

        if (signal) {
          analyzedSignals.push(signal);
          console.log(`📈 Signal found: ${signal.type} ${symbol} @ ${signal.confidence}% confidence`);
        }
      } catch (err) {
        console.error(`❌ Error analyzing ${symbol}:`, err);
        errors.push(`Error analyzing ${symbol}: ${err}`);
      }
    }

    console.log(`📊 Found ${analyzedSignals.length} trading signals`);

    // If no signals found, force analyze TIER1 pairs for ANY opportunity
    if (analyzedSignals.length === 0 && availableSlots > 0) {
      console.log('⚡ No signals found, forcing analysis on TIER1 pairs...');
      for (const symbol of TIER1_PAIRS) {
        if (openSymbols.has(symbol)) continue;
        
        try {
          const candles = await getCandles(metaApiAccountId, symbol, timeframe, 200);
          if (candles.length < 50) continue;
          
          // Force generate a signal based on simple trend
          const closes = candles.slice(-20).map(c => c.close);
          const currentPrice = closes[closes.length - 1];
          const avgPrice = closes.reduce((a, b) => a + b, 0) / closes.length;
          const atr = calculateATRSimple(candles);
          
          const isBullish = currentPrice > avgPrice;
          const signal: TradingSignal = {
            symbol,
            type: isBullish ? 'BUY' : 'SELL',
            confidence: 35,
            entryPrice: currentPrice,
            stopLoss: isBullish ? currentPrice - (atr * 2) : currentPrice + (atr * 2),
            takeProfit: isBullish ? currentPrice + (atr * 3) : currentPrice - (atr * 3),
            takeProfit2: isBullish ? currentPrice + (atr * 4) : currentPrice - (atr * 4),
            takeProfit3: isBullish ? currentPrice + (atr * 5) : currentPrice - (atr * 5),
            trailingStop: atr * 1.5,
            reason: `Forced entry - ${isBullish ? 'bullish' : 'bearish'} bias`,
            priority: 100,
            expectedProfit: 1.5,
            riskRewardRatio: 1.5,
            indicators: {} as any,
          };
          
          analyzedSignals.push(signal);
          console.log(`⚡ Forced signal: ${signal.type} ${symbol} @ ${signal.confidence}%`);
          break; // Just get one forced signal
        } catch (err) {
          console.error(`Error forcing signal for ${symbol}:`, err);
        }
      }
    }

    // Sort signals by priority and expected profit
    analyzedSignals.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return b.expectedProfit - a.expectedProfit;
    });

    // Execute top signals up to available slots
    let slotsUsed = 0;
    for (const signal of analyzedSignals) {
      if (slotsUsed >= availableSlots) break;

      try {
        // Calculate position size based on risk
        const volume = calculatePositionSize(
          accountInfo.balance,
          riskPercent,
          signal.entryPrice,
          signal.stopLoss,
          signal.symbol
        );

        console.log(`🎯 Opening ${signal.type} ${signal.symbol}: Volume ${volume}, SL ${signal.stopLoss.toFixed(5)}, TP ${signal.takeProfit.toFixed(5)}`);

        // Place trade
        const result = await placeTrade(metaApiAccountId, signal, volume);

        if (result.success && result.tradeId) {
          tradesExecuted++;
          slotsUsed++;
          signals.push(signal);

          // Save trade to database
          await prisma.trade.create({
            data: {
              userId,
              robotId,
              mt5AccountId: mt5AccountDbId,
              pair: signal.symbol,
              type: signal.type,
              volume: volume,
              openPrice: signal.entryPrice,
              stopLoss: signal.stopLoss,
              takeProfit: signal.takeProfit,
              status: 'open',
              openTime: new Date(),
            },
          });

          // Log the trade execution
          await prisma.auditLog.create({
            data: {
              userId,
              action: 'TRADE_OPENED',
              details: {
                robotId,
                symbol: signal.symbol,
                type: signal.type,
                confidence: signal.confidence,
                priority: signal.priority,
                volume,
                entryPrice: signal.entryPrice,
                stopLoss: signal.stopLoss,
                takeProfit: signal.takeProfit,
                takeProfit2: signal.takeProfit2,
                takeProfit3: signal.takeProfit3,
                riskRewardRatio: signal.riskRewardRatio,
                expectedProfit: signal.expectedProfit,
                reason: signal.reason,
              },
              ipAddress: 'system',
            },
          });

          console.log(`✅ Trade opened: ${signal.type} ${signal.symbol}`);
        } else if (result.error) {
          errors.push(`${signal.symbol}: ${result.error}`);
          console.log(`❌ Trade failed: ${signal.symbol} - ${result.error}`);
        }
      } catch (err) {
        errors.push(`Error executing ${signal.symbol}: ${err}`);
      }
    }

    console.log(`📊 Summary: Opened ${tradesExecuted} trades, Closed ${tradesClosed} trades`);
    return { tradesExecuted, tradesClosed, signals, errors };
  } catch (error) {
    errors.push(`Robot execution error: ${error}`);
    return { tradesExecuted, tradesClosed, signals, errors };
  }
}

/**
 * Close a position by ID
 */
export async function closePosition(
  metaApiAccountId: string,
  positionId: string
): Promise<{ success: boolean; error?: string }> {
  const token = getMetaApiToken();
  if (!token) {
    return { success: false, error: 'METAAPI_TOKEN not configured' };
  }

  const accounts = await getAllMetaApiAccounts();
  const account = accounts.find(a => a._id === metaApiAccountId);
  if (!account) {
    return { success: false, error: 'Account not found' };
  }

  const clientApiUrl = getClientApiUrl(account);

  try {
    const response = await axios.post(
      `${clientApiUrl}/users/current/accounts/${metaApiAccountId}/trade`,
      {
        actionType: 'POSITION_CLOSE_ID',
        positionId: positionId,
      },
      {
        headers: {
          'auth-token': token,
          'Content-Type': 'application/json',
        },
        httpsAgent,
      }
    );

    return { success: true };
  } catch (error: any) {
    console.error('Error closing position:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.message || 'Close failed' };
  }
}

/**
 * Partially close a position
 */
export async function partialClosePosition(
  metaApiAccountId: string,
  positionId: string,
  volume: number
): Promise<{ success: boolean; error?: string }> {
  const token = getMetaApiToken();
  if (!token) {
    return { success: false, error: 'METAAPI_TOKEN not configured' };
  }

  const accounts = await getAllMetaApiAccounts();
  const account = accounts.find(a => a._id === metaApiAccountId);
  if (!account) {
    return { success: false, error: 'Account not found' };
  }

  const clientApiUrl = getClientApiUrl(account);

  try {
    const response = await axios.post(
      `${clientApiUrl}/users/current/accounts/${metaApiAccountId}/trade`,
      {
        actionType: 'POSITION_PARTIAL',
        positionId: positionId,
        volume: Math.round(volume * 100) / 100, // Round to 2 decimals
      },
      {
        headers: {
          'auth-token': token,
          'Content-Type': 'application/json',
        },
        httpsAgent,
      }
    );

    return { success: true };
  } catch (error: any) {
    console.error('Error partial closing position:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.message || 'Partial close failed' };
  }
}

/**
 * Modify position (Stop Loss / Take Profit)
 */
export async function modifyPosition(
  metaApiAccountId: string,
  positionId: string,
  stopLoss?: number,
  takeProfit?: number
): Promise<{ success: boolean; error?: string }> {
  const token = getMetaApiToken();
  if (!token) {
    return { success: false, error: 'METAAPI_TOKEN not configured' };
  }

  const accounts = await getAllMetaApiAccounts();
  const account = accounts.find(a => a._id === metaApiAccountId);
  if (!account) {
    return { success: false, error: 'Account not found' };
  }

  const clientApiUrl = getClientApiUrl(account);

  try {
    const body: any = {
      actionType: 'POSITION_MODIFY',
      positionId: positionId,
    };
    if (stopLoss !== undefined) body.stopLoss = stopLoss;
    if (takeProfit !== undefined) body.takeProfit = takeProfit;

    const response = await axios.post(
      `${clientApiUrl}/users/current/accounts/${metaApiAccountId}/trade`,
      body,
      {
        headers: {
          'auth-token': token,
          'Content-Type': 'application/json',
        },
        httpsAgent,
      }
    );

    return { success: true };
  } catch (error: any) {
    console.error('Error modifying position:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.message || 'Modify failed' };
  }
}

/**
 * Sync trades from MetaAPI to database
 */
export async function syncTrades(
  userId: number,
  mt5AccountDbId: number,
  metaApiAccountId: string
): Promise<{ synced: number; updated: number }> {
  let synced = 0;
  let updated = 0;

  try {
    // Get trade history from MetaAPI
    const trades = await getTradeHistory(metaApiAccountId);

    for (const trade of trades) {
      // Check if trade exists in database
      const existingTrade = await prisma.trade.findFirst({
        where: {
          mt5AccountId: mt5AccountDbId,
          pair: trade.symbol,
          openTime: new Date(trade.openTime),
        },
      });

      if (!existingTrade) {
        // Create new trade record
        await prisma.trade.create({
          data: {
            userId,
            mt5AccountId: mt5AccountDbId,
            pair: trade.symbol,
            type: trade.type.includes('BUY') ? 'BUY' : 'SELL',
            volume: trade.volume,
            openPrice: trade.openPrice,
            profit: trade.profit,
            status: 'closed',
            openTime: new Date(trade.openTime),
            closeTime: new Date(),
          },
        });
        synced++;
      } else if (existingTrade.status === 'open') {
        // Update existing trade with profit
        await prisma.trade.update({
          where: { id: existingTrade.id },
          data: {
            profit: trade.profit,
            status: 'closed',
            closeTime: new Date(),
          },
        });
        updated++;
      }
    }

    // Update account balance
    const accountInfo = await getAccountInfo(metaApiAccountId);
    if (accountInfo) {
      await prisma.mt5Account.update({
        where: { id: mt5AccountDbId },
        data: {
          balance: accountInfo.balance,
          equity: accountInfo.equity,
          lastSync: new Date(),
        },
      });
    }

    return { synced, updated };
  } catch (error) {
    console.error('Error syncing trades:', error);
    return { synced, updated };
  }
}

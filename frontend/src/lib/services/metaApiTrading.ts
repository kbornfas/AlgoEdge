/**
 * MetaAPI Trading Service
 * Handles real trading operations via MetaAPI
 */

import { prisma } from '@/lib/prisma';
import {
  analyzeMarket,
  calculatePositionSize,
  TRADING_PAIRS,
  TradingSignal,
  CandleData,
} from './tradingStrategy';
import axios from 'axios';
import https from 'https';

// Create https agent that accepts self-signed certs (for serverless)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

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
  profit: number;
  openTime: string;
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
 * Run robot trading logic
 * Scans all pairs and executes trades with 75%+ confidence
 */
export async function runRobotTrading(
  userId: number,
  robotId: string,
  mt5AccountDbId: number,
  metaApiAccountId: string,
  riskPercent: number = 1 // Risk 1% per trade by default
): Promise<{
  tradesExecuted: number;
  signals: TradingSignal[];
  errors: string[];
}> {
  const tradesExecuted = 0;
  const signals: TradingSignal[] = [];
  const errors: string[] = [];

  try {
    // Get account info
    const accountInfo = await getAccountInfo(metaApiAccountId);
    if (!accountInfo) {
      errors.push('Could not fetch account information');
      return { tradesExecuted, signals, errors };
    }

    // Get current positions to avoid duplicate trades
    const openPositions = await getOpenPositions(metaApiAccountId);
    const openSymbols = new Set(openPositions.map(p => p.symbol));

    // Analyze each trading pair
    for (const symbol of TRADING_PAIRS) {
      // Skip if already have an open position for this symbol
      if (openSymbols.has(symbol)) {
        continue;
      }

      try {
        // Get candle data
        const candles = await getCandles(metaApiAccountId, symbol, '1h', 200);
        if (candles.length < 200) continue;

        // Analyze market
        const signal = analyzeMarket(symbol, candles);

        if (signal && signal.confidence >= 75) {
          signals.push(signal);

          // Calculate position size
          const volume = calculatePositionSize(
            accountInfo.balance,
            riskPercent,
            signal.entryPrice,
            signal.stopLoss
          );

          // Place trade
          const result = await placeTrade(metaApiAccountId, signal, volume);

          if (result.success && result.tradeId) {
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
                  volume,
                  entryPrice: signal.entryPrice,
                  stopLoss: signal.stopLoss,
                  takeProfit: signal.takeProfit,
                  reason: signal.reason,
                },
                ipAddress: 'system',
              },
            });
          } else if (result.error) {
            errors.push(`${symbol}: ${result.error}`);
          }
        }
      } catch (err) {
        errors.push(`Error analyzing ${symbol}: ${err}`);
      }
    }

    return { tradesExecuted: signals.length, signals, errors };
  } catch (error) {
    errors.push(`Robot execution error: ${error}`);
    return { tradesExecuted, signals, errors };
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

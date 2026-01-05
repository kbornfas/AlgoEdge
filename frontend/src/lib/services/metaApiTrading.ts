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

// MetaAPI configuration
const META_API_TOKEN = process.env.META_API_TOKEN;
const META_API_URL = 'https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai';

interface MetaApiAccount {
  id: string;
  login: string;
  server: string;
  state: string;
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
 * Get MetaAPI account by MT5 account ID
 */
async function getMetaApiAccount(mt5AccountId: string): Promise<MetaApiAccount | null> {
  if (!META_API_TOKEN) {
    console.error('META_API_TOKEN not configured');
    return null;
  }

  try {
    const response = await fetch(`${META_API_URL}/users/current/accounts`, {
      headers: {
        'auth-token': META_API_TOKEN,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch accounts: ${response.statusText}`);
    }

    const accounts: MetaApiAccount[] = await response.json();
    return accounts.find(acc => acc.login === mt5AccountId) || null;
  } catch (error) {
    console.error('Error fetching MetaAPI account:', error);
    return null;
  }
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
  if (!META_API_TOKEN) return [];

  try {
    const response = await fetch(
      `${META_API_URL}/users/current/accounts/${metaApiAccountId}/historical-market-data/symbols/${symbol}/timeframes/${timeframe}/candles?limit=${limit}`,
      {
        headers: {
          'auth-token': META_API_TOKEN,
        },
      }
    );

    if (!response.ok) {
      console.error(`Failed to fetch candles for ${symbol}`);
      return [];
    }

    const data = await response.json();
    return data.map((candle: any) => ({
      time: new Date(candle.time),
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.tickVolume || 0,
    }));
  } catch (error) {
    console.error(`Error fetching candles for ${symbol}:`, error);
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
  if (!META_API_TOKEN) return null;

  try {
    const response = await fetch(
      `${META_API_URL}/users/current/accounts/${metaApiAccountId}/account-information`,
      {
        headers: {
          'auth-token': META_API_TOKEN,
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return {
      balance: data.balance,
      equity: data.equity,
      margin: data.margin,
      freeMargin: data.freeMargin,
    };
  } catch (error) {
    console.error('Error fetching account info:', error);
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
  if (!META_API_TOKEN) {
    return { success: false, error: 'META_API_TOKEN not configured' };
  }

  try {
    const response = await fetch(
      `${META_API_URL}/users/current/accounts/${metaApiAccountId}/trade`,
      {
        method: 'POST',
        headers: {
          'auth-token': META_API_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actionType: signal.type === 'BUY' ? 'ORDER_TYPE_BUY' : 'ORDER_TYPE_SELL',
          symbol: signal.symbol,
          volume: volume,
          stopLoss: signal.stopLoss,
          takeProfit: signal.takeProfit,
          comment: `AlgoEdge ${signal.confidence}% confidence`,
        }),
      }
    );

    const data = await response.json();

    if (response.ok && data.orderId) {
      return { success: true, tradeId: data.orderId };
    } else {
      return { success: false, error: data.message || 'Trade execution failed' };
    }
  } catch (error) {
    console.error('Error placing trade:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Get open positions
 */
export async function getOpenPositions(metaApiAccountId: string): Promise<MetaApiTrade[]> {
  if (!META_API_TOKEN) return [];

  try {
    const response = await fetch(
      `${META_API_URL}/users/current/accounts/${metaApiAccountId}/positions`,
      {
        headers: {
          'auth-token': META_API_TOKEN,
        },
      }
    );

    if (!response.ok) return [];

    return await response.json();
  } catch (error) {
    console.error('Error fetching positions:', error);
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
  if (!META_API_TOKEN) return [];

  try {
    const start = startTime?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const end = endTime?.toISOString() || new Date().toISOString();

    const response = await fetch(
      `${META_API_URL}/users/current/accounts/${metaApiAccountId}/history-deals/time/${start}/${end}`,
      {
        headers: {
          'auth-token': META_API_TOKEN,
        },
      }
    );

    if (!response.ok) return [];

    return await response.json();
  } catch (error) {
    console.error('Error fetching trade history:', error);
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

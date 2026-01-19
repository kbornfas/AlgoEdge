import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const tradingRobots = [
  {
    id: 'ema-pullback',
    name: 'EMA Pullback Pro',
    description: 'High win-rate trend strategy using EMA200/50 with RSI neutral zone pullback entries.',
    strategy: 'EMA 200 Trend + Pullback',
    timeframe: 'H1',
    timeframes: ['M5', 'M15', 'H1', 'H4'],
    pairs: ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'AUDUSD'],
    riskLevel: 'Low',
    winRate: 78.5,
    isActive: true,
  },
  {
    id: 'break-retest',
    name: 'Break & Retest',
    description: 'Institutional-style breakout strategy with confirmed retests and volume analysis.',
    strategy: 'Break and Retest',
    timeframe: 'H1',
    timeframes: ['M5', 'M15', 'H1'],
    pairs: ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'EURJPY', 'GBPJPY'],
    riskLevel: 'Medium',
    winRate: 72.3,
    isActive: true,
  },
  {
    id: 'liquidity-sweep',
    name: 'Liquidity Sweep SMC',
    description: 'Smart Money Concept strategy detecting liquidity sweeps and market structure shifts.',
    strategy: 'Liquidity Sweep + MSS',
    timeframe: 'M15',
    timeframes: ['M5', 'M15'],
    pairs: ['EURUSD', 'GBPUSD', 'XAUUSD', 'USDJPY'],
    riskLevel: 'Medium',
    winRate: 71.8,
    isActive: true,
  },
  {
    id: 'london-breakout',
    name: 'London Session Breakout',
    description: 'Trades Asian range breakouts during the high-volatility London session (08:00-11:00 GMT).',
    strategy: 'London Session Breakout',
    timeframe: 'M15',
    timeframes: ['M5', 'M15', 'M30'],
    pairs: ['EURUSD', 'GBPUSD', 'XAUUSD', 'EURJPY', 'GBPJPY'],
    riskLevel: 'Medium',
    winRate: 69.5,
    isActive: true,
  },
  {
    id: 'order-block',
    name: 'Order Block Trader',
    description: 'Identifies institutional order blocks on H1 zones with M5 precision entries.',
    strategy: 'Order Block',
    timeframe: 'H1',
    timeframes: ['M5', 'M15', 'H1'],
    pairs: ['EURUSD', 'GBPUSD', 'XAUUSD', 'USDJPY', 'AUDUSD'],
    riskLevel: 'Medium',
    winRate: 73.2,
    isActive: true,
  },
  {
    id: 'vwap-reversion',
    name: 'VWAP Mean Reversion',
    description: 'Mean reversion strategy using VWAP deviations with RSI oversold/overbought confirmation.',
    strategy: 'VWAP Mean Reversion',
    timeframe: 'M15',
    timeframes: ['M5', 'M15', 'M30'],
    pairs: ['EURUSD', 'GBPUSD', 'XAUUSD', 'USDJPY'],
    riskLevel: 'Low',
    winRate: 74.6,
    isActive: true,
  },
  {
    id: 'fib-continuation',
    name: 'Fibonacci Continuation',
    description: 'Trend continuation using Fibonacci 50-61.8% retracement levels with rejection candles.',
    strategy: 'Fibonacci Continuation',
    timeframe: 'H1',
    timeframes: ['M15', 'H1', 'H4'],
    pairs: ['EURUSD', 'GBPUSD', 'XAUUSD', 'USDJPY', 'AUDUSD', 'NZDUSD'],
    riskLevel: 'Low',
    winRate: 76.1,
    isActive: true,
  },
  {
    id: 'rsi-divergence',
    name: 'RSI Divergence Reversal',
    description: 'Catches trend reversals using RSI divergence patterns with price confirmation.',
    strategy: 'RSI Divergence',
    timeframe: 'H1',
    timeframes: ['M15', 'H1', 'H4'],
    pairs: ['EURUSD', 'GBPUSD', 'XAUUSD', 'USDJPY', 'AUDUSD'],
    riskLevel: 'Medium',
    winRate: 70.4,
    isActive: true,
  },
];

// The ONLY 8 robot IDs that should exist
const VALID_ROBOT_IDS = [
  'ema-pullback',
  'break-retest',
  'liquidity-sweep',
  'london-breakout',
  'order-block',
  'vwap-reversion',
  'fib-continuation',
  'rsi-divergence',
];

/**
 * GET /api/admin/seed-robots
 * Cleans up old robots and seeds only the 8 correct trading robots
 */
export async function GET(req: NextRequest) {
  try {
    // Check for admin secret in query params
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');
    
    if (secret !== 'SEED_ROBOTS_2026_ALGOEDGE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // STEP 1: Delete ALL robots that are NOT in our valid list
    const deleteResult = await prisma.tradingRobot.deleteMany({
      where: {
        id: {
          notIn: VALID_ROBOT_IDS,
        },
      },
    });
    
    console.log(`Deleted ${deleteResult.count} old/invalid robots`);

    // STEP 2: Upsert the 8 correct robots
    const results = [];
    
    for (const robot of tradingRobots) {
      const result = await prisma.tradingRobot.upsert({
        where: { id: robot.id },
        update: robot,
        create: robot,
      });
      results.push({ id: result.id, name: result.name, status: 'ok' });
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deleteResult.count} old robots. Seeded ${results.length} trading robots.`,
      deletedCount: deleteResult.count,
      robots: results,
    });
  } catch (error) {
    console.error('Seed robots error:', error);
    return NextResponse.json(
      { error: 'Failed to seed robots', details: String(error) },
      { status: 500 }
    );
  }
}

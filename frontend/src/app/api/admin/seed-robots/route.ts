import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const tradingRobots = [
  {
    id: 'algoedge-scalper',
    name: 'AlgoEdge Scalper',
    description: 'Ultra-fast scalping bot with AI-powered entry signals. Best for volatile market conditions with tight spreads.',
    strategy: 'Scalping',
    timeframe: 'M1',
    timeframes: ['M1', 'M5'],
    pairs: ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD'],
    riskLevel: 'High',
    winRate: 73.5,
    isActive: true,
  },
  {
    id: 'algoedge-momentum',
    name: 'AlgoEdge Momentum',
    description: 'Momentum-based trading system that captures quick price movements using RSI and MACD divergence.',
    strategy: 'Momentum',
    timeframe: 'M5',
    timeframes: ['M5', 'M15'],
    pairs: ['EURUSD', 'GBPUSD', 'AUDUSD', 'USDCHF', 'XAUUSD'],
    riskLevel: 'High',
    winRate: 71.8,
    isActive: true,
  },
  {
    id: 'algoedge-trend-m15',
    name: 'AlgoEdge Trend Hunter',
    description: 'Smart trend-following robot using EMA crossovers and ADX filters for high-probability setups.',
    strategy: 'Trend Following',
    timeframe: 'M15',
    timeframes: ['M15', 'M30', 'H1'],
    pairs: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'NZDUSD', 'XAUUSD'],
    riskLevel: 'Medium',
    winRate: 76.2,
    isActive: true,
  },
  {
    id: 'algoedge-breakout',
    name: 'AlgoEdge Breakout Pro',
    description: 'Identifies key support/resistance levels and trades breakouts with proper risk management.',
    strategy: 'Breakout',
    timeframe: 'M30',
    timeframes: ['M30', 'H1', 'H4'],
    pairs: ['EURUSD', 'GBPUSD', 'USDJPY', 'EURJPY', 'GBPJPY', 'XAUUSD'],
    riskLevel: 'Medium',
    winRate: 74.9,
    isActive: true,
  },
  {
    id: 'algoedge-swing-h1',
    name: 'AlgoEdge Swing Master',
    description: 'Swing trading system for capturing larger market moves. Uses multi-timeframe analysis.',
    strategy: 'Swing Trading',
    timeframe: 'H1',
    timeframes: ['H1', 'H4', 'D1'],
    pairs: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'XAUUSD', 'XAGUSD'],
    riskLevel: 'Low',
    winRate: 79.3,
    isActive: true,
  },
  {
    id: 'algoedge-gold-hunter',
    name: 'AlgoEdge Gold Hunter',
    description: 'Specialized robot for XAUUSD trading with volatility-based entries and dynamic stop losses.',
    strategy: 'Gold Trading',
    timeframe: 'H1',
    timeframes: ['M15', 'M30', 'H1', 'H4'],
    pairs: ['XAUUSD'],
    riskLevel: 'Medium',
    winRate: 81.2,
    isActive: true,
  },
  {
    id: 'algoedge-night-trader',
    name: 'AlgoEdge Night Trader',
    description: 'Trades during Asian session when volatility is lower. Focuses on range-bound strategies.',
    strategy: 'Range Trading',
    timeframe: 'H4',
    timeframes: ['H1', 'H4'],
    pairs: ['EURAUD', 'EURGBP', 'AUDNZD', 'XAUUSD'],
    riskLevel: 'Low',
    winRate: 77.6,
    isActive: true,
  },
  {
    id: 'algoedge-daily',
    name: 'AlgoEdge Daily Investor',
    description: 'Long-term position trading based on daily chart analysis. Perfect for set-and-forget trading.',
    strategy: 'Position Trading',
    timeframe: 'D1',
    timeframes: ['D1', 'W1'],
    pairs: ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'XAGUSD'],
    riskLevel: 'Low',
    winRate: 82.1,
    isActive: true,
  },
];

/**
 * GET /api/admin/seed-robots
 * Seeds the trading robots table - one-time setup
 */
export async function GET(req: NextRequest) {
  try {
    // Check for admin secret in query params - use a simple known token
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');
    
    // Use a hardcoded admin secret for seeding - change after use
    if (secret !== 'SEED_ROBOTS_2026_ALGOEDGE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🤖 Seeding trading robots...');
    
    const results = [];
    
    for (const robot of tradingRobots) {
      const result = await prisma.tradingRobot.upsert({
        where: { id: robot.id },
        update: {
          name: robot.name,
          description: robot.description,
          strategy: robot.strategy,
          timeframe: robot.timeframe,
          timeframes: robot.timeframes,
          pairs: robot.pairs,
          riskLevel: robot.riskLevel,
          winRate: robot.winRate,
          isActive: robot.isActive,
        },
        create: {
          id: robot.id,
          name: robot.name,
          description: robot.description,
          strategy: robot.strategy,
          timeframe: robot.timeframe,
          timeframes: robot.timeframes,
          pairs: robot.pairs,
          riskLevel: robot.riskLevel,
          winRate: robot.winRate,
          isActive: robot.isActive,
        },
      });
      
      results.push({ id: result.id, name: result.name, status: 'ok' });
      console.log(`  ✅ Seeded: ${robot.name}`);
    }

    console.log(`✅ Successfully seeded ${results.length} robots!`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully seeded ${results.length} robots`,
      robots: results 
    });
  } catch (error) {
    console.error('❌ Error seeding robots:', error);
    return NextResponse.json(
      { error: 'Failed to seed robots', details: String(error) },
      { status: 500 }
    );
  }
}

#!/usr/bin/env node

/**
 * Seed trading robots with high success rates
 * Creates multiple bots for different timeframes
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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
    winRate: 77.6,
    isActive: true,
  },
  {
    id: 'algoedge-position-h4',
    name: 'AlgoEdge Position Trader',
    description: 'Long-term position trading robot for capturing major market trends over days/weeks.',
    strategy: 'Position Trading',
    timeframe: 'H4',
    timeframes: ['H4', 'D1', 'W1'],
    pairs: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCHF', 'NZDUSD', 'XAUUSD'],
    riskLevel: 'Low',
    winRate: 82.1,
    isActive: true,
  },
  {
    id: 'algoedge-daily-sniper',
    name: 'AlgoEdge Daily Sniper',
    description: 'Precision entries on daily charts with high win rate. Perfect for set-and-forget trading.',
    strategy: 'Daily Trading',
    timeframe: 'D1',
    timeframes: ['D1', 'W1'],
    pairs: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'EURJPY', 'XAUUSD'],
    riskLevel: 'Low',
    winRate: 84.5,
    isActive: true,
  },
  {
    id: 'algoedge-grid-master',
    name: 'AlgoEdge Grid Master',
    description: 'Advanced grid trading system for ranging markets. Automatically adjusts grid size.',
    strategy: 'Grid Trading',
    timeframe: 'H1',
    timeframes: ['M30', 'H1', 'H4'],
    pairs: ['EURUSD', 'GBPUSD', 'AUDUSD', 'USDCHF'],
    riskLevel: 'Medium',
    winRate: 75.4,
    isActive: true,
  },
  {
    id: 'algoedge-news-trader',
    name: 'AlgoEdge News Trader',
    description: 'Capitalizes on high-impact news events with smart entry/exit timing and volatility filters.',
    strategy: 'News Trading',
    timeframe: 'M5',
    timeframes: ['M1', 'M5', 'M15'],
    pairs: ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD'],
    riskLevel: 'High',
    winRate: 69.8,
    isActive: true,
  },
  {
    id: 'algoedge-martingale-pro',
    name: 'AlgoEdge Martingale Pro',
    description: 'Smart martingale with risk controls. Uses AI to determine optimal recovery zones.',
    strategy: 'Martingale',
    timeframe: 'M15',
    timeframes: ['M15', 'M30', 'H1'],
    pairs: ['EURUSD', 'GBPUSD', 'USDJPY'],
    riskLevel: 'High',
    winRate: 71.2,
    isActive: true,
  },
  {
    id: 'algoedge-hedge-guardian',
    name: 'AlgoEdge Hedge Guardian',
    description: 'Hedging robot that minimizes drawdown by opening counter-positions during adverse moves.',
    strategy: 'Hedging',
    timeframe: 'H4',
    timeframes: ['H1', 'H4', 'D1'],
    pairs: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'XAUUSD'],
    riskLevel: 'Low',
    winRate: 78.9,
    isActive: true,
  },
];

async function seedRobots() {
  try {
    console.log('🤖 Seeding trading robots...');

    for (const robot of tradingRobots) {
      await prisma.tradingRobot.upsert({
        where: { id: robot.id },
        update: robot,
        create: robot,
      });
      console.log(`✅ ${robot.name} (${robot.timeframe}) - Win Rate: ${robot.winRate}%`);
    }

    console.log('\n✅ All trading robots seeded successfully!');
    console.log(`📊 Total robots: ${tradingRobots.length}`);
  } catch (error) {
    console.error('❌ Error seeding robots:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedRobots()
  .then(() => {
    console.log('✅ Seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });

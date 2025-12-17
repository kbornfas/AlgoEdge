#!/usr/bin/env node

/**
 * Seed trading robots with high success rates
 * Creates multiple bots for different timeframes
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const tradingRobots = [
  {
    id: 'scalper-m1',
    name: 'Scalper Pro M1',
    description: 'High-frequency scalping bot optimized for M1 timeframe with tight stop losses',
    strategy: 'Scalping',
    timeframe: 'M1',
    riskLevel: 'High',
    winRate: 68.5,
    isActive: true,
  },
  {
    id: 'scalper-m5',
    name: 'Scalper Elite M5',
    description: 'Quick scalping strategy for M5 charts with momentum indicators',
    strategy: 'Scalping',
    timeframe: 'M5',
    riskLevel: 'High',
    winRate: 72.3,
    isActive: true,
  },
  {
    id: 'trend-m15',
    name: 'Trend Follower M15',
    description: 'Follows strong trends on M15 timeframe using EMA crossovers',
    strategy: 'Trend Following',
    timeframe: 'M15',
    riskLevel: 'Medium',
    winRate: 75.8,
    isActive: true,
  },
  {
    id: 'trend-h1',
    name: 'Trend Master H1',
    description: 'Captures major trends on H1 charts with high accuracy',
    strategy: 'Trend Following',
    timeframe: 'H1',
    riskLevel: 'Medium',
    winRate: 78.2,
    isActive: true,
  },
  {
    id: 'breakout-m30',
    name: 'Breakout Hunter M30',
    description: 'Identifies and trades breakouts on M30 timeframe',
    strategy: 'Breakout',
    timeframe: 'M30',
    riskLevel: 'Medium',
    winRate: 71.5,
    isActive: true,
  },
  {
    id: 'breakout-h4',
    name: 'Breakout Pro H4',
    description: 'Strong breakout strategy for H4 charts with high win rate',
    strategy: 'Breakout',
    timeframe: 'H4',
    riskLevel: 'Low',
    winRate: 80.1,
    isActive: true,
  },
  {
    id: 'swing-d1',
    name: 'Swing Trader D1',
    description: 'Long-term swing trading on daily charts for consistent profits',
    strategy: 'Swing Trading',
    timeframe: 'D1',
    riskLevel: 'Low',
    winRate: 82.4,
    isActive: true,
  },
  {
    id: 'grid-h1',
    name: 'Grid Master H1',
    description: 'Grid trading system optimized for ranging markets on H1',
    strategy: 'Grid Trading',
    timeframe: 'H1',
    riskLevel: 'Medium',
    winRate: 74.6,
    isActive: true,
  },
  {
    id: 'martingale-m15',
    name: 'Martingale Pro M15',
    description: 'Advanced martingale with risk management for M15 timeframe',
    strategy: 'Martingale',
    timeframe: 'M15',
    riskLevel: 'High',
    winRate: 69.8,
    isActive: true,
  },
  {
    id: 'hedge-h4',
    name: 'Hedge Guardian H4',
    description: 'Hedging strategy to minimize risk on H4 charts',
    strategy: 'Hedging',
    timeframe: 'H4',
    riskLevel: 'Low',
    winRate: 76.9,
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

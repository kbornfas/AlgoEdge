/**
 * Seed Blog Posts
 * Run: node scripts/seed-blog-posts.js
 * 
 * Creates initial blog content for the platform
 */

import pool from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const ADMIN_USER_ID = 12; // Admin user ID in production database

const blogPosts = [
  {
    title: 'Introduction to Algorithmic Trading: A Complete Beginner\'s Guide',
    slug: 'introduction-to-algorithmic-trading-beginners-guide',
    excerpt: 'Learn the fundamentals of algorithmic trading, how it works, and why it\'s revolutionizing the forex market for retail traders.',
    content: `# Introduction to Algorithmic Trading

Algorithmic trading, also known as algo trading or automated trading, has transformed the financial markets. What was once the exclusive domain of institutional traders is now accessible to everyday retail traders.

## What is Algorithmic Trading?

Algorithmic trading uses computer programs to execute trades based on predetermined rules and conditions. These algorithms can:

- Analyze market data in milliseconds
- Execute trades at optimal prices
- Remove emotional decision-making
- Operate 24/7 without fatigue

## Why Algorithmic Trading is Growing

The popularity of algo trading has exploded for several reasons:

### 1. Speed and Efficiency
Algorithms can process market data and execute trades in microseconds, far faster than any human trader.

### 2. Emotional Discipline
One of the biggest challenges in trading is managing emotions. Algorithms follow rules precisely without fear or greed.

### 3. Backtesting Capability
Before risking real money, traders can test their strategies against historical data to validate performance.

### 4. Consistency
Algorithms apply the same rules consistently, trade after trade, without deviation.

## Getting Started with Algo Trading

Here's a roadmap for beginners:

1. **Learn the basics of trading** - Understand market fundamentals
2. **Choose your platform** - MetaTrader 5 is popular for forex
3. **Start with simple strategies** - Moving average crossovers are a great start
4. **Backtest thoroughly** - Never deploy without testing
5. **Paper trade first** - Practice with virtual money
6. **Start small** - Begin with minimal capital

## Common Algorithmic Trading Strategies

- **Trend Following** - Ride market trends
- **Mean Reversion** - Trade price returns to average
- **Scalping** - Quick, small profit trades
- **Arbitrage** - Exploit price differences

## Conclusion

Algorithmic trading offers powerful advantages for modern traders. With platforms like AlgoEdge, you can access professional-grade trading bots without needing to code yourself.

Ready to start? Explore our [marketplace](/marketplace) for proven trading algorithms.`,
    category: 'education',
    tags: ['algorithmic trading', 'beginners', 'forex', 'automation'],
    cover_image: '/images/blog/algo-trading-intro.jpg',
    is_featured: true,
  },
  {
    title: '5 Risk Management Rules Every Trader Must Follow',
    slug: '5-risk-management-rules-every-trader-must-follow',
    excerpt: 'Master these essential risk management principles to protect your trading capital and achieve long-term success.',
    content: `# 5 Risk Management Rules Every Trader Must Follow

Risk management is the foundation of successful trading. Without proper risk controls, even the best strategy will eventually fail.

## Rule 1: Never Risk More Than 2% Per Trade

The 2% rule is a cornerstone of professional trading:

- If you have a $10,000 account, never risk more than $200 per trade
- This ensures you can survive losing streaks
- 10 consecutive losses = 20% drawdown (recoverable)

**Example:** With a 40-pip stop loss on EUR/USD, calculate your position size to risk exactly 2% of your account.

## Rule 2: Always Use Stop Losses

A trade without a stop loss is gambling, not trading:

- Set your stop loss BEFORE entering the trade
- Never move it further from entry to "give it room"
- Consider using trailing stops to lock in profits

## Rule 3: Maintain a Positive Risk-Reward Ratio

Only take trades where potential profit exceeds potential loss:

- Minimum 1:2 risk-reward ratio recommended
- 1:3 or better is ideal
- A 40% win rate with 1:3 RR is profitable

## Rule 4: Diversify Your Trading

Don't put all your eggs in one basket:

- Trade multiple currency pairs
- Use multiple strategies
- Spread capital across different systems

## Rule 5: Keep a Trading Journal

Track every trade to identify patterns:

- Entry and exit reasons
- Emotional state
- Market conditions
- Screenshots of setups

## Implementing These Rules with AlgoEdge

Our trading bots automatically implement professional risk management:

- Configurable risk per trade (1-5%)
- Automatic stop losses on every trade
- Smart position sizing
- Multiple strategy diversification

## Conclusion

Risk management isn't glamorous, but it's the difference between traders who survive and those who blow their accounts.

Start protecting your capital today with [risk-managed trading bots](/marketplace/bots).`,
    category: 'education',
    tags: ['risk management', 'trading tips', 'capital preservation'],
    cover_image: '/images/blog/risk-management.jpg',
    is_featured: true,
  },
  {
    title: 'Understanding Smart Money Concepts (SMC) in Forex Trading',
    slug: 'understanding-smart-money-concepts-forex-trading',
    excerpt: 'Discover how institutional traders move the markets and learn to trade alongside the "smart money".',
    content: `# Understanding Smart Money Concepts (SMC)

Smart Money Concepts have revolutionized how retail traders understand and approach the forex market.

## What is Smart Money?

"Smart Money" refers to institutional traders:
- Banks
- Hedge funds
- Large financial institutions

These entities move massive amounts of capital and have information advantages over retail traders.

## Key SMC Concepts

### 1. Order Blocks

Order blocks are areas where institutions have placed large orders:

- **Bullish Order Block:** Last down candle before a strong up move
- **Bearish Order Block:** Last up candle before a strong down move

These areas often act as support/resistance where price returns to fill orders.

### 2. Fair Value Gaps (FVG)

Fair Value Gaps occur when price moves so quickly that it leaves gaps:

- Identifies areas of imbalance
- Price often returns to fill these gaps
- Can be used for precise entries

### 3. Liquidity Concepts

Smart money needs liquidity to fill large orders:

- **Buy-Side Liquidity:** Stop losses above resistance (hunted)
- **Sell-Side Liquidity:** Stop losses below support (hunted)

Understanding where liquidity rests helps predict institutional moves.

### 4. Market Structure

Price moves in predictable patterns:

- Higher highs and higher lows = uptrend
- Lower highs and lower lows = downtrend
- Break of structure (BOS) signals potential reversal

## Applying SMC to Your Trading

1. Identify the overall trend using market structure
2. Wait for price to approach an order block
3. Look for confirmation (fair value gap fill, structure break)
4. Enter with tight stop loss

## Learn More

Our [Smart Money Concepts Course](/marketplace/products/smart-money-concepts-course) provides 15+ hours of detailed training with real trade examples.`,
    category: 'education',
    tags: ['SMC', 'smart money', 'institutional trading', 'order blocks'],
    cover_image: '/images/blog/smart-money.jpg',
    is_featured: true,
  },
  {
    title: 'How to Choose the Right Trading Bot for Your Strategy',
    slug: 'how-to-choose-right-trading-bot',
    excerpt: 'Not all trading bots are created equal. Learn how to evaluate and select the perfect automated trading solution for your goals.',
    content: `# How to Choose the Right Trading Bot

With hundreds of trading bots available, choosing the right one can be overwhelming. This guide will help you make an informed decision.

## Key Factors to Consider

### 1. Trading Style Alignment

Different bots suit different trading styles:

- **Scalping Bots:** High frequency, small profits, requires low spreads
- **Trend Following Bots:** Lower frequency, rides trends, needs patience
- **Mean Reversion Bots:** Trades ranges, best in consolidating markets

**Match the bot to your personality and time availability.**

### 2. Win Rate vs. Risk-Reward

Don't focus only on win rate:

| Strategy | Win Rate | Risk:Reward | Expectancy |
|----------|----------|-------------|------------|
| Scalper  | 75%      | 1:1         | 50% profit |
| Trend    | 45%      | 1:3         | 80% profit |

A lower win rate with better RR can be more profitable!

### 3. Drawdown Tolerance

Consider maximum drawdown carefully:

- 10% max drawdown = Conservative
- 15-20% = Moderate
- 25%+ = Aggressive

Only use bots with drawdown levels you can emotionally handle.

### 4. Backtesting Results

Evaluate backtests critically:

- Look for 2+ years of data
- Check for various market conditions
- Beware of curve-fitted results
- Verify with demo trading

### 5. Verified Track Record

Look for:
- MyFXBook verification
- Real account results (not just demo)
- Transparent performance reporting

## Our Bot Recommendations

Based on risk tolerance:

### Conservative Traders
**Night Owl Ranger** - 78% win rate, 8% max drawdown
- Asian session trading
- Low risk, consistent returns
- [View Bot](/marketplace/bots/night-owl-ranger)

### Moderate Traders
**Titan Scalper Pro** - 73% win rate, 12% max drawdown
- Multi-pair scalping
- Balanced risk/reward
- [View Bot](/marketplace/bots/titan-scalper-pro)

### Aggressive Traders
**Gold Hunter EA** - 65% win rate, 15% max drawdown
- Gold specialist
- Higher returns, higher risk
- [View Bot](/marketplace/bots/gold-hunter-ea)

## Start Free

Try our [free starter bot](/marketplace/bots/algoedge-starter-bot) to learn automated trading without risk.`,
    category: 'product',
    tags: ['trading bots', 'automation', 'how to choose', 'comparison'],
    cover_image: '/images/blog/choose-bot.jpg',
    is_featured: false,
  },
  {
    title: 'Weekly Market Analysis: Key Levels and Opportunities',
    slug: 'weekly-market-analysis-jan-2026',
    excerpt: 'Our technical analysis team breaks down the major forex pairs and identifies high-probability trading setups for the week ahead.',
    content: `# Weekly Market Analysis - January 2026

Welcome to our weekly market breakdown. Let's analyze the key levels and potential opportunities across major pairs.

## EUR/USD Analysis

**Current Price:** 1.0850
**Weekly Bias:** Neutral to Bullish

Key Levels:
- Resistance: 1.0920, 1.1000
- Support: 1.0780, 1.0700

The pair is consolidating after the recent ECB decision. A break above 1.0920 could trigger a move toward 1.1000.

**Trade Idea:** Buy dips at 1.0780 with stops below 1.0700.

## GBP/USD Analysis

**Current Price:** 1.2720
**Weekly Bias:** Bullish

Key Levels:
- Resistance: 1.2800, 1.2900
- Support: 1.2650, 1.2550

Strong momentum after positive UK employment data. Watch for pullbacks to the 1.2650 support zone.

## USD/JPY Analysis

**Current Price:** 148.50
**Weekly Bias:** Bearish

Key Levels:
- Resistance: 149.50, 150.00
- Support: 147.50, 146.00

BoJ hints at policy normalization continue to pressure the pair. Watching for intervention signals.

## XAU/USD (Gold) Analysis

**Current Price:** 2,040
**Weekly Bias:** Bullish

Gold remains in a strong uptrend with geopolitical tensions providing support. Our Gold Hunter EA is positioned to capitalize on volatility.

Key Levels:
- Resistance: 2,050, 2,075
- Support: 2,020, 2,000

## Economic Calendar

Key events to watch:
- Tuesday: US CPI
- Wednesday: FOMC Minutes
- Thursday: UK GDP
- Friday: US Retail Sales

## Bot Performance This Week

Our trading bots delivered:
- Titan Scalper Pro: +3.2%
- Forex Trend Master: +2.8%
- Gold Hunter EA: +4.1%

---

*This analysis is for educational purposes. Always conduct your own research before trading.*`,
    category: 'analysis',
    tags: ['market analysis', 'EURUSD', 'GBPUSD', 'gold', 'weekly'],
    cover_image: '/images/blog/market-analysis.jpg',
    is_featured: false,
  },
  {
    title: 'Trading Psychology: Overcoming Fear and Greed',
    slug: 'trading-psychology-overcoming-fear-greed',
    excerpt: 'Master your emotions to become a consistently profitable trader. Learn proven techniques to control fear and greed.',
    content: `# Trading Psychology: Overcoming Fear and Greed

The two most destructive emotions in trading are fear and greed. Let's understand them and learn how to overcome them.

## Understanding Fear in Trading

Fear manifests in several ways:

### Fear of Loss
- Cutting winners too early
- Not taking valid setups
- Moving stops to avoid loss (usually causing bigger loss)

### Fear of Missing Out (FOMO)
- Chasing trades after they've moved
- Entering without proper setup
- Overtrading after winning streaks

## Understanding Greed in Trading

Greed destroys accounts through:

### Overleveraging
- Using too much margin
- Not respecting position sizing rules
- "Going all in" on "sure things"

### Holding Winners Too Long
- Wanting "just a little more"
- Turning winners into losers
- Ignoring exit signals

## Techniques to Control Emotions

### 1. Trade with a Plan
Write your trading plan BEFORE markets open:
- Entry criteria
- Stop loss
- Take profit
- Position size

**Then follow it mechanically.**

### 2. Use Automation

This is where trading bots shine. They:
- Follow rules precisely
- Never feel fear or greed
- Execute your plan 24/7
- Remove emotional decision-making

### 3. Practice Mindfulness

Before trading:
- Take 5 deep breaths
- Review your plan
- Ask: "Is this a valid setup?"
- Accept that any trade can lose

### 4. Keep a Trading Journal

After every trade, record:
- Your emotional state
- Whether you followed your plan
- What you could improve

### 5. Size Down

If emotions are overwhelming:
- Reduce position size by 50%
- Trade demo until stable
- Build confidence gradually

## The Automated Solution

The most effective way to eliminate emotional trading is to use automated systems. Our bots execute trades without fear or greed, following proven algorithms consistently.

Explore our [trading psychology course](/marketplace/products/trading-psychology-masterclass) for in-depth training.`,
    category: 'education',
    tags: ['psychology', 'emotions', 'fear', 'greed', 'mindset'],
    cover_image: '/images/blog/psychology.jpg',
    is_featured: true,
  },
  {
    title: 'Gold Trading Strategies: How to Profit from XAUUSD',
    slug: 'gold-trading-strategies-profit-xauusd',
    excerpt: 'Master gold trading with proven strategies, understand market drivers, and learn optimal entry techniques for XAUUSD.',
    content: `# Gold Trading Strategies: How to Profit from XAUUSD

Gold (XAUUSD) is one of the most popular trading instruments, offering unique opportunities for both short-term and long-term traders.

## Why Trade Gold?

### High Volatility
Gold provides excellent trading opportunities with daily ranges often exceeding 200+ pips.

### Safe Haven Asset
During market uncertainty, gold tends to appreciate, making it a hedge against economic instability.

### 24-Hour Market
Gold trades nearly 24 hours a day, allowing flexibility in trading schedules.

### Strong Technical Patterns
Gold respects technical levels well, making it ideal for technical analysis.

## Key Gold Trading Strategies

### 1. London Session Breakout
The London session often sets the daily direction:
- Mark the Asian session high and low
- Trade the breakout in London with momentum
- Use the opposite level as your stop loss

### 2. Dollar Correlation Trading
Gold has an inverse relationship with USD:
- Strong DXY = bearish gold
- Weak DXY = bullish gold
- Monitor Fed announcements for direction

### 3. Support/Resistance Scalping
Gold respects round numbers and historical levels:
- Key levels: $1800, $1900, $2000, etc.
- Use limit orders at these levels
- Tight stop losses (10-15 pips)

### 4. News Trading
Gold reacts strongly to:
- Fed interest rate decisions
- NFP employment data
- CPI inflation reports
- Geopolitical events

## Risk Management for Gold

Gold's volatility requires strict risk management:
- Use wider stop losses (20-50 pips)
- Reduce position size accordingly
- Consider 0.5-1% risk per trade

## Best Times to Trade Gold

1. **London Session (3-11 AM EST)** - Highest volume
2. **NY Overlap (8-11 AM EST)** - Maximum volatility
3. **News Events** - High opportunity, high risk

## Automated Gold Trading

Our [Gold Scalper Pro](/marketplace/bots/gold-scalper-pro) bot implements these strategies automatically with professional risk management.

## Conclusion

Gold trading offers exceptional opportunities for disciplined traders. Combine these strategies with proper risk management for consistent results.`,
    category: 'strategy',
    tags: ['gold', 'XAUUSD', 'trading strategies', 'precious metals'],
    cover_image: '/images/blog/gold-trading.jpg',
    is_featured: true,
  },
  {
    title: 'Building a Passive Income with Signal Subscriptions',
    slug: 'building-passive-income-signal-subscriptions',
    excerpt: 'Learn how to generate consistent passive income by subscribing to professional trading signals and copying expert traders.',
    content: `# Building a Passive Income with Signal Subscriptions

Imagine having professional traders work for you 24/7, executing profitable trades while you sleep. That's the power of signal subscriptions.

## What Are Trading Signals?

Trading signals are real-time trade alerts from experienced traders:
- Entry price and direction (buy/sell)
- Stop loss level
- Take profit targets
- Risk percentage

## Benefits of Signal Subscriptions

### 1. No Experience Required
Professional traders make the decisions while you copy their trades.

### 2. Time Freedom
No need to analyze charts for hours - signals do the work.

### 3. Learn While You Earn
Observe professional setups and learn market analysis.

### 4. Diversification
Subscribe to multiple signal providers across different strategies.

## How to Choose Signal Providers

### Check Track Record
- Minimum 6 months of verified results
- Consistent monthly returns (5-15%)
- Reasonable drawdown (<20%)

### Verify Authenticity
- Look for verified performance badges
- Check subscriber reviews
- Test with small capital first

### Match Your Style
- Day trading vs swing trading
- Conservative vs aggressive risk
- Specific pairs or diversified

## Setting Up Signal Copying

### Step 1: Choose Your Platform
AlgoEdge integrates signals directly with MT5 for automatic copying.

### Step 2: Set Risk Parameters
- Define max risk per trade (1-2%)
- Set maximum daily exposure
- Configure lot size multiplier

### Step 3: Monitor Performance
- Review weekly results
- Adjust allocations as needed
- Remove underperformers

## Expected Returns

Realistic expectations with quality signals:
- **Conservative:** 5-10% monthly
- **Moderate:** 10-20% monthly
- **Aggressive:** 20-30% monthly (higher risk)

## Managing Multiple Signal Sources

For true passive income, diversify:

1. **Gold Specialist** - XAUUSD focused signals
2. **Forex Major** - EUR/USD, GBP/USD strategies
3. **Swing Trader** - Longer-term positions
4. **Scalper** - Quick in-and-out trades

## Protecting Your Capital

- Never allocate 100% to signals
- Start with minimum capital per provider
- Keep 50% in reserve
- Stop copying if drawdown exceeds 15%

## Getting Started Today

Browse our [Signal Providers Marketplace](/marketplace/signals) to find verified traders matching your goals.

## Conclusion

Signal subscriptions offer a legitimate path to passive trading income. Start small, diversify wisely, and let professionals grow your account.`,
    category: 'income',
    tags: ['passive income', 'signals', 'copy trading', 'subscriptions'],
    cover_image: '/images/blog/passive-income.jpg',
    is_featured: true,
  },
];

async function seedBlogPosts() {
  console.log('📝 Seeding blog posts...');
  
  for (const post of blogPosts) {
    try {
      // Check if post already exists
      const existing = await pool.query(
        'SELECT id FROM blog_posts WHERE slug = $1',
        [post.slug]
      );

      if (existing.rows.length > 0) {
        console.log(`  ⏭️  Post "${post.title}" already exists, skipping...`);
        continue;
      }

      await pool.query(
        `INSERT INTO blog_posts (
          author_id, title, slug, excerpt, content, cover_image,
          category, tags, status, published_at, is_featured
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'published', CURRENT_TIMESTAMP, $9)`,
        [
          ADMIN_USER_ID,
          post.title,
          post.slug,
          post.excerpt,
          post.content,
          post.cover_image,
          post.category,
          post.tags,
          post.is_featured
        ]
      );
      console.log(`  ✅ Created post: ${post.title}`);
    } catch (error) {
      console.error(`  ❌ Error creating post "${post.title}":`, error.message);
    }
  }
}

async function main() {
  try {
    console.log('🚀 Starting blog posts seed...\n');
    await seedBlogPosts();
    console.log('\n✅ Blog posts seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

main();

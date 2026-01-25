// Seed script to populate marketplace with real products
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Real products to seed
const products = [
  // ============ TRADING BOTS / EXPERT ADVISORS ============
  {
    name: 'Gold Scalper Pro EA',
    slug: 'gold-scalper-pro-ea',
    description: `**Gold Scalper Pro EA** is a professional-grade Expert Advisor designed specifically for XAUUSD (Gold) scalping on the MT5 platform.

## Key Features:
- ✅ Optimized for M5 and M15 timeframes
- ✅ Advanced spread filter to avoid high-spread periods
- ✅ Smart lot sizing based on account balance
- ✅ Built-in news filter to avoid volatile events
- ✅ Trailing stop and break-even functionality
- ✅ Maximum daily loss protection

## Trading Strategy:
The EA uses a combination of RSI divergence, Bollinger Bands squeeze, and price action patterns to identify high-probability scalping opportunities during the London and New York sessions.

## Recommended Settings:
- Minimum Balance: $500
- Broker: ECN with low spreads on Gold
- Leverage: 1:100 or higher
- VPS: Recommended for 24/7 operation

## Backtest Results (2023-2025):
- Win Rate: 72%
- Profit Factor: 1.85
- Max Drawdown: 12%
- Average Monthly Return: 8-15%

## What's Included:
1. Gold_Scalper_Pro.ex5 (compiled EA file)
2. User Manual PDF
3. Recommended set files for different account sizes
4. Video installation guide
5. Lifetime updates`,
    short_description: 'Professional XAUUSD scalping EA with 72% win rate. Optimized for M5/M15 timeframes with smart risk management.',
    category: 'bot',
    price: 149.00,
    price_type: 'one_time',
    thumbnail_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400',
    tags: ['EA', 'Gold', 'XAUUSD', 'Scalping', 'MT5', 'Automated'],
    features: ['72% Win Rate', 'News Filter', 'Smart Lot Sizing', 'Trailing Stop', 'Lifetime Updates'],
    deliverables: [
      { name: 'Gold_Scalper_Pro.ex5', type: 'file', description: 'Compiled Expert Advisor for MT5' },
      { name: 'User_Manual.pdf', type: 'file', description: 'Complete setup and usage guide' },
      { name: 'Set_Files.zip', type: 'file', description: 'Optimized settings for different account sizes' },
      { name: 'Installation Video', type: 'link', description: 'Step-by-step video tutorial' }
    ]
  },
  {
    name: 'Silver Trend Rider EA',
    slug: 'silver-trend-rider-ea',
    description: `**Silver Trend Rider EA** is a trend-following Expert Advisor optimized for XAGUSD (Silver) trading on MT5.

## Key Features:
- ✅ Trend detection using multiple timeframe analysis
- ✅ Dynamic position sizing based on ATR
- ✅ Pyramid trading for trending markets
- ✅ Advanced money management
- ✅ Works on H1 and H4 timeframes

## Trading Logic:
The EA identifies strong trends using a proprietary algorithm combining ADX, Moving Averages, and momentum indicators. It enters on pullbacks and adds to winning positions.

## Performance Metrics:
- Average Win: 85 pips
- Average Loss: 35 pips
- Risk/Reward: 1:2.4
- Monthly Trades: 15-25

## Requirements:
- MT5 Platform
- Minimum $1,000 balance
- ECN broker recommended

## Package Contents:
1. Silver_Trend_Rider.ex5
2. Detailed PDF manual
3. Set files for conservative/aggressive trading
4. Private Telegram group access`,
    short_description: 'Trend-following EA for Silver (XAGUSD) with 1:2.4 risk/reward ratio. Perfect for H1/H4 swing trading.',
    category: 'bot',
    price: 129.00,
    price_type: 'one_time',
    thumbnail_url: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=400',
    tags: ['EA', 'Silver', 'XAGUSD', 'Trend Following', 'MT5', 'Swing Trading'],
    features: ['Trend Detection', 'Pyramid Trading', 'ATR-Based Sizing', 'Multi-Timeframe', 'Telegram Support'],
    deliverables: [
      { name: 'Silver_Trend_Rider.ex5', type: 'file', description: 'MT5 Expert Advisor' },
      { name: 'Manual.pdf', type: 'file', description: 'User guide and strategy explanation' },
      { name: 'Settings.zip', type: 'file', description: 'Preset configurations' }
    ]
  },
  {
    name: 'Multi-Metal Portfolio EA',
    slug: 'multi-metal-portfolio-ea',
    description: `**Multi-Metal Portfolio EA** trades both Gold (XAUUSD) and Silver (XAGUSD) simultaneously with intelligent correlation management.

## Why Portfolio Trading?
Gold and Silver have a correlation of ~0.85 but move differently during certain market conditions. This EA exploits these divergences for enhanced returns while managing overall portfolio risk.

## Features:
- ✅ Trades XAUUSD and XAGUSD together
- ✅ Correlation-aware position sizing
- ✅ Hedging mode for market uncertainty
- ✅ Portfolio heat management
- ✅ Session-based trading filters
- ✅ Equity protection system

## Strategy Components:
1. **Gold Strategy**: Breakout trading during London open
2. **Silver Strategy**: Mean reversion during ranging markets
3. **Hedge Mode**: Activated during high-impact news

## Backtest Results:
- Combined Win Rate: 68%
- Portfolio Sharpe Ratio: 1.45
- Max Portfolio Drawdown: 15%
- Annual Return: 85-120%

## Included:
- Multi_Metal_Portfolio.ex5
- Comprehensive 50-page manual
- Excel backtesting tool
- Monthly strategy updates`,
    short_description: 'Trade Gold and Silver together with intelligent correlation management. Portfolio approach for consistent returns.',
    category: 'bot',
    price: 249.00,
    price_type: 'one_time',
    thumbnail_url: 'https://images.unsplash.com/photo-1624996379697-f01d168b1a52?w=400',
    tags: ['EA', 'Gold', 'Silver', 'Portfolio', 'Hedging', 'MT5', 'Professional'],
    features: ['Dual Symbol', 'Correlation Management', 'Hedging Mode', 'Equity Protection', 'Monthly Updates'],
    deliverables: [
      { name: 'Multi_Metal_Portfolio.ex5', type: 'file', description: 'Portfolio Expert Advisor' },
      { name: 'Complete_Manual.pdf', type: 'file', description: '50-page comprehensive guide' },
      { name: 'Backtest_Tool.xlsx', type: 'file', description: 'Excel analysis tool' }
    ]
  },
  {
    name: 'Risk Manager Pro EA',
    slug: 'risk-manager-pro-ea',
    description: `**Risk Manager Pro EA** is an essential utility EA that protects your trading account from excessive losses and enforces disciplined trading.

## Protection Features:
- 🛡️ Daily loss limit (closes all trades if reached)
- 🛡️ Weekly/Monthly loss limits
- 🛡️ Maximum open trades limit
- 🛡️ Equity trailing stop
- 🛡️ Time-based trading restrictions
- 🛡️ Spread spike protection

## How It Works:
Attach this EA to any chart and it will monitor ALL trades on your account, regardless of which EA or manual trading placed them. When risk thresholds are breached, it takes protective action.

## Use Cases:
1. Protect against runaway EAs
2. Enforce personal trading rules
3. Prevent revenge trading
4. Lock in profits with equity trailing
5. Avoid high-spread periods

## Settings Include:
- Max daily loss percentage
- Max weekly drawdown
- Trading hours filter
- Max spread allowed
- Notification settings (email/push)

## Perfect For:
- Prop firm challenges (FTMO, MyForexFunds, etc.)
- Account protection
- Disciplined trading

FREE lifetime updates included!`,
    short_description: 'Essential account protection EA. Enforces daily loss limits, equity trailing, and trading discipline. Perfect for prop firms.',
    category: 'bot',
    price: 79.00,
    price_type: 'one_time',
    thumbnail_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
    tags: ['EA', 'Risk Management', 'Protection', 'Prop Firm', 'MT5', 'Utility'],
    features: ['Daily Loss Limit', 'Equity Trailing', 'Spread Protection', 'Time Filter', 'Prop Firm Ready'],
    deliverables: [
      { name: 'Risk_Manager_Pro.ex5', type: 'file', description: 'Risk Management EA' },
      { name: 'Setup_Guide.pdf', type: 'file', description: 'Quick start guide' },
      { name: 'Prop_Firm_Settings.set', type: 'file', description: 'Settings for prop firm challenges' }
    ]
  },
  {
    name: 'News Trading Sniper EA',
    slug: 'news-trading-sniper-ea',
    description: `**News Trading Sniper EA** automatically trades high-impact news events with precision entry and exit management.

## How It Works:
1. Connects to economic calendar API
2. Identifies high-impact events (NFP, FOMC, CPI, etc.)
3. Places pending orders before news release
4. Captures the initial spike movement
5. Manages trades with dynamic stops

## Supported News Events:
- 🇺🇸 US: NFP, FOMC, CPI, GDP, Retail Sales
- 🇪🇺 EU: ECB Decisions, German Data
- 🇬🇧 UK: BOE, Employment Data
- Custom events can be added

## Key Features:
- Straddle strategy (buy stop + sell stop)
- One-cancels-other (OCO) orders
- Slippage protection
- Spread filter during news
- Auto lot sizing based on risk %

## Performance:
- Average news event profit: 50-200 pips
- Win rate on major news: 65%
- Monthly opportunities: 8-12 events

## Requirements:
- Fast execution broker (ECN)
- VPS for timing accuracy
- Works on any pair affected by news

## Delivered Files:
- News_Sniper.ex5
- Economic calendar integration guide
- Strategy PDF
- Event importance settings`,
    short_description: 'Automated news trading EA. Captures NFP, FOMC, and other high-impact events with straddle strategy.',
    category: 'bot',
    price: 199.00,
    price_type: 'one_time',
    thumbnail_url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400',
    tags: ['EA', 'News Trading', 'NFP', 'FOMC', 'MT5', 'High Impact'],
    features: ['Calendar Integration', 'Straddle Strategy', 'OCO Orders', 'Slippage Protection', 'Multi-Currency'],
    deliverables: [
      { name: 'News_Sniper.ex5', type: 'file', description: 'News Trading EA' },
      { name: 'Calendar_Setup.pdf', type: 'file', description: 'Integration guide' },
      { name: 'Strategy_Guide.pdf', type: 'file', description: 'Complete strategy explanation' }
    ]
  },

  // ============ E-BOOKS ============
  {
    name: 'The Complete Gold Trading Bible',
    slug: 'gold-trading-bible-ebook',
    description: `**The Complete Gold Trading Bible** is a comprehensive 250+ page guide to mastering XAUUSD trading.

## What You'll Learn:

### Part 1: Gold Fundamentals
- What drives gold prices
- Correlation with USD, bonds, and equities
- Seasonal patterns in gold
- Central bank influence
- Safe-haven dynamics

### Part 2: Technical Analysis for Gold
- Best indicators for XAUUSD
- Support/Resistance identification
- Chart patterns that work on gold
- Multi-timeframe analysis
- Volume and momentum

### Part 3: Trading Strategies
- London Open Breakout Strategy
- Asian Session Range Strategy
- News Trading Approach
- Swing Trading System
- Scalping Techniques

### Part 4: Risk Management
- Position sizing for gold
- Stop loss placement
- Risk/reward optimization
- Portfolio allocation
- Drawdown recovery

### Part 5: Psychology & Discipline
- Trading journal template
- Emotional management
- Building consistency
- Professional trader habits

## Bonus Materials:
- 📊 20 chart examples with annotations
- 📋 Trading plan template
- 🧮 Position size calculator (Excel)
- ✅ Pre-trade checklist

**Format**: PDF (250+ pages)
**Author**: Professional gold trader with 10+ years experience`,
    short_description: 'Comprehensive 250+ page guide to mastering XAUUSD trading. From fundamentals to advanced strategies.',
    category: 'ebook',
    price: 49.00,
    price_type: 'one_time',
    thumbnail_url: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=400',
    tags: ['E-Book', 'Gold', 'XAUUSD', 'Trading Guide', 'Education', 'Strategies'],
    features: ['250+ Pages', 'Chart Examples', 'Trading Templates', 'Position Calculator', 'Bonus Materials'],
    deliverables: [
      { name: 'Gold_Trading_Bible.pdf', type: 'file', description: 'Main e-book (250+ pages)' },
      { name: 'Chart_Examples.pdf', type: 'file', description: '20 annotated chart examples' },
      { name: 'Position_Calculator.xlsx', type: 'file', description: 'Excel position sizing tool' },
      { name: 'Trading_Plan_Template.docx', type: 'file', description: 'Customizable trading plan' }
    ]
  },
  {
    name: 'Technical Analysis Mastery',
    slug: 'technical-analysis-mastery-ebook',
    description: `**Technical Analysis Mastery** teaches you to read charts like a professional trader.

## Contents:

### Chapter 1: Foundations
- Dow Theory essentials
- Market structure
- Trend identification
- Timeframe selection

### Chapter 2: Candlestick Patterns
- Single candle patterns
- Two-candle patterns
- Three-candle patterns
- Pattern reliability statistics

### Chapter 3: Chart Patterns
- Head & Shoulders
- Double Top/Bottom
- Triangles (ascending, descending, symmetrical)
- Flags and Pennants
- Wedges
- Cup and Handle

### Chapter 4: Indicators Deep Dive
- Moving Averages (SMA, EMA, weighted)
- RSI and divergence trading
- MACD strategies
- Bollinger Bands tactics
- Volume indicators
- ATR for volatility

### Chapter 5: Support & Resistance
- Horizontal levels
- Trendlines
- Fibonacci retracements
- Pivot points
- Dynamic S/R

### Chapter 6: Putting It Together
- Multi-indicator confluence
- Entry triggers
- Exit strategies
- Real trade examples

**190 pages** of actionable content with **100+ charts**`,
    short_description: 'Master technical analysis with 190 pages covering candlesticks, chart patterns, indicators, and S/R levels.',
    category: 'ebook',
    price: 39.00,
    price_type: 'one_time',
    thumbnail_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400',
    tags: ['E-Book', 'Technical Analysis', 'Chart Patterns', 'Indicators', 'Education'],
    features: ['190 Pages', '100+ Charts', 'Pattern Statistics', 'Indicator Strategies', 'Real Examples'],
    deliverables: [
      { name: 'Technical_Analysis_Mastery.pdf', type: 'file', description: 'Complete e-book' },
      { name: 'Pattern_Cheat_Sheet.pdf', type: 'file', description: 'Quick reference guide' }
    ]
  },
  {
    name: 'Risk Management for Forex Traders',
    slug: 'risk-management-ebook',
    description: `**Risk Management for Forex Traders** - The #1 skill that separates profitable traders from losers.

## Why Risk Management?
95% of traders fail because of poor risk management, not bad strategies. This book teaches you the professional approach to protecting and growing your capital.

## What's Inside:

### Module 1: Risk Fundamentals
- Understanding risk vs. reward
- The math of trading
- Why 2% rule matters
- Compounding gains

### Module 2: Position Sizing
- Fixed lot method
- Percentage risk method
- Kelly Criterion
- Optimal f
- Anti-Martingale

### Module 3: Stop Loss Strategies
- ATR-based stops
- Structure-based stops
- Time-based stops
- Trailing stop methods
- Break-even strategies

### Module 4: Portfolio Risk
- Correlation management
- Maximum exposure rules
- Diversification principles
- Heat mapping your risk

### Module 5: Psychology of Risk
- Fear and greed management
- Handling drawdowns
- Recovery strategies
- Building resilience

### Module 6: Prop Firm Risk Rules
- FTMO risk parameters
- MyForexFunds rules
- How to pass challenges
- Funded account management

## Includes:
- Risk calculator spreadsheet
- Position size calculator
- Drawdown recovery calculator
- Trading journal template

**120 pages** - Concise and actionable`,
    short_description: 'Master the #1 skill that separates winners from losers. Position sizing, stop losses, and prop firm risk rules.',
    category: 'ebook',
    price: 29.00,
    price_type: 'one_time',
    thumbnail_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400',
    tags: ['E-Book', 'Risk Management', 'Position Sizing', 'Prop Firm', 'Psychology'],
    features: ['120 Pages', 'Risk Calculator', 'Prop Firm Rules', 'Journal Template', 'Practical Examples'],
    deliverables: [
      { name: 'Risk_Management_Ebook.pdf', type: 'file', description: 'Main e-book' },
      { name: 'Risk_Calculators.xlsx', type: 'file', description: 'Position sizing calculators' },
      { name: 'Trading_Journal.xlsx', type: 'file', description: 'Professional trading journal' }
    ]
  },
  {
    name: 'Trading Psychology Blueprint',
    slug: 'trading-psychology-blueprint',
    description: `**Trading Psychology Blueprint** - Win the mental game of trading.

## The Truth About Trading:
Trading is 80% psychology and 20% strategy. You can have the best system in the world, but without mental mastery, you'll sabotage yourself.

## What You'll Learn:

### Part 1: Understanding Your Mind
- How emotions affect decisions
- The trader's brain
- Cognitive biases in trading
- Fear and greed cycles

### Part 2: Common Psychological Traps
- Overtrading
- Revenge trading
- FOMO (Fear of Missing Out)
- Analysis paralysis
- Confirmation bias
- Sunk cost fallacy

### Part 3: Building Mental Strength
- Developing discipline
- Creating routines
- Handling losses
- Managing winning streaks
- Staying humble

### Part 4: Practical Exercises
- Pre-market meditation routine
- Post-trade analysis framework
- Weekly review process
- Monthly goal setting
- Visualization techniques

### Part 5: Trading Like a Pro
- Professional trader habits
- Work-life balance
- Continuous improvement
- Building longevity

## Bonus: 30-Day Mental Training Program
Daily exercises to transform your trading psychology

**150 pages** of transformative content`,
    short_description: 'Master the mental game of trading. Overcome fear, greed, and self-sabotage with practical exercises.',
    category: 'ebook',
    price: 34.00,
    price_type: 'one_time',
    thumbnail_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    tags: ['E-Book', 'Psychology', 'Mindset', 'Discipline', 'Mental Training'],
    features: ['150 Pages', '30-Day Program', 'Daily Exercises', 'Review Templates', 'Pro Habits'],
    deliverables: [
      { name: 'Trading_Psychology_Blueprint.pdf', type: 'file', description: 'Main e-book' },
      { name: '30_Day_Program.pdf', type: 'file', description: 'Daily mental training exercises' },
      { name: 'Review_Templates.docx', type: 'file', description: 'Weekly and monthly review templates' }
    ]
  },
  {
    name: 'Price Action Trading Secrets',
    slug: 'price-action-secrets-ebook',
    description: `**Price Action Trading Secrets** - Trade with a clean chart and pure price.

## Why Price Action?
Price action trading removes the noise and focuses on what matters most - price itself. No lagging indicators, no conflicting signals.

## Complete Curriculum:

### Section 1: Price Action Basics
- What is price action?
- Reading candlesticks
- Understanding market structure
- Higher highs, lower lows
- Impulse vs. correction

### Section 2: Key Price Action Patterns
- Pin bars and rejection candles
- Inside bars
- Engulfing patterns
- Fakey patterns
- Break and retest

### Section 3: Market Context
- Trending markets
- Ranging markets
- Transitional phases
- Reading market sentiment

### Section 4: Entry Techniques
- Break of structure
- Liquidity sweeps
- Order blocks
- Fair value gaps
- Imbalance trading

### Section 5: Trade Management
- Partial profits
- Trailing with structure
- Scaling in/out
- Target selection

### Section 6: Complete Strategies
- The Sniper Entry Method
- London Session Breakout
- Reversal Trading System
- Trend Continuation Setup

## Over 150 chart examples from real markets!

**200 pages** - From beginner to advanced`,
    short_description: 'Learn to trade with a clean chart. Pin bars, market structure, order blocks, and complete strategies.',
    category: 'ebook',
    price: 44.00,
    price_type: 'one_time',
    thumbnail_url: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=400',
    tags: ['E-Book', 'Price Action', 'Clean Chart', 'Market Structure', 'Order Blocks'],
    features: ['200 Pages', '150+ Chart Examples', 'Complete Strategies', 'Entry Techniques', 'Trade Management'],
    deliverables: [
      { name: 'Price_Action_Secrets.pdf', type: 'file', description: 'Complete e-book' },
      { name: 'Chart_Examples_Gallery.pdf', type: 'file', description: '150+ annotated charts' },
      { name: 'Strategy_Cheat_Sheets.pdf', type: 'file', description: 'Quick reference for each strategy' }
    ]
  },

  // ============ INDICATORS ============
  {
    name: 'Smart Support Resistance Indicator',
    slug: 'smart-sr-indicator',
    description: `**Smart Support Resistance Indicator** automatically identifies the most important price levels on your chart.

## Features:
- 🎯 Auto-detects key support/resistance levels
- 🎯 Shows level strength (touches count)
- 🎯 Multi-timeframe levels
- 🎯 Clean, non-repainting display
- 🎯 Customizable colors and styles

## How It Works:
The indicator analyzes price history to find levels where price has repeatedly reversed. It ranks these levels by importance based on:
- Number of touches
- Recency of touches
- Reaction strength at each touch

## Display Options:
- Horizontal lines with labels
- Zone boxes for S/R areas
- Price labels on chart
- Alert when price approaches levels

## Why This Indicator?
Drawing support and resistance manually is time-consuming and subjective. This indicator does it automatically with consistent, objective criteria.

## Works On:
- Any currency pair
- Gold, Silver, and other metals
- Indices and stocks
- Any timeframe

## What's Included:
- SmartSR.ex5 indicator file
- User guide PDF
- Video tutorial link`,
    short_description: 'Automatically identify key support and resistance levels with strength ranking. Clean, non-repainting display.',
    category: 'indicator',
    price: 49.00,
    price_type: 'one_time',
    thumbnail_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
    tags: ['Indicator', 'Support Resistance', 'MT5', 'Auto Levels', 'Technical'],
    features: ['Auto Detection', 'Strength Ranking', 'Multi-Timeframe', 'Non-Repainting', 'Alert System'],
    deliverables: [
      { name: 'SmartSR.ex5', type: 'file', description: 'MT5 Indicator' },
      { name: 'User_Guide.pdf', type: 'file', description: 'Setup and usage guide' }
    ]
  },
  {
    name: 'Trend Strength Dashboard',
    slug: 'trend-strength-dashboard',
    description: `**Trend Strength Dashboard** displays the trend direction and strength across multiple timeframes in one glance.

## Dashboard Shows:
- Current trend direction (Up/Down/Ranging)
- Trend strength percentage
- Multiple timeframe analysis (M15 to MN)
- Currency strength meter
- Entry signal quality rating

## How It Helps:
Instead of switching between timeframes, see everything at once:
- ✅ M15 trend for scalping
- ✅ H1 trend for intraday
- ✅ H4 trend for swing trading
- ✅ D1 trend for position trading
- ✅ W1 trend for overall bias

## Trend Detection Methods:
- ADX for trend strength
- Multiple moving average alignment
- Higher high/lower low structure
- Momentum oscillator confirmation

## Alert Features:
- Alert when trends align across timeframes
- Alert on trend change
- Push notifications to mobile
- Email alerts option

## Customization:
- Choose which timeframes to display
- Select indicator colors
- Adjust sensitivity settings
- Position dashboard anywhere

Works on ALL pairs and metals!`,
    short_description: 'See trend direction and strength across all timeframes in one dashboard. Perfect for multi-timeframe trading.',
    category: 'indicator',
    price: 59.00,
    price_type: 'one_time',
    thumbnail_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
    tags: ['Indicator', 'Trend', 'Dashboard', 'Multi-Timeframe', 'MT5'],
    features: ['Multi-TF View', 'Strength Meter', 'Entry Rating', 'Customizable', 'Alerts'],
    deliverables: [
      { name: 'Trend_Dashboard.ex5', type: 'file', description: 'Dashboard indicator' },
      { name: 'Quick_Start.pdf', type: 'file', description: 'Installation guide' }
    ]
  },
  {
    name: 'Supply Demand Zone Indicator',
    slug: 'supply-demand-zone-indicator',
    description: `**Supply Demand Zone Indicator** automatically detects institutional supply and demand zones on your charts.

## What Are Supply/Demand Zones?
These are areas where large institutions (banks, hedge funds) have placed significant orders, creating zones of imbalance that price often returns to.

## Detection Algorithm:
The indicator identifies zones based on:
- Strong impulse moves from consolidation
- Fresh vs. tested zones
- Zone origin (rally-base-drop / drop-base-rally)
- Imbalance strength

## Visual Features:
- Color-coded zones (supply = red, demand = blue)
- Zone freshness indicator
- Strength rating (weak/medium/strong)
- Historical zone archive

## Zone Types Detected:
1. Fresh zones (never tested)
2. Tested zones (1-2 touches)
3. Broken zones (invalidated)
4. Decision point zones

## Trading With Zones:
- Enter at fresh zone touch
- Set stop beyond zone
- Target opposite zone
- Risk/reward often 1:3+

## Alerts:
- Price approaching zone
- Zone touch
- Zone break
- New zone formed

Works on all instruments and timeframes!`,
    short_description: 'Detect institutional supply and demand zones automatically. Fresh zones, strength rating, and alerts.',
    category: 'indicator',
    price: 69.00,
    price_type: 'one_time',
    thumbnail_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400',
    tags: ['Indicator', 'Supply Demand', 'Zones', 'Institutional', 'MT5', 'Smart Money'],
    features: ['Auto Detection', 'Freshness Rating', 'Strength Meter', 'Multiple Zone Types', 'Alerts'],
    deliverables: [
      { name: 'Supply_Demand_Zones.ex5', type: 'file', description: 'Zone indicator' },
      { name: 'Trading_Guide.pdf', type: 'file', description: 'How to trade with zones' }
    ]
  },

  // ============ TEMPLATES & TOOLS ============
  {
    name: 'Professional Trading Journal',
    slug: 'professional-trading-journal',
    description: `**Professional Trading Journal** - The essential tool for tracking and improving your trading.

## Why Keep a Journal?
Traders who journal consistently improve 30% faster than those who don't. This Excel-based journal makes it easy.

## Features:

### Trade Log
- Entry/exit details
- Pair and timeframe
- Strategy used
- Risk/reward planned vs. actual
- Screenshots attachment
- Notes and lessons

### Automatic Statistics
- Win rate calculation
- Average win/loss
- Profit factor
- Expected value
- Best/worst day
- Streak tracking

### Performance Analytics
- Equity curve chart
- Monthly P&L breakdown
- Strategy comparison
- Time-of-day analysis
- Day-of-week analysis
- Drawdown tracking

### Review Templates
- Daily review checklist
- Weekly analysis framework
- Monthly performance review
- Quarterly goal setting

## Dashboard Views:
- Overview dashboard
- Monthly calendar view
- Strategy breakdown
- Risk analysis

## Format: Excel (.xlsx)
- Works offline
- No subscription needed
- Fully customizable
- Your data stays private

Includes video tutorial for setup!`,
    short_description: 'Complete Excel trading journal with auto-statistics, equity curve, and performance analytics. Track every trade.',
    category: 'template',
    price: 29.00,
    price_type: 'one_time',
    thumbnail_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400',
    tags: ['Template', 'Trading Journal', 'Excel', 'Performance Tracking', 'Analytics'],
    features: ['Trade Log', 'Auto Statistics', 'Equity Curve', 'Strategy Analysis', 'Review Templates'],
    deliverables: [
      { name: 'Trading_Journal.xlsx', type: 'file', description: 'Main Excel journal' },
      { name: 'Quick_Start_Guide.pdf', type: 'file', description: 'Setup instructions' },
      { name: 'Sample_Entries.xlsx', type: 'file', description: 'Example trades for reference' }
    ]
  },
  {
    name: 'Forex Calculator Suite',
    slug: 'forex-calculator-suite',
    description: `**Forex Calculator Suite** - All the calculators you need in one Excel file.

## Included Calculators:

### 1. Position Size Calculator
- Input your risk percentage
- Enter stop loss in pips
- Get exact lot size for any pair
- Supports standard, mini, micro lots

### 2. Pip Value Calculator
- Calculate pip value for any pair
- Account currency conversion
- Works with crosses and exotics

### 3. Risk/Reward Calculator
- Visual R:R representation
- Target price calculator
- Breakeven calculator
- Partial profit planner

### 4. Compound Growth Calculator
- Project account growth
- Weekly/monthly targets
- Drawdown recovery time
- Goal planning

### 5. Margin Calculator
- Required margin for position
- Margin level monitoring
- Leverage impact analysis

### 6. Swap Calculator
- Daily swap charges
- Weekly holding costs
- Long vs. short comparison

### 7. Profit/Loss Calculator
- Calculate exact P&L
- Convert to account currency
- Commission inclusion

### 8. Currency Correlation Matrix
- Major pair correlations
- Updated correlation data
- Portfolio risk assessment

## Bonus: Quick Reference Cards
Print-ready cards for your desk!

**Format**: Excel with multiple sheets
**Works offline** - No internet required`,
    short_description: 'Complete calculator suite: position size, pip value, R:R, compound growth, margin, swap, and more.',
    category: 'template',
    price: 19.00,
    price_type: 'one_time',
    thumbnail_url: 'https://images.unsplash.com/photo-1554224155-3a58f03f4e01?w=400',
    tags: ['Template', 'Calculator', 'Position Size', 'Risk Management', 'Excel', 'Tools'],
    features: ['8 Calculators', 'Position Sizing', 'R:R Planner', 'Compound Calculator', 'Offline Use'],
    deliverables: [
      { name: 'Forex_Calculator_Suite.xlsx', type: 'file', description: 'All calculators in one file' },
      { name: 'Quick_Reference_Cards.pdf', type: 'file', description: 'Printable reference cards' }
    ]
  },
  {
    name: 'Trading Plan Template Bundle',
    slug: 'trading-plan-template-bundle',
    description: `**Trading Plan Template Bundle** - Professional templates used by funded traders.

## Why You Need a Trading Plan:
"Failing to plan is planning to fail" - Every successful trader has a written plan they follow consistently.

## Bundle Includes:

### 1. Complete Trading Plan Template
- Trading goals and objectives
- Market selection criteria
- Strategy rules (entry, exit, management)
- Risk parameters
- Daily routine
- Review process

### 2. Strategy Documentation Template
- Strategy name and description
- Market conditions required
- Entry criteria checklist
- Exit rules
- Example trades

### 3. Daily Trading Checklist
- Pre-market preparation
- Entry criteria verification
- Post-trade review
- End of day routine

### 4. Weekly Review Template
- Performance summary
- Best/worst trades
- Lessons learned
- Goals for next week

### 5. Monthly Business Review
- P&L analysis
- Strategy performance
- Goal progress
- Adjustments needed

### 6. Yearly Trading Plan
- Annual goals
- Monthly milestones
- Risk budgeting
- Education plan

## Formats Included:
- Word (.docx) - Editable
- PDF - Printable
- Google Docs links

All templates are fully customizable!`,
    short_description: 'Professional trading plan templates: daily checklist, weekly review, monthly analysis, and complete strategy docs.',
    category: 'template',
    price: 24.00,
    price_type: 'one_time',
    thumbnail_url: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=400',
    tags: ['Template', 'Trading Plan', 'Checklist', 'Review', 'Strategy', 'Documentation'],
    features: ['6 Templates', 'Word + PDF', 'Daily Checklist', 'Weekly Review', 'Customizable'],
    deliverables: [
      { name: 'Trading_Plan_Template.docx', type: 'file', description: 'Main trading plan' },
      { name: 'Strategy_Template.docx', type: 'file', description: 'Strategy documentation' },
      { name: 'Checklists_Bundle.pdf', type: 'file', description: 'All checklists combined' },
      { name: 'Review_Templates.docx', type: 'file', description: 'Weekly and monthly reviews' }
    ]
  },

  // ============ VIDEO COURSES ============
  {
    name: 'MT5 Mastery Course',
    slug: 'mt5-mastery-course',
    description: `**MT5 Mastery Course** - Complete video training for MetaTrader 5.

## Course Overview:
Whether you're new to MT5 or switching from MT4, this course covers everything you need to trade effectively on the platform.

## Module 1: Getting Started (5 videos)
- Installing MT5
- Platform tour and layout
- Customizing your workspace
- Connecting to brokers
- Demo vs. live accounts

## Module 2: Chart Analysis (8 videos)
- Timeframe selection
- Chart types and settings
- Drawing tools mastery
- Applying indicators
- Creating templates
- Multi-chart setups

## Module 3: Order Execution (6 videos)
- Market orders
- Pending orders (limit, stop, stop-limit)
- Modifying and closing trades
- One-click trading
- Position sizing in MT5

## Module 4: Advanced Features (7 videos)
- Strategy Tester
- Optimization basics
- Installing EAs and indicators
- Depth of Market (DOM)
- Economic calendar
- Alerts and notifications

## Module 5: Mobile Trading (4 videos)
- MT5 mobile app setup
- Trading on the go
- Mobile alerts
- Syncing with desktop

## Total: 30 videos (5+ hours)
- HD quality
- Lifetime access
- Downloadable

## Bonus:
- MT5 shortcuts cheat sheet
- Indicator starter pack (5 free indicators)`,
    short_description: 'Complete MT5 video course: 30 lessons covering charts, orders, EAs, strategy tester, and mobile trading.',
    category: 'course',
    price: 79.00,
    price_type: 'one_time',
    thumbnail_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400',
    tags: ['Course', 'MT5', 'Video Training', 'Platform', 'Beginner Friendly'],
    features: ['30 Videos', '5+ Hours', 'Lifetime Access', 'Downloadable', 'Bonus Indicators'],
    deliverables: [
      { name: 'Course_Videos.zip', type: 'file', description: '30 HD video lessons' },
      { name: 'MT5_Shortcuts.pdf', type: 'file', description: 'Keyboard shortcuts cheat sheet' },
      { name: 'Starter_Indicators.zip', type: 'file', description: '5 free MT5 indicators' }
    ]
  },
  {
    name: 'Prop Firm Challenge Blueprint',
    slug: 'prop-firm-challenge-blueprint',
    description: `**Prop Firm Challenge Blueprint** - Pass your funded account challenge on the first try.

## What's a Prop Firm Challenge?
Companies like FTMO, MyForexFunds, and Funded Next give you capital to trade after you pass their evaluation. This course shows you exactly how to pass.

## Course Content:

### Part 1: Understanding Prop Firms (6 videos)
- How prop firms work
- Comparing major firms
- Choosing the right challenge
- Cost vs. potential reward
- Rules you MUST know

### Part 2: Strategy Selection (8 videos)
- Best strategies for challenges
- Avoiding over-trading
- Managing daily loss limits
- Profit target approach
- Time-based planning

### Part 3: Risk Management (7 videos)
- Position sizing for challenges
- Daily loss limit management
- Drawdown recovery
- When NOT to trade
- Emergency protocols

### Part 4: Psychology (5 videos)
- Challenge pressure management
- Handling losing days
- Staying disciplined
- Final days strategy

### Part 5: Case Studies (6 videos)
- FTMO challenge walkthrough
- MyForexFunds example
- Failed challenge analysis
- Recovery and retry strategy

## Total: 32 videos + Resources

## Bonus Materials:
- Prop firm comparison spreadsheet
- Challenge tracking template
- Risk calculator for challenges
- Daily checklist for challenge phase`,
    short_description: 'Complete guide to passing prop firm challenges (FTMO, MFF, etc.). Strategy, risk management, and psychology.',
    category: 'course',
    price: 99.00,
    price_type: 'one_time',
    thumbnail_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
    tags: ['Course', 'Prop Firm', 'FTMO', 'Funded Trading', 'Challenge', 'Video'],
    features: ['32 Videos', 'Case Studies', 'Risk Templates', 'Comparison Sheet', 'Challenge Tracker'],
    deliverables: [
      { name: 'Course_Videos.zip', type: 'file', description: '32 video lessons' },
      { name: 'Prop_Firm_Comparison.xlsx', type: 'file', description: 'Compare all major firms' },
      { name: 'Challenge_Tracker.xlsx', type: 'file', description: 'Track your challenge progress' },
      { name: 'Risk_Calculator.xlsx', type: 'file', description: 'Position size for challenges' }
    ]
  }
];

async function seedProducts() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting product seeding...\n');
    
    // Check if admin user exists, if not create one
    let sellerId;
    const adminCheck = await client.query(
      "SELECT id FROM users WHERE email = 'admin@algoedge.io' OR is_admin = true LIMIT 1"
    );
    
    if (adminCheck.rows.length > 0) {
      sellerId = adminCheck.rows[0].id;
      console.log('✅ Using existing admin user as seller');
    } else {
      // Create an admin user for these products
      const createAdmin = await client.query(`
        INSERT INTO users (username, email, password_hash, is_admin, email_verified, created_at)
        VALUES ('AlgoEdge Official', 'admin@algoedge.io', '$2b$10$placeholder', true, true, NOW())
        RETURNING id
      `);
      sellerId = createAdmin.rows[0].id;
      console.log('✅ Created admin user for products');
    }
    
    // Seed each product
    for (const product of products) {
      console.log(`\n📦 Adding: ${product.name}`);
      
      // Check if product already exists
      const existing = await client.query(
        'SELECT id FROM marketplace_products WHERE slug = $1',
        [product.slug]
      );
      
      if (existing.rows.length > 0) {
        console.log(`   ⏭️ Already exists, skipping`);
        continue;
      }
      
      // Insert product
      const result = await client.query(`
        INSERT INTO marketplace_products (
          seller_id, name, slug, description, short_description,
          category, price, product_type, thumbnail_url, 
          tags, status, is_official, instant_delivery, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'approved', true, true, NOW())
        RETURNING id
      `, [
        sellerId,
        product.name,
        product.slug,
        product.description,
        product.short_description,
        product.category,
        product.price,
        product.category, // product_type same as category
        product.thumbnail_url,
        product.tags
      ]);
      
      const productId = result.rows[0].id;
      
      // Add deliverables
      if (product.deliverables && product.deliverables.length > 0) {
        for (let i = 0; i < product.deliverables.length; i++) {
          const d = product.deliverables[i];
          await client.query(`
            INSERT INTO product_deliverables (
              product_id, deliverable_type, name, description, display_order, is_active, created_at
            ) VALUES ($1, $2, $3, $4, $5, true, NOW())
          `, [productId, d.type, d.name, d.description, i + 1]);
        }
        console.log(`   ✅ Added ${product.deliverables.length} deliverables`);
      }
      
      console.log(`   ✅ Added: $${product.price} (${product.category})`);
    }
    
    // Summary
    const count = await client.query('SELECT COUNT(*) FROM marketplace_products');
    console.log(`\n========================================`);
    console.log(`✅ Seeding complete!`);
    console.log(`📊 Total products in marketplace: ${count.rows[0].count}`);
    console.log(`========================================\n`);
    
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedProducts().catch(console.error);

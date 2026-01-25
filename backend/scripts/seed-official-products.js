/**
 * Seed Official AlgoEdge Products
 * Run: node scripts/seed-official-products.js
 * 
 * This creates all official AlgoEdge products:
 * - Trading Bots (5 bots)
 * - Signal Services (3 providers)
 * - Digital Products (8 products)
 * - API Access Packages (4 tiers)
 */

import pool from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const ALGOEDGE_SYSTEM_USER_ID = 1; // System/Admin user ID

// ============================================================================
// OFFICIAL TRADING BOTS
// ============================================================================
const officialBots = [
  {
    name: 'Titan Scalper Pro',
    slug: 'titan-scalper-pro',
    description: `Titan Scalper Pro is our flagship high-frequency scalping bot designed for volatile market conditions. Using advanced price action analysis and machine learning algorithms, it identifies micro-trends and executes rapid trades with precision.

**Key Features:**
• Ultra-fast execution with < 50ms latency
• Smart lot sizing based on account equity
• Multi-pair support (up to 28 pairs simultaneously)
• Advanced news filter to avoid high-impact events
• Trailing stop with breakeven functionality
• Compatible with ECN/STP brokers

**Performance Metrics:**
• Average monthly return: 8-15%
• Maximum drawdown: 12%
• Win rate: 73%
• Profit factor: 2.1

Recommended for traders seeking consistent daily profits with manageable risk. Works best on M1-M15 timeframes.`,
    short_description: 'High-frequency scalping bot with 73% win rate and advanced ML algorithms',
    category: 'scalping',
    platform: 'MT5',
    price: 299.00,
    discount_price: 249.00,
    is_free: false,
    version: '3.2.1',
    min_balance: 500,
    recommended_balance: 2000,
    supported_pairs: JSON.stringify(['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'EURJPY', 'GBPJPY']),
    timeframes: JSON.stringify(['M1', 'M5', 'M15']),
    features: JSON.stringify([
      'Machine Learning Algorithm',
      'News Filter',
      'Trailing Stop',
      'Breakeven System',
      'Multi-pair Trading',
      'Risk Management',
      'Auto Lot Sizing',
      'Dashboard Panel'
    ]),
    backtest_results: JSON.stringify({
      period: '2020-2024',
      initial_balance: 10000,
      final_balance: 47832,
      total_trades: 12847,
      win_rate: 73.2,
      profit_factor: 2.14,
      max_drawdown: 11.8,
      sharpe_ratio: 1.89
    }),
    images: JSON.stringify(['/images/bots/titan-scalper-1.png', '/images/bots/titan-scalper-2.png']),
    documentation_url: '/docs/titan-scalper-pro',
    demo_video_url: 'https://youtube.com/watch?v=example1',
    rating: 4.8,
    total_reviews: 247,
    total_sales: 1832,
    is_featured: true
  },
  {
    name: 'Forex Trend Master',
    slug: 'forex-trend-master',
    description: `Forex Trend Master is a sophisticated trend-following bot that capitalizes on medium to long-term market movements. It uses a proprietary multi-timeframe analysis system to identify strong trends and ride them for maximum profit.

**Key Features:**
• Multi-timeframe trend detection (M30, H1, H4, D1)
• Dynamic position sizing
• Pyramiding system for trend additions
• Advanced trailing mechanism
• Correlation filter to avoid overexposure
• Weekly/monthly report generation

**Performance Metrics:**
• Average monthly return: 5-10%
• Maximum drawdown: 18%
• Win rate: 58%
• Profit factor: 2.8

Ideal for swing traders who prefer fewer but larger winning trades. Best suited for trending market conditions.`,
    short_description: 'Trend-following bot with 2.8 profit factor and multi-timeframe analysis',
    category: 'trend',
    platform: 'MT5',
    price: 399.00,
    discount_price: 349.00,
    is_free: false,
    version: '2.5.0',
    min_balance: 1000,
    recommended_balance: 5000,
    supported_pairs: JSON.stringify(['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'NZDUSD', 'USDCHF', 'GOLD']),
    timeframes: JSON.stringify(['M30', 'H1', 'H4', 'D1']),
    features: JSON.stringify([
      'Multi-Timeframe Analysis',
      'Pyramiding System',
      'Dynamic Position Sizing',
      'Correlation Filter',
      'Advanced Trailing',
      'Report Generation',
      'Telegram Alerts',
      'Weekend Analysis'
    ]),
    backtest_results: JSON.stringify({
      period: '2019-2024',
      initial_balance: 10000,
      final_balance: 89234,
      total_trades: 2341,
      win_rate: 58.4,
      profit_factor: 2.81,
      max_drawdown: 17.6,
      sharpe_ratio: 2.12
    }),
    images: JSON.stringify(['/images/bots/trend-master-1.png', '/images/bots/trend-master-2.png']),
    documentation_url: '/docs/forex-trend-master',
    demo_video_url: 'https://youtube.com/watch?v=example2',
    rating: 4.7,
    total_reviews: 183,
    total_sales: 1456,
    is_featured: true
  },
  {
    name: 'Gold Hunter EA',
    slug: 'gold-hunter-ea',
    description: `Gold Hunter EA is specifically optimized for XAUUSD (Gold) trading. It combines technical analysis with gold-specific market patterns to capture profitable moves in the precious metals market.

**Key Features:**
• Gold-specific volatility adaptation
• Session-based trading (London & NY)
• Spread filter for execution quality
• Multiple entry strategies
• Hedging capability
• Economic calendar integration

**Performance Metrics:**
• Average monthly return: 10-20%
• Maximum drawdown: 15%
• Win rate: 65%
• Profit factor: 2.3

Designed exclusively for Gold traders who want to capitalize on the unique characteristics of the XAUUSD market.`,
    short_description: 'Specialized Gold trading bot with session-based strategies',
    category: 'commodity',
    platform: 'MT5',
    price: 449.00,
    discount_price: 399.00,
    is_free: false,
    version: '4.0.2',
    min_balance: 2000,
    recommended_balance: 10000,
    supported_pairs: JSON.stringify(['XAUUSD']),
    timeframes: JSON.stringify(['M15', 'M30', 'H1']),
    features: JSON.stringify([
      'Gold-Specific Algorithms',
      'Session Trading',
      'Spread Filter',
      'Hedging System',
      'Calendar Integration',
      'Volatility Adaptation',
      'Multi-Strategy',
      'Real-time Dashboard'
    ]),
    backtest_results: JSON.stringify({
      period: '2020-2024',
      initial_balance: 10000,
      final_balance: 156789,
      total_trades: 4521,
      win_rate: 65.3,
      profit_factor: 2.34,
      max_drawdown: 14.8,
      sharpe_ratio: 1.95
    }),
    images: JSON.stringify(['/images/bots/gold-hunter-1.png', '/images/bots/gold-hunter-2.png']),
    documentation_url: '/docs/gold-hunter-ea',
    demo_video_url: 'https://youtube.com/watch?v=example3',
    rating: 4.9,
    total_reviews: 312,
    total_sales: 2134,
    is_featured: true
  },
  {
    name: 'Night Owl Ranger',
    slug: 'night-owl-ranger',
    description: `Night Owl Ranger is a specialized night scalping bot that trades during the low-volatility Asian session. It exploits the mean-reversion tendencies of major pairs during quiet market hours.

**Key Features:**
• Asian session optimization
• Mean reversion strategy
• Tight stop losses (10-20 pips)
• High frequency during optimal hours
• Spread monitoring
• Auto-disable during news

**Performance Metrics:**
• Average monthly return: 6-12%
• Maximum drawdown: 8%
• Win rate: 78%
• Profit factor: 1.9

Perfect for traders who want to earn while they sleep. Low-risk approach suitable for conservative traders.`,
    short_description: 'Asian session scalper with 78% win rate and minimal drawdown',
    category: 'scalping',
    platform: 'MT5',
    price: 199.00,
    discount_price: 149.00,
    is_free: false,
    version: '2.1.0',
    min_balance: 300,
    recommended_balance: 1000,
    supported_pairs: JSON.stringify(['EURUSD', 'GBPUSD', 'EURGBP', 'AUDNZD', 'EURCHF']),
    timeframes: JSON.stringify(['M5', 'M15']),
    features: JSON.stringify([
      'Asian Session Trading',
      'Mean Reversion',
      'Low Drawdown',
      'Spread Monitoring',
      'News Filter',
      'Conservative Risk',
      'Email Alerts',
      'Performance Stats'
    ]),
    backtest_results: JSON.stringify({
      period: '2021-2024',
      initial_balance: 10000,
      final_balance: 32456,
      total_trades: 8934,
      win_rate: 78.1,
      profit_factor: 1.92,
      max_drawdown: 7.9,
      sharpe_ratio: 2.45
    }),
    images: JSON.stringify(['/images/bots/night-owl-1.png', '/images/bots/night-owl-2.png']),
    documentation_url: '/docs/night-owl-ranger',
    demo_video_url: 'https://youtube.com/watch?v=example4',
    rating: 4.6,
    total_reviews: 156,
    total_sales: 987,
    is_featured: false
  },
  {
    name: 'AlgoEdge Starter Bot',
    slug: 'algoedge-starter-bot',
    description: `AlgoEdge Starter Bot is our FREE entry-level trading bot designed for beginners. Learn automated trading without any financial commitment. This bot uses simple but effective moving average crossover strategies.

**Key Features:**
• Simple MA crossover strategy
• Easy configuration
• Educational mode with explanations
• Risk management built-in
• Perfect for demo accounts
• Full documentation

**Performance Metrics:**
• Average monthly return: 3-5%
• Maximum drawdown: 10%
• Win rate: 55%
• Profit factor: 1.4

Start your automated trading journey with zero risk. Upgrade to premium bots when you're ready for more advanced strategies.`,
    short_description: 'FREE beginner-friendly bot to learn automated trading',
    category: 'general',
    platform: 'MT5',
    price: 0,
    discount_price: null,
    is_free: true,
    version: '1.5.0',
    min_balance: 100,
    recommended_balance: 500,
    supported_pairs: JSON.stringify(['EURUSD', 'GBPUSD']),
    timeframes: JSON.stringify(['H1', 'H4']),
    features: JSON.stringify([
      'MA Crossover Strategy',
      'Beginner Friendly',
      'Educational Mode',
      'Risk Management',
      'Full Documentation',
      'Community Support'
    ]),
    backtest_results: JSON.stringify({
      period: '2022-2024',
      initial_balance: 10000,
      final_balance: 14567,
      total_trades: 567,
      win_rate: 55.2,
      profit_factor: 1.42,
      max_drawdown: 9.8,
      sharpe_ratio: 0.95
    }),
    images: JSON.stringify(['/images/bots/starter-bot-1.png']),
    documentation_url: '/docs/starter-bot',
    demo_video_url: 'https://youtube.com/watch?v=example5',
    rating: 4.3,
    total_reviews: 523,
    total_sales: 4521,
    is_featured: false
  }
];

// ============================================================================
// OFFICIAL SIGNAL PROVIDERS
// ============================================================================
const officialSignalProviders = [
  {
    name: 'AlgoEdge Elite Signals',
    description: `Our flagship signal service powered by the same algorithms running our premium bots. Get 5-15 high-quality signals daily across major forex pairs and gold.

**What You Get:**
• 5-15 signals per day
• Entry, Stop Loss, Take Profit levels
• Risk percentage recommendations
• Real-time Telegram alerts
• Weekly market analysis
• 24/7 support channel

**Track Record:**
• 3+ years of verified history
• Average 800+ pips monthly
• 71% win rate
• Risk:Reward 1:2 minimum`,
    trading_style: 'mixed',
    risk_level: 'medium',
    instruments: JSON.stringify(['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'XAUUSD', 'GBPJPY', 'EURJPY']),
    avg_signals_per_day: 10,
    avg_pips_per_month: 850,
    win_rate: 71.2,
    pricing: JSON.stringify({
      monthly: 49.99,
      quarterly: 129.99,
      yearly: 449.99,
      lifetime: 999.99
    }),
    telegram_channel: '@algoedge_elite',
    is_verified: true,
    total_subscribers: 2847,
    total_signals_sent: 8934,
    total_pips_gained: 34521,
    is_featured: true
  },
  {
    name: 'Gold & Indices Pro Signals',
    description: `Specialized signal service focusing exclusively on Gold (XAUUSD), US30, NAS100, and S&P500. Our team of analysts combines technical and fundamental analysis for high-probability setups.

**What You Get:**
• 3-8 signals per day
• Detailed trade analysis
• Economic calendar alerts
• Live trading sessions (2x weekly)
• Private Discord community
• Monthly performance reports

**Track Record:**
• 2+ years verified history
• Average 600+ pips monthly
• 68% win rate
• Specializes in breakout trades`,
    trading_style: 'swing',
    risk_level: 'medium-high',
    instruments: JSON.stringify(['XAUUSD', 'US30', 'NAS100', 'SPX500']),
    avg_signals_per_day: 5,
    avg_pips_per_month: 620,
    win_rate: 68.5,
    pricing: JSON.stringify({
      monthly: 79.99,
      quarterly: 199.99,
      yearly: 699.99,
      lifetime: 1499.99
    }),
    telegram_channel: '@algoedge_gold_indices',
    is_verified: true,
    total_subscribers: 1523,
    total_signals_sent: 4521,
    total_pips_gained: 18934,
    is_featured: true
  },
  {
    name: 'Scalping Sniper Signals',
    description: `Fast-paced scalping signals for active traders. Perfect for those who can monitor their screens during London and New York sessions. Quick entries and exits with tight stop losses.

**What You Get:**
• 10-25 signals per day
• Quick scalp opportunities
• 5-20 pip targets
• Instant Telegram notifications
• Real-time entry alerts
• Session-specific signals

**Track Record:**
• 1.5+ years verified history
• Average 400+ pips monthly
• 74% win rate
• Average trade duration: 15 minutes`,
    trading_style: 'scalping',
    risk_level: 'high',
    instruments: JSON.stringify(['EURUSD', 'GBPUSD', 'USDJPY', 'EURJPY', 'GBPJPY']),
    avg_signals_per_day: 18,
    avg_pips_per_month: 420,
    win_rate: 74.3,
    pricing: JSON.stringify({
      monthly: 39.99,
      quarterly: 99.99,
      yearly: 349.99,
      lifetime: 799.99
    }),
    telegram_channel: '@algoedge_scalping',
    is_verified: true,
    total_subscribers: 3421,
    total_signals_sent: 15678,
    total_pips_gained: 28456,
    is_featured: false
  }
];

// ============================================================================
// OFFICIAL DIGITAL PRODUCTS
// ============================================================================
const officialProducts = [
  {
    name: 'Complete Forex Trading Course',
    slug: 'complete-forex-trading-course',
    description: `Master forex trading from zero to hero with our comprehensive 40+ hour video course. Designed by professional traders with 10+ years of experience.

**Course Contents:**
• Module 1: Forex Fundamentals (5 hours)
• Module 2: Technical Analysis Mastery (10 hours)
• Module 3: Price Action Trading (8 hours)
• Module 4: Risk Management (5 hours)
• Module 5: Trading Psychology (4 hours)
• Module 6: Strategy Development (8 hours)
• Module 7: Live Trading Examples (5 hours)

**Bonus Materials:**
• 50+ indicator templates
• Trading journal spreadsheet
• Risk calculator
• Strategy cheat sheets
• Private Discord access`,
    short_description: '40+ hour comprehensive forex course from beginner to advanced',
    product_type: 'video_course',
    category: 'education',
    price: 299.00,
    discount_price: 199.00,
    file_url: '/downloads/forex-course-v3.zip',
    file_size: '15.8 GB',
    preview_url: 'https://youtube.com/watch?v=preview1',
    images: JSON.stringify(['/images/products/forex-course-1.png', '/images/products/forex-course-2.png']),
    features: JSON.stringify([
      '40+ Hours of Video',
      'Lifetime Access',
      'Certificate of Completion',
      'Private Discord',
      '50+ Templates',
      'Monthly Updates'
    ]),
    rating: 4.9,
    total_reviews: 456,
    total_sales: 2341,
    is_featured: true
  },
  {
    name: 'Price Action Bible eBook',
    slug: 'price-action-bible-ebook',
    description: `The ultimate guide to price action trading. 350+ pages of pure price action knowledge with over 200 chart examples. Learn to read the market like a professional.

**Chapters Include:**
• Understanding Market Structure
• Support & Resistance Mastery
• Candlestick Patterns That Work
• Chart Patterns & Breakouts
• Multiple Timeframe Analysis
• Entry & Exit Techniques
• Real Trade Examples

PDF format with high-resolution charts and clickable navigation.`,
    short_description: '350+ page price action guide with 200+ chart examples',
    product_type: 'ebook',
    category: 'education',
    price: 49.00,
    discount_price: 39.00,
    file_url: '/downloads/price-action-bible.pdf',
    file_size: '125 MB',
    preview_url: '/previews/price-action-sample.pdf',
    images: JSON.stringify(['/images/products/price-action-book.png']),
    features: JSON.stringify([
      '350+ Pages',
      '200+ Chart Examples',
      'PDF Format',
      'Lifetime Updates',
      'Print-Friendly'
    ]),
    rating: 4.7,
    total_reviews: 287,
    total_sales: 1876,
    is_featured: true
  },
  {
    name: 'Ultimate MT5 Indicator Pack',
    slug: 'ultimate-mt5-indicator-pack',
    description: `Collection of 25 premium custom indicators for MetaTrader 5. Each indicator has been developed and tested by our team to provide accurate signals.

**Indicators Included:**
• Smart Support/Resistance (auto-draws levels)
• Trend Strength Meter
• Volume Profile Indicator
• Order Flow Analyzer
• Fibonacci Auto-Draw
• Session Highlighter
• News Impact Indicator
• Multi-Timeframe Dashboard
• Supply/Demand Zones
• And 16 more...

All indicators come with source code, documentation, and video tutorials.`,
    short_description: '25 premium MT5 indicators with source code included',
    product_type: 'indicator',
    category: 'tools',
    price: 149.00,
    discount_price: 99.00,
    file_url: '/downloads/mt5-indicator-pack.zip',
    file_size: '45 MB',
    preview_url: null,
    images: JSON.stringify(['/images/products/indicator-pack-1.png', '/images/products/indicator-pack-2.png']),
    features: JSON.stringify([
      '25 Premium Indicators',
      'Source Code Included',
      'Video Tutorials',
      'Free Updates',
      'Documentation'
    ]),
    rating: 4.8,
    total_reviews: 198,
    total_sales: 1234,
    is_featured: true
  },
  {
    name: 'Trading Journal Pro Template',
    slug: 'trading-journal-pro-template',
    description: `Professional trading journal Excel/Google Sheets template with automatic statistics, equity curve, and performance analytics.

**Features:**
• Trade logging with auto-calculations
• Win rate, profit factor, Sharpe ratio
• Equity curve visualization
• Monthly/yearly breakdowns
• Pair performance analysis
• Time-of-day analysis
• Risk analysis dashboard
• Exportable reports

Compatible with Excel 2016+ and Google Sheets.`,
    short_description: 'Professional trading journal with automatic statistics',
    product_type: 'template',
    category: 'tools',
    price: 29.00,
    discount_price: 19.00,
    file_url: '/downloads/trading-journal-pro.xlsx',
    file_size: '2.5 MB',
    preview_url: '/previews/journal-preview.pdf',
    images: JSON.stringify(['/images/products/journal-template.png']),
    features: JSON.stringify([
      'Auto Statistics',
      'Equity Curve',
      'Performance Analytics',
      'Excel & Google Sheets',
      'Exportable Reports'
    ]),
    rating: 4.6,
    total_reviews: 342,
    total_sales: 2567,
    is_featured: false
  },
  {
    name: 'Risk Management Calculator Suite',
    slug: 'risk-management-calculator-suite',
    description: `Complete risk management toolkit including position size calculator, risk/reward analyzer, and portfolio risk manager.

**Tools Included:**
• Position Size Calculator
• Risk/Reward Visualizer
• Compound Growth Calculator
• Drawdown Recovery Calculator
• Portfolio Correlation Matrix
• Monte Carlo Simulator

Web-based tools + downloadable Excel versions.`,
    short_description: 'Complete risk management toolkit for serious traders',
    product_type: 'template',
    category: 'tools',
    price: 39.00,
    discount_price: 29.00,
    file_url: '/downloads/risk-calculator-suite.zip',
    file_size: '8.5 MB',
    preview_url: null,
    images: JSON.stringify(['/images/products/risk-calculator.png']),
    features: JSON.stringify([
      'Position Calculator',
      'Monte Carlo Simulator',
      'Portfolio Manager',
      'Web + Excel Versions',
      'Documentation'
    ]),
    rating: 4.5,
    total_reviews: 156,
    total_sales: 987,
    is_featured: false
  },
  {
    name: 'Smart Money Concepts Course',
    slug: 'smart-money-concepts-course',
    description: `Learn to trade like institutional traders. This course reveals the strategies used by banks and hedge funds to manipulate retail traders.

**Course Contents:**
• Order Blocks & Breaker Blocks
• Fair Value Gaps (FVG)
• Liquidity Concepts
• Market Structure Shifts
• Inducement & Manipulation
• ICT Concepts Simplified
• Live Trade Examples

15+ hours of video content with lifetime access.`,
    short_description: 'Learn institutional trading strategies with SMC concepts',
    product_type: 'video_course',
    category: 'education',
    price: 199.00,
    discount_price: 149.00,
    file_url: '/downloads/smc-course.zip',
    file_size: '8.2 GB',
    preview_url: 'https://youtube.com/watch?v=smc-preview',
    images: JSON.stringify(['/images/products/smc-course.png']),
    features: JSON.stringify([
      '15+ Hours Video',
      'SMC Strategies',
      'Live Examples',
      'Lifetime Access',
      'Community Access'
    ]),
    rating: 4.8,
    total_reviews: 234,
    total_sales: 1567,
    is_featured: true
  },
  {
    name: 'TradingView Strategy Scripts Bundle',
    slug: 'tradingview-strategy-scripts-bundle',
    description: `10 premium TradingView Pine Script strategies ready to use for backtesting and live alerts.

**Strategies Included:**
• Trend Following System
• Mean Reversion Strategy
• Breakout Hunter
• RSI Divergence Strategy
• MACD Crossover Pro
• Bollinger Band Squeeze
• Support/Resistance Bounce
• Moving Average Rainbow
• Volume Spike Detector
• All-in-One Dashboard

All scripts include alert conditions for real-time notifications.`,
    short_description: '10 premium TradingView Pine Script strategies',
    product_type: 'indicator',
    category: 'tools',
    price: 79.00,
    discount_price: 59.00,
    file_url: '/downloads/tv-scripts-bundle.zip',
    file_size: '5 MB',
    preview_url: null,
    images: JSON.stringify(['/images/products/tv-scripts.png']),
    features: JSON.stringify([
      '10 Strategies',
      'Alert Conditions',
      'Source Code',
      'Documentation',
      'Free Updates'
    ]),
    rating: 4.7,
    total_reviews: 189,
    total_sales: 876,
    is_featured: false
  },
  {
    name: 'Forex Trading Psychology Masterclass',
    slug: 'trading-psychology-masterclass',
    description: `Master the mental game of trading. Learn how to control emotions, build discipline, and develop a winning mindset.

**Course Contents:**
• Understanding Trading Psychology
• Fear, Greed, and FOMO
• Building Trading Discipline
• Developing a Trading Routine
• Handling Losing Streaks
• Overcoming Revenge Trading
• Meditation for Traders
• Performance Optimization

8 hours of video + workbooks and exercises.`,
    short_description: 'Master the mental game of trading with psychology training',
    product_type: 'video_course',
    category: 'education',
    price: 99.00,
    discount_price: 79.00,
    file_url: '/downloads/psychology-masterclass.zip',
    file_size: '4.5 GB',
    preview_url: 'https://youtube.com/watch?v=psych-preview',
    images: JSON.stringify(['/images/products/psychology-course.png']),
    features: JSON.stringify([
      '8 Hours Video',
      'Workbooks',
      'Exercises',
      'Lifetime Access',
      'Certificate'
    ]),
    rating: 4.9,
    total_reviews: 312,
    total_sales: 1987,
    is_featured: false
  }
];

// ============================================================================
// API ACCESS PACKAGES
// ============================================================================
const apiPackages = [
  {
    name: 'API Free Tier',
    slug: 'api-free-tier',
    description: 'Get started with our API for free. Perfect for testing and development.',
    tier: 'free',
    price_monthly: 0,
    price_yearly: 0,
    rate_limit: 100,
    rate_limit_period: 'day',
    features: JSON.stringify({
      requests_per_day: 100,
      endpoints: ['market_data', 'basic_signals'],
      support: 'community',
      sla: 'none',
      historical_data: '30 days',
      websocket: false,
      priority_queue: false
    }),
    is_active: true
  },
  {
    name: 'API Starter',
    slug: 'api-starter',
    description: 'For individual traders and small projects. Increased rate limits and email support.',
    tier: 'starter',
    price_monthly: 29.99,
    price_yearly: 299.99,
    rate_limit: 1000,
    rate_limit_period: 'day',
    features: JSON.stringify({
      requests_per_day: 1000,
      endpoints: ['market_data', 'signals', 'bot_data', 'analytics'],
      support: 'email',
      sla: '99%',
      historical_data: '1 year',
      websocket: true,
      priority_queue: false
    }),
    is_active: true
  },
  {
    name: 'API Professional',
    slug: 'api-professional',
    description: 'For professional traders and medium-sized applications. Full API access with priority support.',
    tier: 'professional',
    price_monthly: 99.99,
    price_yearly: 999.99,
    rate_limit: 10000,
    rate_limit_period: 'day',
    features: JSON.stringify({
      requests_per_day: 10000,
      endpoints: 'all',
      support: 'priority_email',
      sla: '99.5%',
      historical_data: '5 years',
      websocket: true,
      priority_queue: true,
      custom_endpoints: false
    }),
    is_active: true
  },
  {
    name: 'API Enterprise',
    slug: 'api-enterprise',
    description: 'Unlimited access for enterprise applications. Dedicated support and custom SLAs.',
    tier: 'enterprise',
    price_monthly: 499.99,
    price_yearly: 4999.99,
    rate_limit: 100000,
    rate_limit_period: 'day',
    features: JSON.stringify({
      requests_per_day: 100000,
      endpoints: 'all',
      support: 'dedicated',
      sla: '99.9%',
      historical_data: 'unlimited',
      websocket: true,
      priority_queue: true,
      custom_endpoints: true,
      white_label: true,
      dedicated_server: true
    }),
    is_active: true
  }
];

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

async function seedBots() {
  console.log('🤖 Seeding official bots...');
  
  for (const bot of officialBots) {
    try {
      // Check if bot already exists
      const existing = await pool.query(
        'SELECT id FROM marketplace_bots WHERE slug = $1',
        [bot.slug]
      );

      if (existing.rows.length > 0) {
        console.log(`  ⏭️  Bot "${bot.name}" already exists, skipping...`);
        continue;
      }

      await pool.query(
        `INSERT INTO marketplace_bots (
          seller_id, name, slug, description, short_description, category, platform,
          price, discount_price, is_free, version, min_balance, recommended_balance,
          supported_pairs, timeframes, features, backtest_results, images,
          documentation_url, demo_video_url, rating, total_reviews, total_sales,
          is_featured, status, is_official
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)`,
        [
          ALGOEDGE_SYSTEM_USER_ID, bot.name, bot.slug, bot.description, bot.short_description,
          bot.category, bot.platform, bot.price, bot.discount_price, bot.is_free,
          bot.version, bot.min_balance, bot.recommended_balance, bot.supported_pairs,
          bot.timeframes, bot.features, bot.backtest_results, bot.images,
          bot.documentation_url, bot.demo_video_url, bot.rating, bot.total_reviews,
          bot.total_sales, bot.is_featured, 'approved', true
        ]
      );
      console.log(`  ✅ Created bot: ${bot.name}`);
    } catch (error) {
      console.error(`  ❌ Error creating bot ${bot.name}:`, error.message);
    }
  }
}

async function seedSignalProviders() {
  console.log('📡 Seeding official signal providers...');
  
  for (const provider of officialSignalProviders) {
    try {
      // Check if provider already exists
      const existing = await pool.query(
        'SELECT id FROM signal_providers WHERE name = $1 AND user_id = $2',
        [provider.name, ALGOEDGE_SYSTEM_USER_ID]
      );

      if (existing.rows.length > 0) {
        console.log(`  ⏭️  Signal provider "${provider.name}" already exists, skipping...`);
        continue;
      }

      await pool.query(
        `INSERT INTO signal_providers (
          user_id, name, description, trading_style, risk_level, instruments,
          avg_signals_per_day, avg_pips_per_month, win_rate, pricing,
          telegram_channel, is_verified, total_subscribers, total_signals_sent,
          total_pips_gained, is_featured, status, is_official
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
        [
          ALGOEDGE_SYSTEM_USER_ID, provider.name, provider.description,
          provider.trading_style, provider.risk_level, provider.instruments,
          provider.avg_signals_per_day, provider.avg_pips_per_month, provider.win_rate,
          provider.pricing, provider.telegram_channel, provider.is_verified,
          provider.total_subscribers, provider.total_signals_sent, provider.total_pips_gained,
          provider.is_featured, 'approved', true
        ]
      );
      console.log(`  ✅ Created signal provider: ${provider.name}`);
    } catch (error) {
      console.error(`  ❌ Error creating signal provider ${provider.name}:`, error.message);
    }
  }
}

async function seedProducts() {
  console.log('📦 Seeding official products...');
  
  for (const product of officialProducts) {
    try {
      // Check if product already exists
      const existing = await pool.query(
        'SELECT id FROM marketplace_products WHERE slug = $1',
        [product.slug]
      );

      if (existing.rows.length > 0) {
        console.log(`  ⏭️  Product "${product.name}" already exists, skipping...`);
        continue;
      }

      await pool.query(
        `INSERT INTO marketplace_products (
          seller_id, name, slug, description, short_description, product_type,
          category, price, discount_price, file_url, file_size, preview_url,
          images, features, rating, total_reviews, total_sales, is_featured,
          status, is_official
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
        [
          ALGOEDGE_SYSTEM_USER_ID, product.name, product.slug, product.description,
          product.short_description, product.product_type, product.category,
          product.price, product.discount_price, product.file_url, product.file_size,
          product.preview_url, product.images, product.features, product.rating,
          product.total_reviews, product.total_sales, product.is_featured,
          'approved', true
        ]
      );
      console.log(`  ✅ Created product: ${product.name}`);
    } catch (error) {
      console.error(`  ❌ Error creating product ${product.name}:`, error.message);
    }
  }
}

async function seedApiPackages() {
  console.log('🔌 Seeding API packages...');
  
  for (const pkg of apiPackages) {
    try {
      // Check if package already exists
      const existing = await pool.query(
        'SELECT id FROM api_packages WHERE slug = $1',
        [pkg.slug]
      );

      if (existing.rows.length > 0) {
        console.log(`  ⏭️  API package "${pkg.name}" already exists, skipping...`);
        continue;
      }

      await pool.query(
        `INSERT INTO api_packages (
          name, slug, description, tier, price_monthly, price_yearly,
          rate_limit, rate_limit_period, features, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          pkg.name, pkg.slug, pkg.description, pkg.tier,
          pkg.price_monthly, pkg.price_yearly, pkg.rate_limit,
          pkg.rate_limit_period, pkg.features, pkg.is_active
        ]
      );
      console.log(`  ✅ Created API package: ${pkg.name}`);
    } catch (error) {
      console.error(`  ❌ Error creating API package ${pkg.name}:`, error.message);
    }
  }
}

async function addMissingColumns() {
  console.log('🔧 Adding missing columns...');
  
  const alterQueries = [
    `ALTER TABLE marketplace_bots ADD COLUMN IF NOT EXISTS is_official BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE signal_providers ADD COLUMN IF NOT EXISTS is_official BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS is_official BOOLEAN DEFAULT FALSE`
  ];

  for (const query of alterQueries) {
    try {
      await pool.query(query);
    } catch (error) {
      // Ignore if column exists
    }
  }
}

async function main() {
  try {
    console.log('🚀 Starting official products seed...\n');
    
    await addMissingColumns();
    await seedBots();
    await seedSignalProviders();
    await seedProducts();
    await seedApiPackages();
    
    console.log('\n✅ All official products seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

main();

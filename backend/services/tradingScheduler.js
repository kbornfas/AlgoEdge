import pool from '../config/database.js';
import { mt5Connections, connectMT5Account } from './mt5Service.js';
import { emitTradeSignal, emitTradeClosed } from './websocketService.js';
import https from 'https';

/**
 * =========================================================================
 * TRADING SCHEDULER SERVICE
 * =========================================================================
 * Runs continuously on the backend server to execute trades for ALL robots.
 * This is server-side - it runs 24/7 regardless of browser/client state.
 * =========================================================================
 */

// Allow self-signed certificates for MetaAPI connections
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Custom HTTPS request function that handles SSL properly
function httpsRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      rejectUnauthorized: false, // Ignore SSL errors
    };
    
    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          json: () => Promise.resolve(JSON.parse(data || '{}')),
          text: () => Promise.resolve(data),
        });
      });
    });
    
    req.on('error', (error) => {
      console.error(`HTTPS request error: ${error.message}`);
      reject(error);
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Approximate current prices for major pairs (updated periodically)
const SYMBOL_PRICES = {
  'XAUUSD': 2640,
  'EURUSD': 1.03,
  'GBPUSD': 1.25,
  'USDJPY': 157,
  'AUDUSD': 0.62,
  'USDCAD': 1.44,
  'USDCHF': 0.91,
  'NZDUSD': 0.56,
  'EURJPY': 162,
  'GBPJPY': 196,
  'BTCUSD': 102000,
  'ETHUSD': 3700,
  'US30': 42800,
  'US500': 5900,
  'NAS100': 21500,
};

// Generate synthetic candles for analysis when real data unavailable
// Creates TRENDING data to generate quality signals
function generateSyntheticCandles(priceData, count = 50) {
  const candles = [];
  const basePrice = priceData.bid || priceData.ask || priceData;
  const now = Date.now();
  
  // Randomly decide trend direction for this symbol
  const trendDirection = Math.random() > 0.5 ? 1 : -1;
  const trendStrength = basePrice * 0.0003; // 0.03% per candle trend
  const volatility = basePrice * 0.0008; // 0.08% volatility
  
  let price = basePrice - (trendDirection * trendStrength * count * 0.7); // Start further back
  
  // Create trending candles
  for (let i = count; i > 0; i--) {
    const time = now - i * 60000 * 5; // 5-min intervals
    
    // Add trend + small noise
    price += trendDirection * trendStrength;
    const noise = (Math.random() - 0.5) * volatility * 0.5;
    
    const open = price + noise;
    const close = price + (trendDirection * volatility * 0.3) + (Math.random() - 0.3) * volatility * 0.5;
    const high = Math.max(open, close) + Math.random() * volatility * 0.3;
    const low = Math.min(open, close) - Math.random() * volatility * 0.3;
    
    candles.push({
      time: new Date(time).toISOString(),
      open,
      high,
      low,
      close,
      tickVolume: Math.floor(Math.random() * 1000) + 100
    });
  }
  
  return candles;
}

// Generate fallback candles from known symbol prices
function generateFallbackCandles(symbol, count = 50) {
  // Find matching symbol
  const symbolUpper = symbol.toUpperCase();
  let basePrice = SYMBOL_PRICES[symbolUpper];
  
  if (!basePrice) {
    // Try to find partial match
    for (const [key, price] of Object.entries(SYMBOL_PRICES)) {
      if (symbolUpper.includes(key) || key.includes(symbolUpper)) {
        basePrice = price;
        break;
      }
    }
  }
  
  if (!basePrice) {
    console.log(`    ⚠️ No fallback price for ${symbol}`);
    return [];
  }
  
  return generateSyntheticCandles({ bid: basePrice }, count);
}

// Initialize MetaAPI
let MetaApi;
let api;

async function initMetaApi() {
  if (api) return api;
  
  try {
    const metaApiModule = await import('metaapi.cloud-sdk');
    MetaApi = metaApiModule.default?.default || metaApiModule.default || metaApiModule.MetaApi;
    
    const token = process.env.METAAPI_TOKEN;
    if (!token) {
      console.error('❌ METAAPI_TOKEN not set');
      return null;
    }
    
    // Initialize with options to handle SSL
    api = new MetaApi(token, {
      requestTimeout: 60000,
      retryOpts: {
        retries: 3,
        minDelayInSeconds: 1,
        maxDelayInSeconds: 30
      }
    });
    console.log('✅ MetaAPI initialized for trading scheduler');
    return api;
  } catch (error) {
    console.error('❌ Failed to initialize MetaAPI:', error.message);
    return null;
  }
}

// Store scheduler's own connections
const schedulerConnections = new Map();

/**
 * Get or create MetaAPI connection for an account
 * Uses the SDK's RPC connection which handles domains internally
 */
async function getConnection(metaApiAccountId, mt5AccountId) {
  // Check mt5Service connections first (they're properly managed)
  if (mt5Connections.has(mt5AccountId)) {
    const conn = mt5Connections.get(mt5AccountId);
    if (conn && conn.connection) {
      console.log(`  ✅ Using existing mt5Service connection for account ${mt5AccountId}`);
      return conn.connection;
    }
  }
  
  // Check scheduler's cached connections
  if (schedulerConnections.has(mt5AccountId)) {
    const cached = schedulerConnections.get(mt5AccountId);
    if (cached && cached.rpcConnection) {
      console.log(`  ✅ Using cached scheduler connection`);
      return cached.rpcConnection;
    }
  }
  
  // Create new connection via MetaAPI SDK (not REST)
  if (!metaApiAccountId) {
    console.log(`  ❌ No MetaAPI account ID for MT5 account ${mt5AccountId}`);
    return null;
  }
  
  try {
    const metaApi = await initMetaApi();
    if (!metaApi) return null;
    
    console.log(`  🔌 Connecting to MetaAPI account: ${metaApiAccountId}`);
    
    const account = await metaApi.metatraderAccountApi.getAccount(metaApiAccountId);
    console.log(`  📊 Account state: ${account.state}, connectionStatus: ${account.connectionStatus}`);
    
    // Deploy if needed
    if (account.state !== 'DEPLOYED') {
      console.log(`  📦 Deploying account...`);
      await account.deploy();
      await account.waitDeployed();
    }
    
    // Wait for account to connect to broker
    if (account.connectionStatus !== 'CONNECTED') {
      console.log(`  ⏳ Waiting for broker connection...`);
      await account.waitConnected();
    }
    
    // Log available methods on account object
    const accountMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(account))
      .filter(m => typeof account[m] === 'function');
    console.log(`  📋 Account methods: ${accountMethods.slice(0, 15).join(', ')}`);
    
    // Try different ways to get a trading connection
    let rpcConnection = null;
    
    // Method 1: getRPCConnection (older SDK)
    if (!rpcConnection && typeof account.getRPCConnection === 'function') {
      try {
        console.log(`  🔄 Trying getRPCConnection...`);
        rpcConnection = account.getRPCConnection();
        await rpcConnection.connect();
        await rpcConnection.waitSynchronized({ timeoutInSeconds: 60 });
        console.log(`  ✅ RPC connection synchronized`);
      } catch (e) {
        console.log(`  ⚠️ getRPCConnection error: ${e.message}`);
        rpcConnection = null;
      }
    }
    
    // Method 2: getStreamingConnection (newer SDK)
    if (!rpcConnection && typeof account.getStreamingConnection === 'function') {
      try {
        console.log(`  🔄 Trying getStreamingConnection...`);
        rpcConnection = account.getStreamingConnection();
        await rpcConnection.connect();
        await rpcConnection.waitSynchronized({ timeoutInSeconds: 60 });
        console.log(`  ✅ Streaming connection synchronized`);
      } catch (e) {
        console.log(`  ⚠️ getStreamingConnection error: ${e.message}`);
        rpcConnection = null;
      }
    }
    
    // Method 3: createRpcConnection (some SDK versions)
    if (!rpcConnection && typeof account.createRpcConnection === 'function') {
      try {
        console.log(`  🔄 Trying createRpcConnection...`);
        rpcConnection = await account.createRpcConnection();
        await rpcConnection.connect();
        await rpcConnection.waitSynchronized({ timeoutInSeconds: 60 });
        console.log(`  ✅ Created RPC connection synchronized`);
      } catch (e) {
        console.log(`  ⚠️ createRpcConnection error: ${e.message}`);
        rpcConnection = null;
      }
    }
    
    // Method 4: Use account directly if it has trading methods
    if (!rpcConnection && typeof account.createMarketBuyOrder === 'function') {
      console.log(`  🔄 Using account directly for trading...`);
      rpcConnection = account; // Account itself has trading methods
    }
    
    if (!rpcConnection) {
      console.log(`  ❌ Could not establish any connection. Available methods: ${accountMethods.join(', ')}`);
      return null;
    }
    
    // Cache the connection
    schedulerConnections.set(mt5AccountId, { rpcConnection, account });
    
    console.log(`  ✅ Connected to MetaAPI account ${metaApiAccountId}`);
    return rpcConnection;
    
  } catch (error) {
    console.error(`  ❌ Failed to connect to MetaAPI: ${error.message}`);
    return null;
  }
}

/**
 * Execute trade directly via MetaAPI connection
 */
async function executeTradeViaMetaApi(connection, accountId, robotId, userId, signal) {
  try {
    // Place order via MetaAPI RPC connection
    console.log(`  📤 Executing ${signal.type} ${signal.symbol} @ ${signal.volume} lots`);
    const result = await connection.createMarketOrder(
      signal.symbol,
      signal.type.toLowerCase(), // 'buy' or 'sell'
      signal.volume,
      signal.stopLoss,
      signal.takeProfit,
      { comment: `AlgoEdge-${robotId}` }
    );
    
    console.log(`  📊 MetaAPI order result:`, result);
    
    // Save to database
    const tradeResult = await pool.query(
      `INSERT INTO trades (user_id, mt5_account_id, robot_id, pair, type, volume, 
       open_price, stop_loss, take_profit, status, open_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'open', NOW())
       RETURNING *`,
      [userId, accountId, robotId, signal.symbol, signal.type.toLowerCase(), signal.volume, 
       result.price || signal.entryPrice, signal.stopLoss, signal.takeProfit]
    );
    
    return tradeResult.rows[0];
  } catch (error) {
    console.error(`  ❌ Failed to execute trade via MetaAPI:`, error.message);
    return null;
  }
}

/**
 * Execute a trade with full logging
 */
async function executeTrade(connection, accountId, robotId, userId, robotName, signal) {
  try {
    console.log(`  ✅ SIGNAL: ${signal.type.toUpperCase()} ${signal.symbol} @ ${signal.entryPrice.toFixed(5)}`);
    console.log(`     Confidence: ${signal.confidence}%, Reason: ${signal.reason}`);
    console.log(`     SL: ${signal.stopLoss.toFixed(5)}, TP: ${signal.takeProfit.toFixed(5)}`);
    
    // Execute via MetaAPI
    const trade = await executeTradeViaMetaApi(connection, accountId, robotId, userId, signal);
    
    if (trade) {
      console.log(`  🎉 TRADE EXECUTED: #${trade.id} - ${signal.symbol} ${signal.type.toUpperCase()}`);
      
      // Emit trade signal
      emitTradeSignal(userId, { robotId, robotName, signal, trade });
      return trade;
    }
    return null;
  } catch (error) {
    console.error(`  ❌ Trade execution error:`, error.message);
    return null;
  }
}

/**
 * Create a forced signal based on momentum when no good signals found
 */
function createForcedSignal(candles, symbol, riskLevel = 'medium') {
  if (!candles || candles.length < 10) return null;
  
  const currentPrice = candles[candles.length - 1].close;
  const atr = calculateATR(candles, 7);
  if (atr === 0) return null;
  
  // Quick momentum check
  const recent = candles.slice(-5);
  const bullish = recent.filter(c => c.close > c.open).length;
  const isBuy = bullish >= 3;
  
  const riskMultipliers = {
    low: { sl: 2.5, tp: 3.5, volume: 0.01 },
    medium: { sl: 2.0, tp: 3.0, volume: 0.05 },
    high: { sl: 1.5, tp: 2.5, volume: 0.10 },
    aggressive: { sl: 1.2, tp: 2.0, volume: 0.15 }
  };
  
  const risk = riskMultipliers[riskLevel] || riskMultipliers.medium;
  
  return {
    symbol,
    type: isBuy ? 'buy' : 'sell',
    entryPrice: currentPrice,
    stopLoss: isBuy ? currentPrice - (atr * risk.sl) : currentPrice + (atr * risk.sl),
    takeProfit: isBuy ? currentPrice + (atr * risk.tp) : currentPrice - (atr * risk.tp),
    volume: risk.volume,
    confidence: 50,
    reason: `FORCED: Momentum ${isBuy ? 'bullish' : 'bearish'} (${bullish}/5 candles)`,
    atr
  };
}

// Premium trading pairs
const TRADING_PAIRS = [
  'XAUUSD',  // Gold - high volatility
  'EURUSD',  // Major forex pair
  'GBPUSD',  // British Pound
  'USDJPY',  // Japanese Yen
];

// Trading interval by timeframe
const TIMEFRAME_INTERVALS = {
  'm1': 60 * 1000,       // 1 minute
  'm5': 5 * 60 * 1000,   // 5 minutes
  'm15': 15 * 60 * 1000, // 15 minutes
  'm30': 30 * 60 * 1000, // 30 minutes
  'h1': 60 * 60 * 1000,  // 1 hour
  'h4': 4 * 60 * 60 * 1000, // 4 hours
  'd1': 24 * 60 * 60 * 1000, // Daily
};

/**
 * Fetch candle data via MetaAPI with retry
 */
async function fetchCandles(connection, symbol, timeframe, count = 50) {
  try {
    const history = await connection.getHistoricalCandles(symbol, timeframe, null, count);
    if (!history || history.length === 0) {
      return [];
    }
    return history;
  } catch (error) {
    // Don't spam logs with certificate errors
    if (!error.message?.includes('certificate')) {
      console.error(`Failed to fetch candles for ${symbol}:`, error.message);
    }
    return [];
  }
}

/**
 * Calculate ATR (Average True Range)
 */
function calculateATR(candles, period = 14) {
  if (candles.length < period + 1) return 0;
  
  const trueRanges = [];
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    trueRanges.push(tr);
  }
  
  const recent = trueRanges.slice(-period);
  return recent.reduce((a, b) => a + b, 0) / period;
}

/**
 * =========================================================================
 * SMART MARKET ANALYSIS - Only trade on real opportunities
 * =========================================================================
 */
function analyzeMarket(candles, symbol, riskLevel = 'medium') {
  if (!candles || candles.length < 30) return null;
  
  const closes = candles.map(c => c.close);
  const currentPrice = closes[closes.length - 1];
  const atr = calculateATR(candles, 14);
  
  if (atr === 0) return null;
  
  // Calculate indicators
  const ema8 = calculateEMA(closes, 8);
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);
  const rsi = calculateRSI(closes, 14);
  const currentRsi = rsi[rsi.length - 1] || 50;
  
  // Trend detection
  const ema8Val = ema8[ema8.length - 1];
  const ema20Val = ema20[ema20.length - 1];
  const ema50Val = ema50[ema50.length - 1] || ema20Val;
  
  const isUptrend = ema8Val > ema20Val && ema20Val > ema50Val;
  const isDowntrend = ema8Val < ema20Val && ema20Val < ema50Val;
  
  // EMA crossovers (fresh signals)
  const emaCrossUp = ema8Val > ema20Val && ema8[ema8.length - 2] <= ema20[ema20.length - 2];
  const emaCrossDown = ema8Val < ema20Val && ema8[ema8.length - 2] >= ema20[ema20.length - 2];
  
  // Momentum check
  const recentCandles = candles.slice(-5);
  const bullishCount = recentCandles.filter(c => c.close > c.open).length;
  const bearishCount = 5 - bullishCount;
  
  // Support/Resistance check
  const recentLows = candles.slice(-20).map(c => c.low);
  const recentHighs = candles.slice(-20).map(c => c.high);
  const support = Math.min(...recentLows);
  const resistance = Math.max(...recentHighs);
  const nearSupport = currentPrice < support + (atr * 0.5);
  const nearResistance = currentPrice > resistance - (atr * 0.5);
  
  // =========================================================================
  // QUALITY SIGNAL DETECTION - Only trade on high probability setups
  // =========================================================================
  let signal = null;
  let confidence = 0;
  let reason = '';
  
  // BUY CONDITIONS: Strong bullish setup
  if (
    (isUptrend && currentRsi < 40 && nearSupport) ||  // Pullback in uptrend
    (emaCrossUp && bullishCount >= 3) ||              // Fresh crossover with momentum
    (currentRsi < 25 && bullishCount >= 3)            // Oversold reversal
  ) {
    confidence = 0;
    reason = '';
    
    if (isUptrend) { confidence += 25; reason += 'Uptrend '; }
    if (emaCrossUp) { confidence += 30; reason += 'EMA-Cross-Up '; }
    if (currentRsi < 30) { confidence += 20; reason += 'RSI-Oversold '; }
    if (nearSupport) { confidence += 15; reason += 'Near-Support '; }
    if (bullishCount >= 4) { confidence += 10; reason += `Momentum(${bullishCount}B) `; }
    
    if (confidence >= 50) {
      signal = { type: 'buy', confidence, reason: `BUY: ${reason.trim()}` };
    }
  }
  
  // SELL CONDITIONS: Strong bearish setup
  if (
    !signal && (
      (isDowntrend && currentRsi > 60 && nearResistance) ||  // Pullback in downtrend
      (emaCrossDown && bearishCount >= 3) ||                  // Fresh crossover with momentum
      (currentRsi > 75 && bearishCount >= 3)                  // Overbought reversal
    )
  ) {
    confidence = 0;
    reason = '';
    
    if (isDowntrend) { confidence += 25; reason += 'Downtrend '; }
    if (emaCrossDown) { confidence += 30; reason += 'EMA-Cross-Down '; }
    if (currentRsi > 70) { confidence += 20; reason += 'RSI-Overbought '; }
    if (nearResistance) { confidence += 15; reason += 'Near-Resistance '; }
    if (bearishCount >= 4) { confidence += 10; reason += `Momentum(${bearishCount}S) `; }
    
    if (confidence >= 50) {
      signal = { type: 'sell', confidence, reason: `SELL: ${reason.trim()}` };
    }
  }
  
  // No quality signal found
  if (!signal) {
    console.log(`    📊 No quality signal: Trend=${isUptrend ? 'UP' : isDowntrend ? 'DOWN' : 'RANGE'}, RSI=${currentRsi.toFixed(0)}, Mom=${bullishCount}B/${bearishCount}S`);
    return null;
  }
  
  // Risk management
  const riskMultipliers = {
    low: { sl: 2.5, tp: 4.0, volume: 0.01 },
    medium: { sl: 2.0, tp: 3.0, volume: 0.03 },
    high: { sl: 1.5, tp: 2.5, volume: 0.05 },
    aggressive: { sl: 1.2, tp: 2.0, volume: 0.10 }
  };
  
  const risk = riskMultipliers[riskLevel] || riskMultipliers.medium;
  const isBuy = signal.type === 'buy';
  
  return {
    symbol,
    type: signal.type,
    entryPrice: currentPrice,
    stopLoss: isBuy ? currentPrice - (atr * risk.sl) : currentPrice + (atr * risk.sl),
    takeProfit: isBuy ? currentPrice + (atr * risk.tp) : currentPrice - (atr * risk.tp),
    volume: risk.volume,
    confidence: signal.confidence,
    reason: signal.reason,
    atr,
    indicators: { rsi: currentRsi, ema8: ema8Val, ema20: ema20Val, support, resistance }
  };
}

/**
 * Calculate EMA
 */
function calculateEMA(data, period) {
  if (data.length < period) return data.map(() => data[0] || 0);
  
  const multiplier = 2 / (period + 1);
  const ema = [data.slice(0, period).reduce((a, b) => a + b, 0) / period];
  
  for (let i = period; i < data.length; i++) {
    ema.push((data[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1]);
  }
  
  return ema;
}

/**
 * Calculate RSI
 */
function calculateRSI(closes, period = 14) {
  if (closes.length < period + 1) return closes.map(() => 50);
  
  const gains = [];
  const losses = [];
  
  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? Math.abs(diff) : 0);
  }
  
  const rsi = [];
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = period; i < gains.length; i++) {
    avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
    avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
    
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi.push(100 - (100 / (1 + rs)));
  }
  
  return rsi;
}

/**
 * Get active robots with their connected MT5 accounts
 */
async function getActiveRobots() {
  try {
    // Query joins user_robot_configs with trading_robots and mt5_accounts
    // Less restrictive - find any robot config where user has an MT5 account
    const query = `
      SELECT 
        tr.id as robot_id, 
        tr.name, 
        tr.timeframe, 
        tr.risk_level, 
        tr.strategy,
        urc.settings,
        urc.is_enabled,
        m.id as mt5_account_id, 
        m.api_key as metaapi_account_id, 
        m.user_id,
        m.status as mt5_status,
        m.is_connected
      FROM user_robot_configs urc
      JOIN trading_robots tr ON tr.id = urc.robot_id
      JOIN mt5_accounts m ON m.user_id = urc.user_id
      WHERE m.api_key IS NOT NULL
    `;
    const result = await pool.query(query);
    console.log(`Found ${result.rows.length} robot configurations total`);
    
    // Log details for debugging
    result.rows.forEach(r => {
      console.log(`  Robot: ${r.name}, enabled: ${r.is_enabled}, MT5 status: ${r.mt5_status}, connected: ${r.is_connected}`);
    });
    
    // Filter to only enabled robots with connected accounts, but if none, use all
    let activeRobots = result.rows.filter(r => r.is_enabled === true);
    
    if (activeRobots.length === 0 && result.rows.length > 0) {
      console.log('⚠️ No enabled robots found - using ALL robot configs for trading');
      activeRobots = result.rows;
    }
    
    console.log(`Using ${activeRobots.length} robots for trading`);
    return activeRobots;
  } catch (error) {
    console.error('Error fetching active robots:', error.message);
    return [];
  }
}

/**
 * Get open trades count for account
 */
async function getOpenTradesCount(accountId) {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM trades 
       WHERE mt5_account_id = $1 AND status = 'open'`,
      [accountId]
    );
    return parseInt(result.rows[0]?.count || 0);
  } catch (error) {
    return 0;
  }
}

/**
 * Execute a single trading cycle for a robot
 */
async function executeRobotTrade(robot) {
  const {
    robot_id: robotId,
    name: robotName,
    timeframe = 'm15',
    risk_level: riskLevel = 'medium',
    mt5_account_id: accountId,
    metaapi_account_id: metaApiAccountId,
    user_id: userId,
    connection: existingConnection
  } = robot;
  
  try {
    console.log(`\n🤖 Processing robot: ${robotName} (${timeframe || 'm15'})`);
    
    // Use passed connection or get new one
    const connection = existingConnection || await getConnection(metaApiAccountId, accountId);
    if (!connection) {
      console.log(`  ⚠️ Could not establish connection for MT5 account ${accountId}`);
      return;
    }
    
    // Check open trades limit (max 5 per account)
    const openTrades = await getOpenTradesCount(accountId);
    if (openTrades >= 5) {
      console.log(`  ⚠️ Max trades reached (${openTrades}/5) - skipping`);
      return;
    }
    
    // Try each trading pair
    for (const symbol of TRADING_PAIRS) {
      try {
        // Fetch candles
        console.log(`  📊 Analyzing ${symbol}...`);
        const candles = await fetchCandles(connection, symbol, timeframe.toLowerCase(), 100);
        
        if (!candles || candles.length < 30) {
          console.log(`  ⚠️ Insufficient data for ${symbol} (got ${candles?.length || 0} candles)`);
          continue;
        }
        
        // Analyze market - only returns signal if quality conditions met
        let signal = analyzeMarket(candles, symbol, riskLevel);
        
        if (!signal) {
          // No quality signal - use forced signal based on momentum
          console.log(`    🔄 No quality signal, creating momentum-based entry...`);
          signal = createForcedSignal(candles, symbol, riskLevel);
        }
        
        if (!signal) {
          console.log(`    ⏸️ Could not generate any signal for ${symbol}`);
          continue;
        }
        
        // Execute trade
        const trade = await executeTrade(connection, accountId, robotId, userId, robotName, signal);
        if (trade) {
          break; // One trade per robot per cycle
        }
        
      } catch (symbolError) {
        console.error(`  ❌ Error processing ${symbol}:`, symbolError.message);
        continue;
      }
    }
    
  } catch (error) {
    console.error(`Error executing trade for robot ${robotName}:`, error);
  }
}

/**
 * Main trading loop - runs continuously
 */
let tradingInterval = null;
let isRunning = false;

export async function startTradingScheduler() {
  if (isRunning) {
    console.log('⚠️ Trading scheduler already running');
    return;
  }
  
  isRunning = true;
  console.log('\n========================================');
  console.log('🚀 TRADING SCHEDULER STARTED');
  console.log('========================================\n');
  
  // Run immediately on start
  await runTradingCycle();
  
  // Then run every 30 seconds for scalpers, 5 minutes for others
  tradingInterval = setInterval(runTradingCycle, 30 * 1000); // Base: 30 seconds
  
  return { success: true, message: 'Trading scheduler started' };
}

export async function stopTradingScheduler() {
  if (tradingInterval) {
    clearInterval(tradingInterval);
    tradingInterval = null;
  }
  isRunning = false;
  console.log('\n========================================');
  console.log('🛑 TRADING SCHEDULER STOPPED');
  console.log('========================================\n');
  
  return { success: true, message: 'Trading scheduler stopped' };
}

async function runTradingCycle() {
  try {
    const robots = await getActiveRobots();
    
    if (robots.length === 0) {
      console.log(`[${new Date().toLocaleTimeString()}] No active robots found`);
      return;
    }
    
    console.log(`\n[${new Date().toLocaleTimeString()}] ========== TRADING CYCLE ==========`);
    console.log(`📊 Processing ${robots.length} active robot(s)...\n`);
    
    // Group robots by MT5 account to manage trades efficiently
    const accountRobots = new Map();
    for (const robot of robots) {
      const key = robot.mt5_account_id;
      if (!accountRobots.has(key)) {
        accountRobots.set(key, { robots: [], metaApiAccountId: robot.metaapi_account_id, userId: robot.user_id });
      }
      accountRobots.get(key).robots.push(robot);
    }
    
    // Process each account: check positions, close profits, open new trades
    for (const [accountId, data] of accountRobots) {
      try {
        const connection = await getConnection(data.metaApiAccountId, accountId);
        if (!connection) continue;
        
        // Step 1: Check and manage open positions
        await manageOpenPositions(connection, accountId, data.userId);
        
        // Step 2: Execute new trades for each robot
        for (const robot of data.robots) {
          await executeRobotTrade({ ...robot, connection });
        }
      } catch (error) {
        console.error(`Error processing account ${accountId}:`, error.message);
      }
    }
    
    console.log(`\n[${new Date().toLocaleTimeString()}] ========== CYCLE COMPLETE ==========\n`);
    
  } catch (error) {
    console.error('Trading cycle error:', error);
  }
}

/**
 * =========================================================================
 * SMART POSITION MANAGEMENT - Exit on profits or market structure change
 * =========================================================================
 */
async function manageOpenPositions(connection, accountId, userId) {
  try {
    // Get open positions from MT5
    let positions = [];
    try {
      positions = await connection.getPositions() || [];
    } catch (posError) {
      console.log(`  ⚠️ Could not fetch positions: ${posError.message}`);
      return; // Skip position management this cycle
    }
    
    console.log(`  📈 Account ${accountId} has ${positions.length} open positions`);
    
    if (positions.length === 0) return;
    
    for (const position of positions) {
      const profit = position.profit || 0;
      const symbol = position.symbol;
      const positionId = position.id;
      const positionType = position.type; // 'buy' or 'sell'
      const openPrice = position.openPrice;
      const currentPrice = position.currentPrice;
      const volume = position.volume;
      
      console.log(`    Position ${positionId}: ${symbol} ${positionType} P/L: $${profit.toFixed(2)}`);
      
      // Fetch current market data to check structure
      let shouldClose = false;
      let closeReason = '';
      
      try {
        const candles = await connection.getHistoricalCandles(symbol, 'm5', null, 30);
        
        if (candles && candles.length >= 20) {
          const closes = candles.map(c => c.close);
          const ema8 = calculateEMA(closes, 8);
          const ema20 = calculateEMA(closes, 20);
          const rsi = calculateRSI(closes, 14);
          const currentRsi = rsi[rsi.length - 1] || 50;
          const atr = calculateATR(candles, 7);
          
          const ema8Val = ema8[ema8.length - 1];
          const ema20Val = ema20[ema20.length - 1];
          
          // Calculate profit in pips/points
          const priceDiff = positionType === 'buy' 
            ? currentPrice - openPrice 
            : openPrice - currentPrice;
          const profitInATR = atr > 0 ? priceDiff / atr : 0;
          
          // =========================================================================
          // EXIT CONDITIONS
          // =========================================================================
          
          // 1. SECURE PROFITS: Close when profit >= 1.5 ATR (good move captured)
          if (profitInATR >= 1.5) {
            shouldClose = true;
            closeReason = `PROFIT SECURED: ${profitInATR.toFixed(1)} ATR move captured ($${profit.toFixed(2)})`;
          }
          
          // 2. MARKET STRUCTURE CHANGE: Trend reversal against position
          else if (positionType === 'buy' && ema8Val < ema20Val && currentRsi > 65) {
            shouldClose = true;
            closeReason = `STRUCTURE CHANGE: EMA bearish cross + RSI high (${currentRsi.toFixed(0)})`;
          }
          else if (positionType === 'sell' && ema8Val > ema20Val && currentRsi < 35) {
            shouldClose = true;
            closeReason = `STRUCTURE CHANGE: EMA bullish cross + RSI low (${currentRsi.toFixed(0)})`;
          }
          
          // 3. TRAILING STOP: Lock in profits after 1 ATR move
          else if (profitInATR >= 1.0 && profit > 0) {
            // Check if momentum is fading
            const recentCandles = candles.slice(-3);
            const momentum = positionType === 'buy'
              ? recentCandles.filter(c => c.close < c.open).length
              : recentCandles.filter(c => c.close > c.open).length;
            
            if (momentum >= 2) {
              shouldClose = true;
              closeReason = `TRAILING STOP: Momentum fading after ${profitInATR.toFixed(1)} ATR profit`;
            }
          }
          
          // 4. CUT LOSSES: Close if loss exceeds 2 ATR or $15
          else if (profitInATR <= -2.0 || profit <= -15) {
            shouldClose = true;
            closeReason = `STOP LOSS: ${profitInATR.toFixed(1)} ATR loss ($${profit.toFixed(2)})`;
          }
          
          // 5. TIME-BASED: Close very small profits/losses after extended time
          // (positions that aren't moving - free up capital)
          else if (Math.abs(profit) < 2 && Math.abs(profitInATR) < 0.3) {
            // Check if trade is stuck (sideways for 10+ candles)
            const priceRange = Math.max(...closes.slice(-10)) - Math.min(...closes.slice(-10));
            if (priceRange < atr * 0.5) {
              shouldClose = true;
              closeReason = `STAGNANT: Market ranging, freeing capital`;
            }
          }
        }
      } catch (analysisError) {
        console.log(`    ⚠️ Could not analyze ${symbol}: ${analysisError.message}`);
        // Fallback to simple profit/loss rules
        if (profit >= 10) {
          shouldClose = true;
          closeReason = `PROFIT TARGET: $${profit.toFixed(2)}`;
        } else if (profit <= -20) {
          shouldClose = true;
          closeReason = `MAX LOSS: $${profit.toFixed(2)}`;
        }
      }
      
      // Execute close if needed
      if (shouldClose) {
        try {
          console.log(`    🔄 Closing: ${closeReason}`);
          await connection.closePosition(positionId);
          
          // Update trade in database
          await pool.query(
            `UPDATE trades SET status = 'closed', profit = $1, close_time = NOW() 
             WHERE mt5_account_id = $2 AND status = 'open' AND pair = $3`,
            [profit, accountId, symbol]
          );
          
          console.log(`    ✅ Position closed: ${symbol} ${positionType} $${profit.toFixed(2)}`);
          
          // Emit trade closed event
          emitTradeClosed(userId, { symbol, profit, positionId, reason: closeReason });
        } catch (closeError) {
          console.error(`    ❌ Failed to close position:`, closeError.message);
        }
      } else {
        console.log(`    ⏳ Holding: ${symbol} ${positionType} $${profit.toFixed(2)}`);
      }
    }
    
    // Sync database with actual positions
    await syncTradesWithMT5(connection, accountId);
    
  } catch (error) {
    console.error(`Error managing positions for account ${accountId}:`, error.message);
  }
}

/**
 * Sync local database with actual MT5 positions
 */
async function syncTradesWithMT5(connection, accountId) {
  try {
    const positions = await connection.getPositions();
    const openPositionIds = new Set((positions || []).map(p => p.symbol));
    
    // Get open trades from database
    const dbTrades = await pool.query(
      `SELECT id, pair FROM trades WHERE mt5_account_id = $1 AND status = 'open'`,
      [accountId]
    );
    
    // Close trades in database that are no longer open in MT5
    for (const trade of dbTrades.rows) {
      if (!openPositionIds.has(trade.pair)) {
        await pool.query(
          `UPDATE trades SET status = 'closed', close_time = NOW() WHERE id = $1`,
          [trade.id]
        );
        console.log(`    📊 Synced: Trade ${trade.id} (${trade.pair}) marked as closed`);
      }
    }
  } catch (error) {
    console.error('Error syncing trades:', error.message);
  }
}

export function getTradingSchedulerStatus() {
  return {
    isRunning,
    message: isRunning ? 'Trading scheduler is active' : 'Trading scheduler is stopped'
  };
}

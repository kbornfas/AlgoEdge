import pool from '../config/database.js';
import { mt5Connections, connectMT5Account, isMetaApiReady, waitForMetaApi } from './mt5Service.js';
import { emitTradeSignal, emitTradeClosed, emitPositionUpdate, emitBalanceUpdate } from './websocketService.js';
import https from 'https';

/**
 * =========================================================================
 * TRADING SCHEDULER SERVICE
 * =========================================================================
 * Runs continuously on the backend server to execute trades for ALL robots.
 * This is server-side - it runs 24/7 regardless of browser/client state.
 * NO MOCK DATA - Only executes real trades when MetaAPI SDK is loaded.
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

// NO MOCK DATA - Only real prices from MetaAPI
// These are just used for validation, NOT for generating fake candles
const VALID_SYMBOLS = [
  'XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 
  'USDCAD', 'USDCHF', 'NZDUSD', 'EURJPY', 'GBPJPY'
];

// Initialize MetaAPI
let MetaApi;
let api;

async function initMetaApi() {
  if (api) return api;
  
  try {
    // Import the ESM Node version of MetaAPI SDK
    const { default: MetaApiClass } = await import('metaapi.cloud-sdk/esm-node');
    MetaApi = MetaApiClass;
    
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
 * ONLY executes when real MetaAPI SDK is loaded - NO MOCK DATA
 */
async function executeTradeViaMetaApi(connection, accountId, robotId, userId, signal) {
  try {
    // Ensure MetaAPI SDK is ready - NO MOCK TRADES
    if (!isMetaApiReady()) {
      console.log(`  ❌ MetaAPI SDK not ready - skipping trade (no mock data)`);
      return null;
    }
    
    // Validate symbol is tradable on this account before sending order
    try {
      if (typeof connection.getSymbolPrice === 'function') {
        await connection.getSymbolPrice(signal.symbol);
      }
    } catch (symErr) {
      console.log(`  ⚠️ Symbol not available on account: ${signal.symbol} (${symErr.message})`);
      return null;
    }

    // Place order via MetaAPI RPC connection
    console.log(`  📤 Executing ${signal.type} ${signal.symbol} @ ${signal.volume} lots`);
    // Prefer explicit buy/sell helpers when available
    let result;
    const type = signal.type.toLowerCase();
    if (type === 'buy' && typeof connection.createMarketBuyOrder === 'function') {
      result = await connection.createMarketBuyOrder(
        signal.symbol,
        signal.volume,
        signal.stopLoss,
        signal.takeProfit,
        { comment: `AlgoEdge-${robotId}` }
      );
    } else if (type === 'sell' && typeof connection.createMarketSellOrder === 'function') {
      result = await connection.createMarketSellOrder(
        signal.symbol,
        signal.volume,
        signal.stopLoss,
        signal.takeProfit,
        { comment: `AlgoEdge-${robotId}` }
      );
    } else if (typeof connection.createMarketOrder === 'function') {
      // Fallback to generic method if available
      result = await connection.createMarketOrder(
        signal.symbol,
        type,
        signal.volume,
        signal.stopLoss,
        signal.takeProfit,
        { comment: `AlgoEdge-${robotId}` }
      );
    } else {
      throw new Error('createMarketOrder/createMarketBuyOrder/createMarketSellOrder not available on connection');
    }
    
    console.log(`  📊 MetaAPI order result:`, result);
    
    // Validate result is real (not mock)
    if (!result || !result.orderId) {
      console.log(`  ❌ Invalid order result - missing orderId`);
      return null;
    }
    
    // Check for mock data indicators
    if (result.orderId && String(result.orderId).startsWith('MOCK_')) {
      console.log(`  ❌ REJECTED: Mock order detected - not saving to database`);
      return null;
    }
    
    // Validate price is realistic (not 1.2345)
    if (result.price === 1.2345) {
      console.log(`  ❌ REJECTED: Mock price detected (1.2345) - not saving to database`);
      return null;
    }
    
    // Save to database only if we have a real order
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

// Premium trading pairs - expanded list
const TRADING_PAIRS = [
  'EURUSD',  // Major forex pair - most liquid
  'GBPUSD',  // British Pound
  'USDJPY',  // Japanese Yen
  'XAUUSD',  // Gold
  'AUDUSD',  // Australian Dollar
  'USDCAD',  // Canadian Dollar
  'NZDUSD',  // New Zealand Dollar
  'USDCHF',  // Swiss Franc
  'EURJPY',  // Euro/Yen cross
  'GBPJPY',  // Pound/Yen cross
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
 * Get the account object for historical candle data
 */
async function getAccount(metaApiAccountId, mt5AccountId) {
  try {
    // Check scheduler's cached account
    if (schedulerConnections.has(mt5AccountId)) {
      const cached = schedulerConnections.get(mt5AccountId);
      if (cached && cached.account) {
        return cached.account;
      }
    }
    
    // Otherwise fetch it
    const metaApi = await initMetaApi();
    if (!metaApi) return null;
    
    const account = await metaApi.metatraderAccountApi.getAccount(metaApiAccountId);
    
    // Ensure deployed and connected
    if (account.state !== 'DEPLOYED') {
      await account.deploy();
      await account.waitDeployed();
    }
    
    if (account.connectionStatus !== 'CONNECTED') {
      await account.waitConnected();
    }
    
    return account;
  } catch (error) {
    console.error(`Failed to get account ${metaApiAccountId}:`, error.message);
    return null;
  }
}

// Simple rate-limited logger to avoid log spam
const LAST_LOG_MAP = new Map();
const LOG_SUPPRESS_MS = 5000;
function rateLimitLog(key, message) {
  const now = Date.now();
  const last = LAST_LOG_MAP.get(key) || 0;
  if (now - last > LOG_SUPPRESS_MS) {
    console.log(message);
    LAST_LOG_MAP.set(key, now);
  }
}

// Convert timeframe to MetaAPI expected format (e.g., m5 -> 5m, h1 -> 1h)
function normalizeTimeframe(tf = 'm5') {
  const lower = tf.toLowerCase();
  const match = lower.match(/^(m|h|d)(\d+)$/);
  if (match) {
    const unit = match[1];
    const val = match[2];
    return `${val}${unit}`;
  }
  // If already number-first (e.g., 5m) keep it
  if (/^\d+(m|h|d|w)$/.test(lower)) return lower;
  // Fallback to 5m
  return '5m';
}

/**
 * Fetch candle data via MetaAPI - NO FALLBACK, REAL DATA ONLY
 */
async function fetchCandles(account, symbol, timeframe, count = 50) {
  if (!account) {
    console.log(`  ❌ No account for candle fetch (${symbol}) - skipping (no fake data)`);
    return null;
  }
  
  try {
    const sdkTimeframe = normalizeTimeframe(timeframe || 'm5');
    const candles = await account.getHistoricalCandles(symbol, sdkTimeframe, undefined, count);
    
    if (!candles || candles.length === 0) {
      console.log(`  ❌ No historical candles for ${symbol} (${sdkTimeframe}) - skipping (no fake data)`);
      return null;
    }
    
    console.log(`  ✅ Got ${candles.length} real candles for ${symbol}`);
    return candles;
  } catch (error) {
    console.log(`  ❌ Failed to fetch candles for ${symbol}: ${error.message} - skipping (no fake data)`);
    return null;
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
  // AGGRESSIVE SIGNAL DETECTION - Trade when conditions are favorable
  // =========================================================================
  let signal = null;
  let confidence = 0;
  let reason = '';
  
  // BUY CONDITIONS: Bullish setup
  if (
    (isUptrend) ||                                    // Any uptrend
    (emaCrossUp) ||                                   // Fresh crossover
    (currentRsi < 35 && bullishCount >= 2) ||        // Oversold with momentum
    (bullishCount >= 4) ||                           // Strong momentum
    (nearSupport && bullishCount >= 2)               // Bounce from support
  ) {
    confidence = 0;
    reason = '';
    
    if (isUptrend) { confidence += 30; reason += 'Uptrend '; }
    if (emaCrossUp) { confidence += 35; reason += 'EMA-Cross-Up '; }
    if (currentRsi < 35) { confidence += 20; reason += 'RSI-Low '; }
    if (nearSupport) { confidence += 15; reason += 'Near-Support '; }
    if (bullishCount >= 4) { confidence += 15; reason += `Strong-Mom(${bullishCount}B) `; }
    if (bullishCount >= 3) { confidence += 10; reason += 'Bullish '; }
    if (ema8Val > ema20Val) { confidence += 10; reason += 'EMA-Bullish '; }
    
    if (confidence >= 30) {
      signal = { type: 'buy', confidence, reason: `BUY: ${reason.trim()}` };
    }
  }
  
  // SELL CONDITIONS: Bearish setup
  if (
    !signal && (
      (isDowntrend) ||                               // Any downtrend
      (emaCrossDown) ||                              // Fresh crossover
      (currentRsi > 65 && bearishCount >= 2) ||     // Overbought with momentum
      (bearishCount >= 4) ||                         // Strong momentum
      (nearResistance && bearishCount >= 2)          // Rejection from resistance
    )
  ) {
    confidence = 0;
    reason = '';
    
    if (isDowntrend) { confidence += 30; reason += 'Downtrend '; }
    if (emaCrossDown) { confidence += 35; reason += 'EMA-Cross-Down '; }
    if (currentRsi > 65) { confidence += 20; reason += 'RSI-High '; }
    if (nearResistance) { confidence += 15; reason += 'Near-Resistance '; }
    if (bearishCount >= 4) { confidence += 15; reason += `Strong-Mom(${bearishCount}S) `; }
    if (bearishCount >= 3) { confidence += 10; reason += 'Bearish '; }
    if (ema8Val < ema20Val) { confidence += 10; reason += 'EMA-Bearish '; }
    
    if (confidence >= 30) {
      signal = { type: 'sell', confidence, reason: `SELL: ${reason.trim()}` };
    }
  }
  
  // FALLBACK: If no clear signal but market is moving, trade with momentum
  if (!signal && (bullishCount >= 3 || bearishCount >= 3)) {
    const isBullish = bullishCount > bearishCount;
    confidence = 25 + (Math.abs(bullishCount - bearishCount) * 5);
    reason = isBullish ? `MOMENTUM: ${bullishCount}B candles` : `MOMENTUM: ${bearishCount}S candles`;
    signal = { type: isBullish ? 'buy' : 'sell', confidence, reason };
  }
  
  // No signal at all
  if (!signal) {
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
    // Query ONLY enabled robots with connected MT5 accounts
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
      WHERE urc.is_enabled = true 
        AND m.api_key IS NOT NULL
        AND m.status IN ('connected', 'active')
    `;
    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      return [];
    }
    
    console.log(`Found ${result.rows.length} enabled robot(s) with connected accounts`);
    
    // Log details for debugging
    result.rows.forEach(r => {
      console.log(`  Robot: ${r.name}, MT5 account: ${r.mt5_account_id}, status: ${r.mt5_status}`);
    });
    
    return result.rows;
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
 * Get existing open positions for an account (by symbol and direction)
 * Used to prevent opening opposing positions
 */
async function getOpenPositions(accountId) {
  try {
    const result = await pool.query(
      `SELECT symbol as pair, type, ticket, id FROM trades 
       WHERE mt5_account_id = $1 AND status = 'open'`,
      [accountId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error getting open positions:', error.message);
    return [];
  }
}

/**
 * Close opposing positions when market structure shifts
 * Returns true if positions were closed (allowing new trade to open)
 */
async function closeOpposingPositions(connection, accountId, userId, symbol, newDirection) {
  const oppositeDirection = newDirection.toLowerCase() === 'buy' ? 'sell' : 'buy';
  
  try {
    // Get opposing positions from database
    const result = await pool.query(
      `SELECT ticket, id, symbol, type FROM trades 
       WHERE mt5_account_id = $1 AND status = 'open' AND symbol = $2 AND LOWER(type) = $3`,
      [accountId, symbol, oppositeDirection]
    );
    
    if (result.rows.length === 0) {
      return true; // No opposing positions, can proceed
    }
    
    console.log(`    🔄 STRUCTURE SHIFT: Closing ${result.rows.length} ${oppositeDirection.toUpperCase()} position(s) on ${symbol}`);
    
    // Close each opposing position
    for (const trade of result.rows) {
      try {
        const positionId = trade.ticket;
        if (positionId && !positionId.startsWith('MOCK_')) {
          await connection.closePosition(positionId);
          console.log(`    ✅ Closed ${oppositeDirection.toUpperCase()} position ${positionId}`);
        }
        
        // Update database
        await pool.query(
          `UPDATE trades SET status = 'closed', close_time = NOW() WHERE id = $1`,
          [trade.id]
        );
        
        // Emit event
        emitTradeClosed(userId, { 
          symbol, 
          positionId,
          reason: `STRUCTURE SHIFT: Market changed to ${newDirection.toUpperCase()}`
        });
        
      } catch (closeError) {
        console.error(`    ⚠️ Failed to close position ${trade.order_id}:`, closeError.message);
      }
    }
    
    return true; // Positions closed, can open new trade
    
  } catch (error) {
    console.error(`Error closing opposing positions:`, error.message);
    return false;
  }
}

// Track last trade time per symbol to add cooldown
const lastTradeTime = new Map();

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
    
    // Get connection and account
    const connection = existingConnection || await getConnection(metaApiAccountId, accountId);
    if (!connection) {
      console.log(`  ⚠️ Could not establish connection for MT5 account ${accountId}`);
      return;
    }
    
    // Get account for historical candle data
    const account = await getAccount(metaApiAccountId, accountId);
    if (!account) {
      console.log(`  ⚠️ Could not get account for historical candles`);
      return;
    }
    
    const MAX_TRADES = 5; // Always aim for 5 trades
    
    // Get existing open positions
    let existingPositions = await getOpenPositions(accountId);
    console.log(`  📋 Current open positions: ${existingPositions.length}/${MAX_TRADES}`);
    
    // Collect all signals from all pairs first
    const signals = [];
    
    for (const symbol of TRADING_PAIRS) {
      try {
        const candles = await fetchCandles(account, symbol, timeframe?.toLowerCase() || 'm5', 100);
        
        if (!candles || candles.length < 30) {
          continue;
        }
        
        const signal = analyzeMarket(candles, symbol, riskLevel);
        if (signal) {
          signals.push({ symbol, signal, candles });
          console.log(`  📊 ${symbol}: ${signal.type.toUpperCase()} signal (${signal.confidence}%)`);
        }
      } catch (err) {
        continue;
      }
    }
    
    if (signals.length === 0) {
      console.log(`  ⏸️ No trading signals found across all pairs`);
      return;
    }
    
    // Sort signals by confidence (strongest first)
    signals.sort((a, b) => b.signal.confidence - a.signal.confidence);
    console.log(`  🎯 Found ${signals.length} signal(s) - Best: ${signals[0].symbol} (${signals[0].signal.confidence}%)`);
    
    // First: Close any positions that are against the current structure
    for (const { symbol, signal } of signals) {
      const oppositeDirection = signal.type.toLowerCase() === 'buy' ? 'sell' : 'buy';
      const opposingPositions = existingPositions.filter(pos => 
        pos.pair === symbol && pos.type.toLowerCase() === oppositeDirection
      );
      
      if (opposingPositions.length > 0) {
        console.log(`  🔄 STRUCTURE SHIFT on ${symbol}! Closing ${opposingPositions.length} ${oppositeDirection.toUpperCase()} position(s)`);
        await closeOpposingPositions(connection, accountId, userId, symbol, signal.type);
        // Refresh positions after closing
        existingPositions = await getOpenPositions(accountId);
      }
    }
    
    // Calculate how many new trades we can open
    const currentOpenCount = existingPositions.length;
    const slotsAvailable = MAX_TRADES - currentOpenCount;
    
    if (slotsAvailable <= 0) {
      console.log(`  📊 All ${MAX_TRADES} slots filled - monitoring for structure shifts`);
      return;
    }
    
    console.log(`  🎰 ${slotsAvailable} trade slot(s) available - opening positions...`);
    
    // Open trades to fill all available slots
    let tradesOpened = 0;
    let signalIndex = 0;
    
    while (tradesOpened < slotsAvailable && signalIndex < signals.length) {
      const { symbol, signal } = signals[signalIndex];
      
      try {
        // Execute trade
        const trade = await executeTrade(connection, accountId, robotId, userId, robotName, signal);
        if (trade) {
          tradesOpened++;
          console.log(`    ✅ Opened ${signal.type.toUpperCase()} on ${symbol} (${tradesOpened}/${slotsAvailable})`);
          
          // If strong signal (>60%), open multiple on same pair
          if (signal.confidence >= 60 && tradesOpened < slotsAvailable) {
            // Open another on same pair
            const trade2 = await executeTrade(connection, accountId, robotId, userId, robotName, signal);
            if (trade2) {
              tradesOpened++;
              console.log(`    ✅ Opened another ${signal.type.toUpperCase()} on ${symbol} (STRONG SIGNAL)`);
            }
          }
        }
      } catch (err) {
        console.error(`    ❌ Failed to open trade on ${symbol}:`, err.message);
      }
      
      signalIndex++;
    }
    
    console.log(`  📈 Cycle complete: Opened ${tradesOpened} new trade(s), Total positions: ${currentOpenCount + tradesOpened}`);
    
  } catch (error) {
    console.error(`Error executing trade for robot ${robotName}:`, error);
  }
}
/**
 * Main trading loop - runs continuously
 */
let tradingInterval = null;
let positionStreamInterval = null;
let isRunning = false;

/**
 * Stream live positions to connected users every second
 */
async function streamPositions() {
  try {
    // Get all connected MT5 accounts with active robots
    const result = await pool.query(`
      SELECT DISTINCT m.id as account_id, m.metaapi_account_id, m.user_id
      FROM mt5_accounts m
      JOIN user_robot_configs urc ON urc.user_id = m.user_id
      WHERE urc.is_enabled = true AND m.status = 'connected'
    `);
    
    for (const account of result.rows) {
      // Try scheduler's cached connection first
      let connection = null;
      const schedulerCache = schedulerConnections.get(account.account_id);
      if (schedulerCache?.rpcConnection) {
        connection = schedulerCache.rpcConnection;
      } else {
        // Fallback to mt5Connections
        const connectionData = mt5Connections.get(account.metaapi_account_id);
        if (connectionData?.connection) {
          connection = connectionData.connection;
        }
      }
      
      if (!connection) continue;
      
      try {
        // Get live positions
        const positions = await connection.getPositions();
        const info = await connection.getAccountInformation();
        
        // Format positions for frontend
        const formattedPositions = positions.map(p => ({
          id: p.id,
          symbol: p.symbol,
          type: p.type?.toUpperCase() || 'BUY',
          volume: p.volume,
          openPrice: p.openPrice,
          currentPrice: p.currentPrice,
          profit: p.profit || p.unrealizedProfit || 0,
          swap: p.swap || 0,
        }));
        
        // Emit to user
        emitPositionUpdate(account.user_id, formattedPositions);
        emitBalanceUpdate(account.user_id, {
          balance: info.balance,
          equity: info.equity,
          margin: info.margin,
          freeMargin: info.freeMargin,
        });
        
      } catch (err) {
        // Silent - connection might be temporarily unavailable
      }
    }
  } catch (error) {
    // Silent - don't spam logs
  }
}

export async function startTradingScheduler() {
  if (isRunning) {
    console.log('⚠️ Trading scheduler already running');
    return;
  }
  
  isRunning = true;
  console.log('\n========================================');
  console.log('🚀 TRADING SCHEDULER STARTED');
  console.log('   Max trades: 5 | Cycle: 15 seconds');
  console.log('========================================\n');
  
  // Run immediately on start
  await runTradingCycle();
  
  // Run every 15 seconds for aggressive trading
  tradingInterval = setInterval(runTradingCycle, 15 * 1000);
  
  // Stream positions every 1 second for real-time price updates
  positionStreamInterval = setInterval(streamPositions, 1000);
  
  return { success: true, message: 'Trading scheduler started' };
}

export async function stopTradingScheduler() {
  if (tradingInterval) {
    clearInterval(tradingInterval);
    tradingInterval = null;
  }
  if (positionStreamInterval) {
    clearInterval(positionStreamInterval);
    positionStreamInterval = null;
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
      // Silent - no spam when no robots enabled
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

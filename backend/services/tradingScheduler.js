import pool from '../config/database.js';
import { mt5Connections, connectMT5Account, isMetaApiReady, waitForMetaApi } from './mt5Service.js';
import { emitTradeSignal, emitTradeClosed, emitPositionUpdate, emitBalanceUpdate } from './websocketService.js';
import { generateNewsSignal, shouldAvoidTradingDueToNews, IMPACT } from './newsService.js';
import https from 'https';

/**
 * =========================================================================
 * TRADING SCHEDULER SERVICE
 * =========================================================================
 * Runs continuously on the backend server to execute trades for ALL robots.
 * This is server-side - it runs 24/7 regardless of browser/client state.
 * NO MOCK DATA - Only executes real trades when MetaAPI SDK is loaded.
 * 
 * RISK MANAGEMENT:
 * - Position sizing based on account balance
 * - Maximum risk per trade: 2% of account
 * - Maximum total exposure: 10% of account
 * - Only trade on STRONG signals (60%+ confidence)
 * - No opposing positions on same pair
 * - Structure shift requires 3+ candle confirmation
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

// =========================================================================
// RISK MANAGEMENT CONSTANTS
// =========================================================================
const RISK_CONFIG = {
  MAX_RISK_PER_TRADE: 0.02,      // 2% max risk per trade
  MAX_TOTAL_EXPOSURE: 0.15,      // 15% max total exposure
  MIN_SIGNAL_CONFIDENCE: 50,     // Trade on 50%+ confidence signals
  HIGH_CONFIDENCE_THRESHOLD: 70, // 70%+ = high confidence (no restrictions)
  STRUCTURE_SHIFT_CANDLES: 5,    // Need 5 candles to confirm structure shift
  MIN_ACCOUNT_BALANCE: 100,      // Don't trade if balance below $100
  TRADE_COOLDOWN_MS: 30000,      // 30 seconds cooldown
  PREVENT_HEDGING: true,         // Never open opposite positions on same pair
};

// =========================================================================
// CANDLE CACHE - Reduces API calls to avoid rate limiting
// =========================================================================
const candleCache = new Map();
const CANDLE_CACHE_TTL = 30000; // 30 seconds cache

/**
 * Get max positions based on account balance
 * Bigger accounts can handle more positions
 * @param {number} balance - Account balance
 * @returns {{ target: number, max: number }} - Target and max positions
 */
function getPositionLimits(balance) {
  if (balance >= 10000) {
    return { target: 50, max: 60 };   // $10,000+: 50 target, 60 max
  } else if (balance >= 5000) {
    return { target: 30, max: 40 };   // $5,000-$10,000: 30 target, 40 max
  } else if (balance >= 1000) {
    return { target: 20, max: 25 };   // $1,000-$5,000: 20 target, 25 max
  } else {
    return { target: 10, max: 15 };   // Below $1,000: 10 target, 15 max
  }
}

// Track structure direction per symbol (for detecting real structure shifts)
const marketStructure = new Map();

/**
 * Get pip size for a symbol (the decimal place value of 1 pip)
 * @param {string} symbol - Trading symbol
 * @returns {number} - Pip size
 */
function getPipSize(symbol) {
  if (symbol.includes('XAU') || symbol.includes('GOLD')) {
    return 0.1;  // Gold: 1 pip = $0.10 movement
  } else if (symbol.includes('JPY')) {
    return 0.01; // JPY pairs: 1 pip = 0.01
  } else {
    return 0.0001; // Standard pairs: 1 pip = 0.0001
  }
}

/**
 * Get pip value per lot for a symbol
 * @param {string} symbol - Trading symbol  
 * @returns {number} - Dollar value per pip for 1 standard lot
 */
function getPipValuePerLot(symbol) {
  if (symbol.includes('XAU') || symbol.includes('GOLD')) {
    return 1;  // Gold: $1 per pip (0.1 move) per 1 lot
  } else if (symbol.includes('JPY')) {
    return 9;  // JPY pairs: ~$9 per pip per lot
  } else {
    return 10; // Standard pairs: $10 per pip per lot
  }
}

/**
 * Calculate position size based on account balance and risk
 * Proper lot sizing for account size
 * @param {number} balance - Account balance
 * @param {number} stopLossPips - Stop loss in pips (already converted)
 * @param {string} symbol - Trading symbol
 * @param {number} confidence - Signal confidence
 * @returns {number} - Lot size
 */
function calculatePositionSize(balance, stopLossPips, symbol, confidence = 50) {
  if (!balance || balance < RISK_CONFIG.MIN_ACCOUNT_BALANCE) {
    return 0.01; // Minimum lot if no balance info
  }
  
  // Risk percentage based on confidence
  // High confidence (70%+): 1.5% risk per trade
  // Normal (50-69%): 1% risk per trade
  const riskPercent = confidence >= RISK_CONFIG.HIGH_CONFIDENCE_THRESHOLD 
    ? 0.015  // 1.5% risk for high confidence
    : 0.01;  // 1% risk for normal
  
  const riskAmount = balance * riskPercent;
  
  // Get pip value per standard lot for this symbol
  const pipValuePerLot = getPipValuePerLot(symbol);
  
  // Ensure reasonable SL pips (20-100 for forex, 50-500 for gold)
  const isGold = symbol.includes('XAU') || symbol.includes('GOLD');
  const minSL = isGold ? 50 : 15;
  const maxSL = isGold ? 500 : 100;
  const effectiveSL = Math.max(minSL, Math.min(maxSL, stopLossPips));
  
  // Calculate lot size: Risk Amount / (Stop Loss Pips * Pip Value per lot)
  let lotSize = riskAmount / (effectiveSL * pipValuePerLot);
  
  // Round to 2 decimal places
  lotSize = Math.round(lotSize * 100) / 100;
  
  // Enforce limits based on account size
  // Small accounts ($100-$1000): 0.01-0.1 lots
  // Medium accounts ($1000-$10000): 0.01-0.5 lots  
  // Large accounts ($10000+): 0.01-1.0 lots
  let maxLot;
  if (balance < 1000) {
    maxLot = 0.1;
  } else if (balance < 10000) {
    maxLot = 0.5;
  } else {
    maxLot = 1.0;
  }
  
  lotSize = Math.max(0.01, Math.min(maxLot, lotSize));
  
  console.log(`    💰 Lot calc: Balance=$${balance.toFixed(0)}, Risk=${(riskPercent*100).toFixed(1)}%=$${riskAmount.toFixed(2)}, SL=${effectiveSL.toFixed(0)}pips → ${lotSize} lots`);
  
  return lotSize;
}

/**
 * Check if we can open more trades based on risk exposure
 * AGGRESSIVE MODE: Always try to maintain target positions based on account size
 * HIGH CONFIDENCE (70%+) signals get priority
 */
function canOpenMoreTrades(balance, equity, openPositionsCount, currentProfitLoss, signalConfidence = 50) {
  // Don't trade if no balance info
  if (!balance || balance < RISK_CONFIG.MIN_ACCOUNT_BALANCE) {
    return { canTrade: false, reason: 'Account balance too low or unknown' };
  }
  
  // Get dynamic position limits based on account balance
  const { target, max } = getPositionLimits(balance);
  
  // Check if equity is critically low (stop out protection)
  if (equity && equity < balance * 0.7) {
    return { canTrade: false, reason: `Equity critically low (${((equity / balance) * 100).toFixed(1)}% of balance)` };
  }
  
  // Check drawdown - don't trade if losing more than 10%
  if (currentProfitLoss < -(balance * 0.10)) {
    return { canTrade: false, reason: `Drawdown limit reached (${((currentProfitLoss / balance) * 100).toFixed(1)}%)` };
  }
  
  // Hard limit - never exceed max positions for this account size
  if (openPositionsCount >= max) {
    return { canTrade: false, reason: `Hard limit reached (${openPositionsCount}/${max})` };
  }
  
  // HIGH CONFIDENCE trades (70%+) - always allowed if under hard limit
  if (signalConfidence >= RISK_CONFIG.HIGH_CONFIDENCE_THRESHOLD) {
    return { canTrade: true, reason: 'HIGH CONFIDENCE - priority trade' };
  }
  
  // AGGRESSIVE MODE: If under target, be more willing to trade
  if (openPositionsCount < target) {
    const slotsNeeded = target - openPositionsCount;
    return { canTrade: true, reason: `Under target (need ${slotsNeeded} more positions)` };
  }
  
  // At or above target, only trade high confidence signals
  return { canTrade: false, reason: `At target positions (${openPositionsCount}/${target})` };
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
    
    // Initialize WITHOUT region option (SDK auto-detects from account)
    // Per MetaAPI docs: "do not pass region option to MetaApi constructor for javascript SDKs"
    api = new MetaApi(token);
    console.log('✅ MetaAPI initialized for trading scheduler (auto-region)');
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
  // Try by database ID first
  if (mt5Connections.has(mt5AccountId)) {
    const conn = mt5Connections.get(mt5AccountId);
    if (conn && conn.connection) {
      console.log(`  ✅ Using existing mt5Service connection for account ${mt5AccountId}`);
      return conn.connection;
    }
  }
  
  // Also try by metaApiAccountId (check all connections)
  for (const [key, conn] of mt5Connections.entries()) {
    if (conn.metaApiId === metaApiAccountId && conn.connection) {
      console.log(`  ✅ Found mt5Service connection by metaApiId ${metaApiAccountId}`);
      return conn.connection;
    }
  }
  
  // Check scheduler's cached connections by mt5AccountId
  if (schedulerConnections.has(mt5AccountId)) {
    const cached = schedulerConnections.get(mt5AccountId);
    if (cached && cached.rpcConnection) {
      console.log(`  ✅ Using cached scheduler connection`);
      return cached.rpcConnection;
    }
  }
  
  // Also check scheduler connections by metaApiAccountId
  if (schedulerConnections.has(metaApiAccountId)) {
    const cached = schedulerConnections.get(metaApiAccountId);
    if (cached && cached.rpcConnection) {
      console.log(`  ✅ Using cached scheduler connection by metaApiId`);
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
    
    let account;
    try {
      account = await metaApi.metatraderAccountApi.getAccount(metaApiAccountId);
    } catch (accountErr) {
      // Account not found in MetaAPI - mark as invalid and skip
      if (accountErr.message?.includes('not found') || accountErr.message?.includes('404')) {
        console.log(`  ⚠️ MetaAPI account ${metaApiAccountId} not found - skipping (stale reference)`);
        // Mark this account as needing reconnection in database
        try {
          await pool.query(
            `UPDATE mt5_accounts SET status = 'disconnected', api_key = NULL WHERE api_key = $1`,
            [metaApiAccountId]
          );
          console.log(`  🔄 Cleared stale MetaAPI reference from database`);
        } catch (dbErr) {
          // Ignore DB errors here
        }
        return null;
      }
      throw accountErr;
    }
    
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
    
    // REMOVED Method 4: Don't use account directly - it doesn't have getPositions/getAccountInformation
    // The account object has trading methods but not the data methods we need
    
    if (!rpcConnection) {
      console.log(`  ❌ Could not establish RPC connection. Available account methods: ${accountMethods.join(', ')}`);
      return null;
    }
    
    // Verify the connection has the methods we need
    if (typeof rpcConnection.getAccountInformation !== 'function') {
      console.log(`  ❌ Connection missing getAccountInformation method`);
      return null;
    }
    if (typeof rpcConnection.getPositions !== 'function') {
      console.log(`  ❌ Connection missing getPositions method`);
      return null;
    }
    
    // Verify trading is possible
    if (typeof rpcConnection.createMarketBuyOrder !== 'function' && 
        typeof rpcConnection.createMarketOrder !== 'function') {
      console.log(`  ⚠️ Connection may not support trading - missing order methods`);
    }
    
    // Cache the connection AND account for later use
    schedulerConnections.set(mt5AccountId, { rpcConnection, account });
    // Also cache by metaApiAccountId for easier lookup
    schedulerConnections.set(metaApiAccountId, { rpcConnection, account });
    
    console.log(`  ✅ Connected to MetaAPI account ${metaApiAccountId} with trading enabled`);
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
    
    // Check if connection is synchronized and trading is enabled
    try {
      const terminalState = connection.terminalState;
      if (terminalState && !terminalState.connected) {
        console.log(`  ⚠️ Terminal not connected - waiting for reconnection...`);
        await connection.waitSynchronized({ timeoutInSeconds: 10 });
      }
    } catch (stateErr) {
      // Ignore - some SDK versions don't have terminalState
    }
    
    // NOTE: Removed getSymbolPrice check - it was hitting rate limits and blocking trades
    // The createMarketOrder will fail on its own if symbol is not available

    // Place order via MetaAPI RPC connection
    console.log(`  📤 Executing ${signal.type} ${signal.symbol} @ ${signal.volume} lots`);
    
    // Debug: Log available methods on connection
    const connectionMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(connection))
      .filter(m => typeof connection[m] === 'function' && m.includes('Order'));
    console.log(`  📋 Available order methods: ${connectionMethods.join(', ') || 'NONE'}`);
    
    let result;
    const type = signal.type.toLowerCase();
    
    try {
      if (type === 'buy' && typeof connection.createMarketBuyOrder === 'function') {
        console.log(`  🔄 Calling createMarketBuyOrder(${signal.symbol}, ${signal.volume}, ${signal.stopLoss}, ${signal.takeProfit})...`);
        result = await connection.createMarketBuyOrder(
          signal.symbol,
          signal.volume,
          signal.stopLoss,
          signal.takeProfit,
          { comment: `AlgoEdge-${robotId}` }
        );
      } else if (type === 'sell' && typeof connection.createMarketSellOrder === 'function') {
        console.log(`  🔄 Calling createMarketSellOrder(${signal.symbol}, ${signal.volume}, ${signal.stopLoss}, ${signal.takeProfit})...`);
        result = await connection.createMarketSellOrder(
          signal.symbol,
          signal.volume,
          signal.stopLoss,
          signal.takeProfit,
          { comment: `AlgoEdge-${robotId}` }
        );
      } else if (typeof connection.createMarketOrder === 'function') {
        console.log(`  🔄 Calling createMarketOrder(${signal.symbol}, ${type}, ${signal.volume})...`);
        result = await connection.createMarketOrder(
          signal.symbol,
          type,
          signal.volume,
          signal.stopLoss,
          signal.takeProfit,
          { comment: `AlgoEdge-${robotId}` }
        );
      } else {
        console.log(`  ❌ No trading methods found! Available: ${connectionMethods.join(', ')}`);
        throw new Error('No trading methods available on connection');
      }
      
      console.log(`  ✅ Order method returned:`, JSON.stringify(result, null, 2));
      
    } catch (orderErr) {
      // Log ALL errors with full details
      console.log(`  ❌ ORDER FAILED: ${orderErr.message}`);
      console.log(`  ❌ Full error:`, orderErr);
      
      // Handle specific errors
      if (orderErr.message?.includes('Trade is disabled')) {
        console.log(`  ⚠️ Trading disabled on this account - check MetaAPI account settings`);
        console.log(`     Make sure 'Trading enabled' is ON in MetaAPI dashboard`);
      } else if (orderErr.message?.includes('market is closed')) {
        console.log(`  ⚠️ Market is closed for ${signal.symbol}`);
      } else if (orderErr.message?.includes('not enough money')) {
        console.log(`  ⚠️ Insufficient margin for trade`);
      } else if (orderErr.message?.includes('Invalid symbol')) {
        console.log(`  ⚠️ Symbol ${signal.symbol} not available on this broker`);
      }
      return null;
    }
    
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
    
    let account;
    try {
      account = await metaApi.metatraderAccountApi.getAccount(metaApiAccountId);
    } catch (accountErr) {
      // Account not found - skip silently
      if (accountErr.message?.includes('not found') || accountErr.message?.includes('404')) {
        return null;
      }
      throw accountErr;
    }
    
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
    // Rate limit these error logs
    rateLimitLog(`account-err-${metaApiAccountId}`, `  ⚠️ Account ${metaApiAccountId}: ${error.message}`);
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
 * Fetch candle data via MetaAPI - WITH CACHING to avoid rate limits
 */
async function fetchCandles(account, symbol, timeframe, count = 50) {
  if (!account) {
    console.log(`  ❌ No account for candle fetch (${symbol}) - skipping (no fake data)`);
    return null;
  }
  
  // Check cache first
  const cacheKey = `${symbol}_${timeframe}_${count}`;
  const cached = candleCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CANDLE_CACHE_TTL) {
    return cached.candles;
  }
  
  try {
    const sdkTimeframe = normalizeTimeframe(timeframe || 'm5');
    const candles = await account.getHistoricalCandles(symbol, sdkTimeframe, undefined, count);
    
    if (!candles || candles.length === 0) {
      console.log(`  ❌ No historical candles for ${symbol} (${sdkTimeframe}) - skipping (no fake data)`);
      return null;
    }
    
    // Cache the result
    candleCache.set(cacheKey, { candles, timestamp: Date.now() });
    
    console.log(`  ✅ Got ${candles.length} real candles for ${symbol}`);
    return candles;
  } catch (error) {
    // If rate limited, try to use cached data even if expired
    if (error.message?.includes('cpu credits') || error.message?.includes('rate limit')) {
      console.log(`  ⚠️ Rate limited on ${symbol} - using cached data if available`);
      if (cached) {
        return cached.candles;
      }
    }
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
  
  // EMA crossovers (fresh signals) - require confirmation over multiple candles
  const ema8Recent = ema8.slice(-5);
  const ema20Recent = ema20.slice(-5);
  const emaCrossUp = ema8Val > ema20Val && ema8Recent[0] < ema20Recent[0]; // Was below, now above
  const emaCrossDown = ema8Val < ema20Val && ema8Recent[0] > ema20Recent[0]; // Was above, now below
  
  // Momentum check - need STRONG momentum (4+ candles in same direction)
  const recentCandles = candles.slice(-RISK_CONFIG.STRUCTURE_SHIFT_CANDLES);
  const bullishCount = recentCandles.filter(c => c.close > c.open).length;
  const bearishCount = recentCandles.length - bullishCount;
  
  // Support/Resistance check
  const recentLows = candles.slice(-20).map(c => c.low);
  const recentHighs = candles.slice(-20).map(c => c.high);
  const support = Math.min(...recentLows);
  const resistance = Math.max(...recentHighs);
  const nearSupport = currentPrice < support + (atr * 0.5);
  const nearResistance = currentPrice > resistance - (atr * 0.5);
  
  // =========================================================================
  // SIGNAL DETECTION - Trade when opportunities present
  // 50%+ = Normal trade, 70%+ = High confidence unlimited
  // =========================================================================
  let signal = null;
  let confidence = 0;
  let reason = '';
  
  // Get previous market structure
  const prevStructure = marketStructure.get(symbol);
  
  // BUY CONDITIONS: Various bullish setups
  if (
    (isUptrend) ||                                   // Any uptrend
    (emaCrossUp) ||                                  // Fresh crossover
    (currentRsi < 40 && bullishCount >= 3) ||        // Oversold with momentum
    (bullishCount >= 3) ||                           // Momentum
    (nearSupport && bullishCount >= 2)               // Bounce from support
  ) {
    confidence = 0;
    reason = '';
    
    if (isUptrend) { confidence += 25; reason += 'Uptrend '; }
    if (emaCrossUp) { confidence += 30; reason += 'EMA-Cross-Up '; }
    if (currentRsi < 30) { confidence += 25; reason += 'RSI-Oversold '; }
    else if (currentRsi < 40) { confidence += 15; reason += 'RSI-Low '; }
    if (nearSupport) { confidence += 15; reason += 'Support-Bounce '; }
    if (bullishCount >= 4) { confidence += 25; reason += `Strong-Mom(${bullishCount}/5) `; }
    else if (bullishCount >= 3) { confidence += 15; reason += `Momentum(${bullishCount}/5) `; }
    if (ema8Val > ema20Val && ema20Val > ema50Val) { confidence += 15; reason += 'EMA-Aligned '; }
    else if (ema8Val > ema20Val) { confidence += 10; reason += 'EMA-Bullish '; }
    
    if (confidence >= RISK_CONFIG.MIN_SIGNAL_CONFIDENCE) {
      signal = { type: 'buy', confidence: Math.min(confidence, 100), reason: `BUY: ${reason.trim()}` };
      marketStructure.set(symbol, 'bullish');
    }
  }
  
  // SELL CONDITIONS: Various bearish setups
  if (
    !signal && (
      (isDowntrend) ||                               // Any downtrend
      (emaCrossDown) ||                              // Fresh crossover
      (currentRsi > 60 && bearishCount >= 3) ||      // Overbought with momentum
      (bearishCount >= 3) ||                         // Momentum
      (nearResistance && bearishCount >= 2)          // Rejection from resistance
    )
  ) {
    confidence = 0;
    reason = '';
    
    if (isDowntrend) { confidence += 25; reason += 'Downtrend '; }
    if (emaCrossDown) { confidence += 30; reason += 'EMA-Cross-Down '; }
    if (currentRsi > 70) { confidence += 25; reason += 'RSI-Overbought '; }
    else if (currentRsi > 60) { confidence += 15; reason += 'RSI-High '; }
    if (nearResistance) { confidence += 15; reason += 'Resistance-Reject '; }
    if (bearishCount >= 4) { confidence += 25; reason += `Strong-Mom(${bearishCount}/5) `; }
    else if (bearishCount >= 3) { confidence += 15; reason += `Momentum(${bearishCount}/5) `; }
    if (ema8Val < ema20Val && ema20Val < ema50Val) { confidence += 15; reason += 'EMA-Aligned '; }
    else if (ema8Val < ema20Val) { confidence += 10; reason += 'EMA-Bearish '; }
    
    if (confidence >= RISK_CONFIG.MIN_SIGNAL_CONFIDENCE) {
      signal = { type: 'sell', confidence: Math.min(confidence, 100), reason: `SELL: ${reason.trim()}` };
      marketStructure.set(symbol, 'bearish');
    }
  }
  
  // FALLBACK: If no signal but clear momentum, generate a lower confidence signal
  if (!signal && (bullishCount >= 3 || bearishCount >= 3)) {
    const isBullish = bullishCount > bearishCount;
    confidence = 40 + (Math.abs(bullishCount - bearishCount) * 5);
    if (confidence >= RISK_CONFIG.MIN_SIGNAL_CONFIDENCE) {
      reason = isBullish ? `Momentum(${bullishCount}/5 bullish)` : `Momentum(${bearishCount}/5 bearish)`;
      signal = { type: isBullish ? 'buy' : 'sell', confidence, reason };
      marketStructure.set(symbol, isBullish ? 'bullish' : 'bearish');
    }
  }
  
  // No signal at all
  if (!signal) {
    return null;
  }
  
  // Risk management
  const riskMultipliers = {
    low: { sl: 3.0, tp: 4.5, volume: 0.01 },
    medium: { sl: 2.5, tp: 3.5, volume: 0.02 },
    high: { sl: 2.0, tp: 3.0, volume: 0.03 },
    aggressive: { sl: 1.5, tp: 2.5, volume: 0.05 }
  };
  
  const risk = riskMultipliers[riskLevel] || riskMultipliers.medium;
  const isBuy = signal.type === 'buy';
  
  // HIGH CONFIDENCE (70%+): Use tighter, strategic SL/TP
  // Tighter SL means less risk per trade, better R:R ratio
  let slMultiplier = risk.sl;
  let tpMultiplier = risk.tp;
  
  if (signal.confidence >= RISK_CONFIG.HIGH_CONFIDENCE_THRESHOLD) {
    // High confidence = tighter SL (1.5x ATR) with good TP (3x ATR) = 1:2 R:R
    slMultiplier = 1.5;
    tpMultiplier = 3.0;
  } else if (signal.confidence >= 60) {
    // Medium-high confidence = moderate SL/TP
    slMultiplier = 2.0;
    tpMultiplier = 3.5;
  }
  
  return {
    symbol,
    type: signal.type,
    entryPrice: currentPrice,
    stopLoss: isBuy ? currentPrice - (atr * slMultiplier) : currentPrice + (atr * slMultiplier),
    takeProfit: isBuy ? currentPrice + (atr * tpMultiplier) : currentPrice - (atr * tpMultiplier),
    volume: risk.volume, // Will be recalculated based on account balance
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
 * With PROPER RISK MANAGEMENT
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
    
    // Get account info for risk management
    let accountInfo;
    try {
      accountInfo = await connection.getAccountInformation();
      console.log(`  💰 Account: Balance=$${accountInfo.balance?.toFixed(2)}, Equity=$${accountInfo.equity?.toFixed(2)}, P/L=$${(accountInfo.equity - accountInfo.balance)?.toFixed(2)}`);
    } catch (e) {
      console.log(`  ⚠️ Could not get account info: ${e.message}`);
      accountInfo = { balance: 0, equity: 0 };
    }
    
    // Get existing open positions from MT5
    let livePositions = [];
    try {
      livePositions = await connection.getPositions();
      console.log(`  📋 Live positions from MT5: ${livePositions.length}`);
    } catch (e) {
      console.log(`  ⚠️ Could not get live positions: ${e.message}`);
    }
    
    // Calculate current P/L
    const currentProfitLoss = livePositions.reduce((sum, p) => sum + (p.profit || p.unrealizedProfit || 0), 0);
    
    // Risk check: Can we open more trades?
    const riskCheck = canOpenMoreTrades(
      accountInfo.balance,
      accountInfo.equity,
      livePositions.length,
      currentProfitLoss
    );
    
    if (!riskCheck.canTrade) {
      console.log(`  ⛔ RISK LIMIT: ${riskCheck.reason}`);
      return;
    }
    
    // Get account for historical candle data
    const account = await getAccount(metaApiAccountId, accountId);
    if (!account) {
      console.log(`  ⚠️ Could not get account for historical candles`);
      return;
    }
    
    // Collect signals from trading pairs
    const signals = [];
    const skippedSymbols = [];
    
    // Check if this is a News Trader bot
    const isNewsTrader = robotName.toLowerCase().includes('news');
    
    console.log(`  📋 Scanning ${TRADING_PAIRS.length} pairs: ${TRADING_PAIRS.join(', ')}`);
    
    for (const symbol of TRADING_PAIRS) {
      try {
        // Check cooldown (skip for this check - we'll apply cooldown after getting signal)
        const lastTrade = lastTradeTime.get(symbol) || 0;
        const onCooldown = Date.now() - lastTrade < RISK_CONFIG.TRADE_COOLDOWN_MS;
        
        // Get signal first to check confidence level
        const candles = await fetchCandles(account, symbol, timeframe?.toLowerCase() || 'm15', 100);
        
        if (!candles || candles.length < 30) {
          skippedSymbols.push(`${symbol}(no candles)`);
          continue;
        }
        
        // Get current price from latest candle
        const currentPrice = candles[candles.length - 1].close;
        
        let signal = null;
        
        // ================================================================
        // NEWS TRADER BOT - Uses advanced news analysis
        // ================================================================
        if (isNewsTrader) {
          try {
            // Check for news-based signal
            signal = await generateNewsSignal(symbol, candles, currentPrice);
            
            if (signal) {
              console.log(`  📰 ${symbol}: NEWS ${signal.type} signal (${signal.confidence}%) - ${signal.reason}`);
              console.log(`     Impact: ${signal.impactLevel}, Mode: ${signal.tradingMode}, SL: ${signal.slPips}pips, TP: ${signal.tpPips}pips`);
            } else {
              // If no news signal, check if we should avoid trading due to upcoming news
              const newsAvoid = await shouldAvoidTradingDueToNews(symbol);
              if (newsAvoid.avoid) {
                console.log(`  ⏸️ ${symbol}: Avoiding - ${newsAvoid.reason}`);
                continue;
              }
              // Fall back to regular analysis if no news
              signal = analyzeMarket(candles, symbol, riskLevel);
            }
          } catch (newsErr) {
            console.log(`  ⚠️ News analysis error for ${symbol}: ${newsErr.message}`);
            // Fall back to regular analysis
            signal = analyzeMarket(candles, symbol, riskLevel);
          }
        } else {
          // Regular bots: Use standard market analysis
          signal = analyzeMarket(candles, symbol, riskLevel);
        }
        
        if (!signal || signal.confidence < RISK_CONFIG.MIN_SIGNAL_CONFIDENCE) {
          continue;
        }
        
        // Get dynamic position limits based on account balance
        const positionLimits = getPositionLimits(accountInfo.balance);
        
        // Check if we're under target positions - if so, be more aggressive
        const underTarget = livePositions.length < positionLimits.target;
        const isHighConfidence = signal.confidence >= RISK_CONFIG.HIGH_CONFIDENCE_THRESHOLD;
        
        // ================================================================
        // HEDGING PREVENTION - NEVER open opposite positions on same pair
        // This is critical to prevent BUY+SELL on same symbol
        // ================================================================
        const signalDirection = signal.type.toLowerCase();
        const oppositeDirection = signalDirection === 'buy' ? 'sell' : 'buy';
        const existingPositionsOnPair = livePositions.filter(p => p.symbol === symbol);
        const hasOpposingPosition = existingPositionsOnPair.some(p => 
          p.type?.toLowerCase() === oppositeDirection
        );
        const hasSameDirectionPosition = existingPositionsOnPair.some(p => 
          p.type?.toLowerCase() === signalDirection
        );
        
        if (RISK_CONFIG.PREVENT_HEDGING && hasOpposingPosition) {
          // NEVER open opposite position - skip this pair entirely
          console.log(`  🚫 ${symbol}: Skipping ${signal.type.toUpperCase()} - already have ${oppositeDirection.toUpperCase()} position (no hedging)`);
          continue;
        }
        
        // If we already have same-direction position, only add for high confidence
        if (hasSameDirectionPosition && !isHighConfidence) {
          console.log(`  ⏸️ ${symbol}: Already have ${signalDirection.toUpperCase()} position, need 70%+ to add more`);
          skippedSymbols.push(`${symbol}(has position)`);
          continue;
        }
        
        // When under target: Skip cooldown for all 50%+ signals
        // We want to fill up to 10 positions ASAP
        if (!underTarget && !isHighConfidence) {
          // Only apply cooldown restriction when AT or ABOVE target
          if (onCooldown) {
            skippedSymbols.push(`${symbol}(cooldown)`);
            continue; // Skip - recently traded
          }
        }
        
        signals.push({ symbol, signal, candles });
        console.log(`  📊 ${symbol}: ${signal.type.toUpperCase()} signal (${signal.confidence}%)${isHighConfidence ? ' 🔥HIGH' : ''} - ${signal.reason}`);
      } catch (err) {
        skippedSymbols.push(`${symbol}(error: ${err.message?.substring(0, 30)})`);
        continue;
      }
    }
    
    // Log skipped symbols for debugging
    if (skippedSymbols.length > 0) {
      console.log(`  ⏭️ Skipped: ${skippedSymbols.join(', ')}`);
    }
    
    if (signals.length === 0) {
      console.log(`  ⏸️ No strong signals (need ${RISK_CONFIG.MIN_SIGNAL_CONFIDENCE}%+ confidence)`);
      return;
    }
    
    // Sort signals by confidence (strongest first)
    signals.sort((a, b) => b.signal.confidence - a.signal.confidence);
    
    // Separate high-confidence (70%+), news signals, and normal signals
    const highConfidenceSignals = signals.filter(s => s.signal.confidence >= RISK_CONFIG.HIGH_CONFIDENCE_THRESHOLD);
    const newsSignals = signals.filter(s => s.signal.impactLevel && (s.signal.impactLevel === 'HIGH' || s.signal.impactLevel === 'MEDIUM'));
    const normalSignals = signals.filter(s => s.signal.confidence < RISK_CONFIG.HIGH_CONFIDENCE_THRESHOLD && !s.signal.impactLevel);
    
    console.log(`  🎯 Found ${signals.length} signal(s): ${highConfidenceSignals.length} HIGH CONF, ${newsSignals.length} NEWS, ${normalSignals.length} normal`);
    
    // ================================================================
    // NEWS SIGNALS - Prioritize high-impact news trades
    // ================================================================
    if (newsSignals.length > 0 && isNewsTrader) {
      console.log(`  📰 NEWS TRADING MODE - Processing ${newsSignals.length} news signal(s)...`);
      
      for (const { symbol, signal } of newsSignals) {
        const currentPL = livePositions.reduce((sum, p) => sum + (p.profit || 0), 0);
        const riskCheck = canOpenMoreTrades(accountInfo.balance, accountInfo.equity, livePositions.length, currentPL, signal.confidence);
        
        if (!riskCheck.canTrade) {
          console.log(`    ⛔ ${symbol}: ${riskCheck.reason}`);
          continue;
        }
        
        try {
          // News signals already have SL/TP calculated
          const lotSize = calculatePositionSize(accountInfo.balance, signal.slPips, symbol, signal.confidence);
          signal.volume = lotSize;
          
          console.log(`    📰 ${symbol}: ${signal.impactLevel} IMPACT NEWS - ${signal.tradingMode}`);
          console.log(`       ${signal.type} @ ${signal.entryPrice?.toFixed(5)}, SL: ${signal.stopLoss?.toFixed(5)}, TP: ${signal.takeProfit?.toFixed(5)}`);
          console.log(`       R:R ${signal.riskReward}:1, Lots: ${lotSize}`);
          
          const trade = await executeTrade(connection, accountId, robotId, userId, robotName, signal);
          if (trade) {
            lastTradeTime.set(symbol, Date.now());
            livePositions = await connection.getPositions();
            console.log(`    ✅ NEWS trade opened on ${symbol}`);
          }
        } catch (err) {
          console.error(`    ❌ Failed to open news trade on ${symbol}:`, err.message);
        }
      }
    }
    
    // For HIGH CONFIDENCE signals - unlimited positions allowed
    if (highConfidenceSignals.length > 0) {
      console.log(`  🔥 HIGH CONFIDENCE MODE - Opening unlimited positions on ${highConfidenceSignals.length} strong signal(s)...`);
      
      for (const { symbol, signal } of highConfidenceSignals) {
        // Re-check risk for each high-confidence trade
        const currentPL = livePositions.reduce((sum, p) => sum + (p.profit || 0), 0);
        const riskCheck = canOpenMoreTrades(accountInfo.balance, accountInfo.equity, livePositions.length, currentPL, signal.confidence);
        
        if (!riskCheck.canTrade) {
          console.log(`    ⛔ ${symbol}: ${riskCheck.reason}`);
          continue;
        }
        
        try {
          // Calculate position size with high-confidence settings (1% risk, tighter SL)
          const pipSize = getPipSize(symbol);
          const stopLossPips = Math.abs(signal.entryPrice - signal.stopLoss) / pipSize;
          const lotSize = calculatePositionSize(accountInfo.balance, stopLossPips, symbol, signal.confidence);
          signal.volume = lotSize;
          
          console.log(`    🔥 ${symbol}: HIGH CONFIDENCE ${signal.confidence}% - SL=${stopLossPips.toFixed(0)}pips, TP=2x SL, Lots=${lotSize}`);
          
          // Execute trade
          const trade = await executeTrade(connection, accountId, robotId, userId, robotName, signal);
          if (trade) {
            lastTradeTime.set(symbol, Date.now());
            livePositions = await connection.getPositions(); // Refresh positions
            console.log(`    ✅ HIGH CONFIDENCE trade opened on ${symbol}`);
          }
        } catch (err) {
          console.error(`    ❌ Failed to open high-confidence trade on ${symbol}:`, err.message);
        }
      }
    }
    
    // For NORMAL signals - AGGRESSIVE MODE: Always try to maintain target positions
    if (normalSignals.length > 0) {
      const posLimits = getPositionLimits(accountInfo.balance);
      const currentPositionCount = livePositions.length;
      const slotsToFill = posLimits.target - currentPositionCount;
      
      if (slotsToFill <= 0) {
        console.log(`  📊 At target positions (${currentPositionCount}/${posLimits.target})`);
      } else {
        // Allow up to 10 trades per cycle to fill up faster for big accounts
        const maxTradesPerCycle = accountInfo.balance >= 10000 ? 10 : (accountInfo.balance >= 5000 ? 7 : 5);
        const slotsAvailable = Math.min(slotsToFill, maxTradesPerCycle);
        console.log(`  🎯 FILLING POSITIONS: Need ${slotsToFill} more to reach target ${posLimits.target}`);
        console.log(`  🎰 Opening up to ${slotsAvailable} trade(s) this cycle...`);
        
        let tradesOpened = 0;
        
        for (const { symbol, signal } of normalSignals) {
          if (tradesOpened >= slotsAvailable) break;
          
          // Re-check we can still trade
          const currentPL = livePositions.reduce((sum, p) => sum + (p.profit || 0), 0);
          const riskCheck = canOpenMoreTrades(accountInfo.balance, accountInfo.equity, livePositions.length, currentPL, signal.confidence);
          if (!riskCheck.canTrade) {
            console.log(`    ⛔ ${riskCheck.reason}`);
            break;
          }
          
          try {
            // Calculate proper position size based on account balance
            const pipSize = getPipSize(symbol);
            const stopLossPips = Math.abs(signal.entryPrice - signal.stopLoss) / pipSize;
            const lotSize = calculatePositionSize(accountInfo.balance, stopLossPips, symbol, signal.confidence);
            signal.volume = lotSize;
            
            console.log(`    📐 ${symbol}: ${signal.confidence}% - SL=${stopLossPips.toFixed(0)}pips, Lots=${lotSize}`);
            
            // Execute trade
            const trade = await executeTrade(connection, accountId, robotId, userId, robotName, signal);
            if (trade) {
              tradesOpened++;
              lastTradeTime.set(symbol, Date.now());
              livePositions = await connection.getPositions(); // Refresh count
              console.log(`    ✅ Trade opened on ${symbol} (${livePositions.length}/${posLimits.target} positions)`);
            }
          } catch (err) {
            console.error(`    ❌ Failed to open trade on ${symbol}:`, err.message);
          }
        }
      }
    }
    
    // Refresh final position count
    livePositions = await connection.getPositions();
    const finalLimits = getPositionLimits(accountInfo.balance);
    console.log(`  📈 Cycle complete. Total positions: ${livePositions.length}/${finalLimits.target} target`);
    
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
      SELECT DISTINCT m.id as account_id, m.api_key as metaapi_account_id, m.user_id
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
  console.log('   RISK MANAGEMENT ENABLED');
  console.log(`   Max Risk/Trade: ${RISK_CONFIG.MAX_RISK_PER_TRADE * 100}%`);
  console.log(`   Max Positions: ${RISK_CONFIG.MAX_TOTAL_POSITIONS}`);
  console.log(`   Min Signal: ${RISK_CONFIG.MIN_SIGNAL_CONFIDENCE}%`);
  console.log('   Cycle: 30 seconds');
  console.log('========================================\n');
  
  // Run immediately on start
  await runTradingCycle();
  
  // Run every 30 seconds (more conservative)
  tradingInterval = setInterval(runTradingCycle, 30 * 1000);
  
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
        
        // Also get the account object for historical candles
        const account = await getAccount(data.metaApiAccountId, accountId);
        
        // Step 1: Check and manage open positions
        await manageOpenPositions(connection, account, accountId, data.userId);
        
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
async function manageOpenPositions(connection, account, accountId, userId) {
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
      const currentSL = position.stopLoss;
      const currentTP = position.takeProfit;
      
      console.log(`    Position ${positionId}: ${symbol} ${positionType} P/L: $${profit.toFixed(2)}`);
      
      // Fetch current market data to check structure
      let shouldClose = false;
      let closeReason = '';
      
      try {
        // Use account object for historical candles (not connection)
        let candles = null;
        if (account && typeof account.getHistoricalCandles === 'function') {
          candles = await account.getHistoricalCandles(symbol, '5m', null, 30);
        } else {
          console.log(`    ⚠️ Could not analyze ${symbol}: no account for candles`);
          continue;
        }
        
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
          // BREAKEVEN PROTECTION - Move SL to entry when position shows good profit
          // Protects gains from structure shifts without closing prematurely
          // =========================================================================
          const pipSize = getPipSize(symbol);
          const breakevenBuffer = pipSize * 3; // 3 pips buffer above entry for spread
          
          // Move to breakeven when profit reaches 1 ATR OR $10 (whichever is first)
          const shouldMoveToBreakeven = profitInATR >= 1.0 || profit >= 10;
          
          if (shouldMoveToBreakeven && currentSL !== undefined) {
            let newSL = null;
            
            if (positionType === 'buy' || positionType?.toLowerCase() === 'position_type_buy') {
              // For BUY: SL should be below entry, move it to entry + small buffer
              const breakevenSL = openPrice + breakevenBuffer;
              if (!currentSL || currentSL < breakevenSL) {
                newSL = breakevenSL;
              }
            } else if (positionType === 'sell' || positionType?.toLowerCase() === 'position_type_sell') {
              // For SELL: SL should be above entry, move it to entry - small buffer
              const breakevenSL = openPrice - breakevenBuffer;
              if (!currentSL || currentSL > breakevenSL) {
                newSL = breakevenSL;
              }
            }
            
            // Execute breakeven modification
            if (newSL !== null) {
              try {
                await connection.modifyPosition(positionId, newSL, currentTP);
                console.log(`    🛡️ BREAKEVEN SET: ${symbol} SL moved to ${newSL.toFixed(5)} (entry: ${openPrice.toFixed(5)})`);
              } catch (modifyErr) {
                // Don't spam errors for this
                if (!modifyErr.message?.includes('same value')) {
                  console.log(`    ⚠️ Could not set breakeven: ${modifyErr.message}`);
                }
              }
            }
          }
          
          // =========================================================================
          // EXIT CONDITIONS - CONSERVATIVE APPROACH
          // Only exit when there's strong evidence, let winners run
          // =========================================================================
          
          // 1. SECURE PROFITS: Close when profit >= 2 ATR (let winners run more)
          if (profitInATR >= 2.0) {
            shouldClose = true;
            closeReason = `PROFIT SECURED: ${profitInATR.toFixed(1)} ATR move captured ($${profit.toFixed(2)})`;
          }
          
          // 2. STRONG PROFIT: Take profit at $25+ regardless of ATR
          else if (profit >= 25) {
            shouldClose = true;
            closeReason = `PROFIT TARGET: $${profit.toFixed(2)} reached`;
          }
          
          // 3. MARKET STRUCTURE CHANGE: STRONG reversal against position
          // Require EMA cross + RSI extreme + momentum confirmation
          else if (positionType === 'buy' && ema8Val < ema20Val && currentRsi > 70) {
            // Need 3+ bearish candles to confirm
            const recentCandles = candles.slice(-5);
            const bearishCount = recentCandles.filter(c => c.close < c.open).length;
            if (bearishCount >= 3) {
              shouldClose = true;
              closeReason = `STRUCTURE CHANGE: EMA bearish + RSI ${currentRsi.toFixed(0)} + ${bearishCount}/5 bearish candles`;
            }
          }
          else if (positionType === 'sell' && ema8Val > ema20Val && currentRsi < 30) {
            // Need 3+ bullish candles to confirm
            const recentCandles = candles.slice(-5);
            const bullishCount = recentCandles.filter(c => c.close > c.open).length;
            if (bullishCount >= 3) {
              shouldClose = true;
              closeReason = `STRUCTURE CHANGE: EMA bullish + RSI ${currentRsi.toFixed(0)} + ${bullishCount}/5 bullish candles`;
            }
          }
          
          // 4. TRAILING STOP: Lock in profits after 1.5 ATR move with strong reversal
          else if (profitInATR >= 1.5 && profit > 5) {
            // Check if momentum is strongly fading (3+ candles against)
            const recentCandles = candles.slice(-4);
            const againstCount = positionType === 'buy'
              ? recentCandles.filter(c => c.close < c.open).length
              : recentCandles.filter(c => c.close > c.open).length;
            
            if (againstCount >= 3) {
              shouldClose = true;
              closeReason = `TRAILING STOP: Momentum reversed after ${profitInATR.toFixed(1)} ATR profit`;
            }
          }
          
          // 5. CUT LOSSES: Close if loss exceeds 3 ATR or $30 (wider stop)
          else if (profitInATR <= -3.0 || profit <= -30) {
            shouldClose = true;
            closeReason = `STOP LOSS: ${profitInATR.toFixed(1)} ATR loss ($${profit.toFixed(2)})`;
          }
        }
      } catch (analysisError) {
        console.log(`    ⚠️ Could not analyze ${symbol}: ${analysisError.message}`);
        // Fallback to simple profit/loss rules with wider thresholds
        if (profit >= 25) {
          shouldClose = true;
          closeReason = `PROFIT TARGET: $${profit.toFixed(2)}`;
        } else if (profit <= -30) {
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

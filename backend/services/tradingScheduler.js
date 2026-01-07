import pool from '../config/database.js';
import { openTrade, mt5Connections } from './mt5Service.js';
import { emitTradeSignal } from './websocketService.js';

/**
 * =========================================================================
 * TRADING SCHEDULER SERVICE
 * =========================================================================
 * Runs continuously on the backend server to execute trades for ALL robots.
 * This is server-side - it runs 24/7 regardless of browser/client state.
 * =========================================================================
 */

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
    
    api = new MetaApi(token);
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
 */
async function getConnection(metaApiAccountId, mt5AccountId) {
  // Check scheduler's own connections first
  if (schedulerConnections.has(mt5AccountId)) {
    const conn = schedulerConnections.get(mt5AccountId);
    if (conn && conn.connection) {
      return conn.connection;
    }
  }
  
  // Check mt5Service connections
  if (mt5Connections.has(mt5AccountId)) {
    const conn = mt5Connections.get(mt5AccountId);
    if (conn && conn.connection) {
      return conn.connection;
    }
  }
  
  // Create new connection
  if (!metaApiAccountId) {
    console.log(`  ❌ No MetaAPI account ID for MT5 account ${mt5AccountId}`);
    return null;
  }
  
  try {
    const metaApi = await initMetaApi();
    if (!metaApi) return null;
    
    console.log(`  🔌 Connecting to MetaAPI account: ${metaApiAccountId}`);
    
    const account = await metaApi.metatraderAccountApi.getAccount(metaApiAccountId);
    
    // Deploy if needed
    if (account.state !== 'DEPLOYED') {
      console.log(`  📦 Deploying account...`);
      await account.deploy();
      await account.waitDeployed();
    }
    
    // Get RPC connection
    const connection = account.getRPCConnection();
    await connection.connect();
    await connection.waitSynchronized({ timeoutInSeconds: 30 });
    
    console.log(`  ✅ Connected to MetaAPI account ${metaApiAccountId}`);
    
    // Store connection
    schedulerConnections.set(mt5AccountId, { connection, account });
    
    return connection;
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
    // Place order via MetaAPI
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
 * Fetch candle data via MetaAPI
 */
async function fetchCandles(connection, symbol, timeframe, count = 50) {
  try {
    const history = await connection.getHistoricalCandles(symbol, timeframe, null, count);
    return history || [];
  } catch (error) {
    console.error(`Failed to fetch candles for ${symbol}:`, error.message);
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
 * Analyze market and generate trading signal
 * Uses momentum-based strategy for reliable signals
 */
function analyzeMarket(candles, symbol, riskLevel = 'medium') {
  if (!candles || candles.length < 20) return null;
  
  const currentPrice = candles[candles.length - 1].close;
  const atr = calculateATR(candles, 14);
  
  if (atr === 0) return null;
  
  // Momentum analysis - look at last 5-10 candles
  const recentCandles = candles.slice(-5);
  const bullishCount = recentCandles.filter(c => c.close > c.open).length;
  const bearishCount = recentCandles.filter(c => c.close < c.open).length;
  
  // EMA crossover check
  const ema8 = calculateEMA(candles.map(c => c.close), 8);
  const ema20 = calculateEMA(candles.map(c => c.close), 20);
  const emaCrossUp = ema8[ema8.length - 1] > ema20[ema20.length - 1] && 
                     ema8[ema8.length - 2] <= ema20[ema20.length - 2];
  const emaCrossDown = ema8[ema8.length - 1] < ema20[ema20.length - 1] && 
                       ema8[ema8.length - 2] >= ema20[ema20.length - 2];
  
  // Calculate RSI
  const rsi = calculateRSI(candles.map(c => c.close), 14);
  const currentRsi = rsi[rsi.length - 1];
  
  // Decision logic
  let isBuy = false;
  let confidence = 0;
  let reason = '';
  
  // Strong momentum OR EMA crossover OR RSI extremes
  if (bullishCount >= 4 || emaCrossUp || currentRsi < 30) {
    isBuy = true;
    confidence = 60 + (bullishCount >= 4 ? 15 : 0) + (emaCrossUp ? 15 : 0) + (currentRsi < 30 ? 10 : 0);
    reason = `BUY: Momentum (${bullishCount}B)${emaCrossUp ? ' + EMA Cross Up' : ''}${currentRsi < 30 ? ' + RSI Oversold' : ''}`;
  } else if (bearishCount >= 4 || emaCrossDown || currentRsi > 70) {
    isBuy = false;
    confidence = 60 + (bearishCount >= 4 ? 15 : 0) + (emaCrossDown ? 15 : 0) + (currentRsi > 70 ? 10 : 0);
    reason = `SELL: Momentum (${bearishCount}S)${emaCrossDown ? ' + EMA Cross Down' : ''}${currentRsi > 70 ? ' + RSI Overbought' : ''}`;
  } else {
    // Default to momentum direction when mixed signals
    isBuy = bullishCount >= bearishCount;
    confidence = 50; // Base confidence for forced entry
    reason = `FORCED: ${isBuy ? 'Bullish' : 'Bearish'} momentum (${bullishCount}B/${bearishCount}S)`;
  }
  
  // Risk multipliers
  const riskMultipliers = {
    low: { sl: 2.5, tp: 3.0, volume: 0.01 },
    medium: { sl: 2.0, tp: 2.5, volume: 0.05 },
    high: { sl: 1.5, tp: 2.0, volume: 0.10 },
    aggressive: { sl: 1.2, tp: 1.5, volume: 0.15 }
  };
  
  const risk = riskMultipliers[riskLevel] || riskMultipliers.medium;
  
  const stopLoss = isBuy
    ? currentPrice - (atr * risk.sl)
    : currentPrice + (atr * risk.sl);
  const takeProfit = isBuy
    ? currentPrice + (atr * risk.tp)
    : currentPrice - (atr * risk.tp);
  
  return {
    symbol,
    type: isBuy ? 'buy' : 'sell',
    entryPrice: currentPrice,
    stopLoss,
    takeProfit,
    volume: risk.volume,
    confidence,
    reason,
    atr
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
    user_id: userId
  } = robot;
  
  try {
    console.log(`\n🤖 Processing robot: ${robotName} (${timeframe || 'm15'})`);
    
    // Get or create connection using scheduler's own connection manager
    const connection = await getConnection(metaApiAccountId, accountId);
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
        const candles = await fetchCandles(connection, symbol, timeframe.toLowerCase(), 100);
        
        if (!candles || candles.length < 20) {
          console.log(`  ⚠️ Insufficient data for ${symbol}`);
          continue;
        }
        
        // Analyze market
        const signal = analyzeMarket(candles, symbol, riskLevel);
        
        if (!signal || signal.confidence < 40) {
          console.log(`  ⚠️ No signal for ${symbol} (conf: ${signal?.confidence || 0}%)`);
          continue;
        }
        
        console.log(`  ✅ SIGNAL: ${signal.type.toUpperCase()} ${symbol} @ ${signal.entryPrice.toFixed(5)}`);
        console.log(`     Confidence: ${signal.confidence}%, Reason: ${signal.reason}`);
        console.log(`     SL: ${signal.stopLoss.toFixed(5)}, TP: ${signal.takeProfit.toFixed(5)}`);
        
        // Execute trade directly via MetaAPI
        const trade = await executeTradeViaMetaApi(
          connection,
          accountId,
          robotId,
          userId,
          signal
        );
        
        if (trade) {
          console.log(`  🎉 TRADE EXECUTED: #${trade.id} - ${signal.symbol} ${signal.type.toUpperCase()}`);
          
          // Emit trade signal to connected clients
          emitTradeSignal(userId, {
            robotId,
            robotName,
            signal,
            trade
          });
          
          // Only open one trade per robot per cycle
          break;
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
    
    for (const robot of robots) {
      await executeRobotTrade(robot);
    }
    
    console.log(`\n[${new Date().toLocaleTimeString()}] ========== CYCLE COMPLETE ==========\n`);
    
  } catch (error) {
    console.error('Trading cycle error:', error);
  }
}

export function getTradingSchedulerStatus() {
  return {
    isRunning,
    message: isRunning ? 'Trading scheduler is active' : 'Trading scheduler is stopped'
  };
}

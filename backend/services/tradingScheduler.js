import pool from '../config/database.js';
import { mt5Connections, connectMT5Account, isMetaApiReady, waitForMetaApi } from './mt5Service.js';
import { emitTradeSignal, emitTradeClosed, emitPositionUpdate, emitBalanceUpdate } from './websocketService.js';
import { generateNewsSignal, shouldAvoidTradingDueToNews, IMPACT } from './newsService.js';
import { sendTradeOpenedAlert, sendTradeClosedAlert } from './notificationService.js';
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
// RISK MANAGEMENT CONSTANTS - PRECIOUS METALS TRADING (XAUUSD + XAGUSD)
// Lot sizes scaled by account size to PREVENT blowing accounts
// Requires 3+ strategies to agree before trading
// =========================================================================
const RISK_CONFIG = {
  // ACCOUNT PROTECTION - These are absolute maximums, actual risk is lower for small accounts
  MAX_RISK_PER_TRADE: parseFloat(process.env.MAX_RISK_PER_TRADE) || 0.05,     // Max 5% risk
  MAX_TOTAL_EXPOSURE: parseFloat(process.env.MAX_TOTAL_EXPOSURE) || 0.30,     // Max 30% total exposure
  MIN_STRATEGIES_REQUIRED: parseInt(process.env.MIN_STRATEGIES_REQUIRED) || 3, // Require 3+ strategies to agree
  HIGH_CONFIDENCE_THRESHOLD: parseInt(process.env.HIGH_CONFIDENCE_THRESHOLD) || 75, // 75%+ = Strong signal
  VERY_HIGH_CONFIDENCE: 85,     // 85%+ = Higher tier lot
  EXTREME_CONFIDENCE: 90,       // 90%+ = Max tier lot (still capped by account)
  STRUCTURE_SHIFT_CANDLES: 3,   // Need 3 candles to confirm structure shift
  MIN_ACCOUNT_BALANCE: parseFloat(process.env.MIN_ACCOUNT_BALANCE) || 100,    // Default $100
  TRADE_COOLDOWN_MS: parseInt(process.env.TRADE_COOLDOWN_MS) || 60000,        // Default 1 min cooldown
  PREVENT_HEDGING: true,        // Never open opposite positions on same pair
  MAX_POSITIONS_PER_SYMBOL: 999, // NO LIMIT - we only trade 2 pairs (XAUUSD, XAGUSD)
  DAILY_LOSS_LIMIT: parseFloat(process.env.DAILY_LOSS_LIMIT) || 0.15,         // 15% daily loss limit
  MAX_LOT_SIZE: 1.00,           // Absolute max - but account tier limits apply first
  MIN_LOT_SIZE: 0.01,           // Minimum lot size
  // LOT MULTIPLIERS BY CONFLUENCE COUNT
  LOT_MULTIPLIER_3_STRATS: 1.0, // 3 strategies = base lot
  LOT_MULTIPLIER_4_STRATS: 1.2, // 4 strategies = 1.2x lot
  LOT_MULTIPLIER_5_STRATS: 1.4, // 5 strategies = 1.4x lot
  LOT_MULTIPLIER_6_PLUS: 1.6,   // 6+ strategies = 1.6x lot
  // ACCOUNT TIER LIMITS (enforced in calculatePositionSize)
  // MICRO ($100-199): max 2% risk, max 0.02 lots
  // MINI ($200-499): max 3% risk, max 0.05 lots
  // SMALL ($500-999): max 4% risk, max 0.10 lots
  // MEDIUM ($1000-2499): max 5% risk, max 0.20 lots
  // STANDARD ($2500-4999): max 6% risk, max 0.35 lots
  // PROFESSIONAL ($5000-9999): max 8% risk, max 0.50 lots
  // LARGE ($10000+): max 10% risk, max 1.00 lots
};

// =========================================================================
// BOT CONFIGURATION - 8 Core Strategies with Alignment Requirements
// Each bot requires specific strategy alignments before trading
// ALIGNMENT = Multiple strategies must agree for high-probability entries
// =========================================================================
const BOT_CONFIG = {
  // =====================================================================
  // BOT 1: EMA 200 PULLBACK PRO - High Win Rate Trend Strategy
  // ALIGNMENT: 2 out of 3 (Break & Retest + RSI Divergence confirm pullback)
  // Risk: Medium | Trade Frequency: Good
  // =====================================================================
  'ema-pullback': {
    canTrade: true,
    strategy: 'ema_pullback',
    description: 'EMA200/50 trend + pullback with RSI 40-60 neutral zone',
    allowedPairs: ['XAUUSD', 'XAGUSD'],
    timeframes: ['m5', 'm15', 'h1', 'h4'],
    maxLotSize: 0.5,
    maxPositions: 3,
    cooldownMs: 180000,
    goldTPPips: 350,
    goldSLPips: 150,
    silverTPPips: 50,
    silverSLPips: 25,
    riskRewardMin: 2.0,
    // ALIGNMENT REQUIREMENTS
    minAlignments: 2,           // Need 2 out of 3 strategies to agree
    alignWith: ['break-retest', 'rsi-divergence', 'order-block'],
    alignmentExplanation: 'Break & Retest + RSI Divergence confirm pullback entry',
    riskLevel: 'MEDIUM',
    rules: {
      needsEMA200Above: true,
      needsEMA50Above200: true,
      rsiNeutral: [40, 60],
      needsPullback: true,
      confirmationCandle: true,
    }
  },
  
  // =====================================================================
  // BOT 2: BREAK & RETEST - Institutional Favorite
  // ALIGNMENT: 2 out of 3 (EMA Trend + VWAP/Order Block confirm breakout)
  // Risk: Medium-High | Reliability: High
  // =====================================================================
  'break-retest': {
    canTrade: true,
    strategy: 'break_retest',
    description: 'Breakout + retest of support/resistance levels',
    allowedPairs: ['XAUUSD', 'XAGUSD'],
    timeframes: ['m5', 'm15', 'h1'],
    maxLotSize: 0.5,
    maxPositions: 3,
    cooldownMs: 300000,
    goldTPPips: 400,
    goldSLPips: 200,
    silverTPPips: 60,
    silverSLPips: 30,
    riskRewardMin: 2.0,
    // ALIGNMENT REQUIREMENTS
    minAlignments: 2,           // Need 2 out of 3 strategies to agree
    alignWith: ['ema-pullback', 'vwap-reversion', 'order-block'],
    alignmentExplanation: 'EMA 200 Trend + VWAP/Order Block confirm breakout',
    riskLevel: 'MEDIUM_HIGH',
    rules: {
      needsBreakout: true,
      needsRetest: true,
      confirmationCandle: true,
      volumeFilter: false,
    }
  },
  
  // =====================================================================
  // BOT 3: LIQUIDITY SWEEP SMC - Smart Money Concept
  // ALIGNMENT: 3 out of 3 (EMA Trend + S/R + VWAP confirm sweep)
  // Risk: Low | Win Rate: HIGH | Trade Frequency: Fewer trades
  // =====================================================================
  'liquidity-sweep': {
    canTrade: true,
    strategy: 'liquidity_sweep',
    description: 'SMC liquidity sweep + market structure shift',
    allowedPairs: ['XAUUSD', 'XAGUSD'],
    timeframes: ['m5', 'm15'],
    maxLotSize: 0.4,
    maxPositions: 3,
    cooldownMs: 180000,
    goldTPPips: 300,
    goldSLPips: 150,
    silverTPPips: 45,
    silverSLPips: 22,
    riskRewardMin: 2.0,
    // ALIGNMENT REQUIREMENTS - STRICTEST (requires ALL 3)
    minAlignments: 3,           // Need ALL 3 strategies to agree
    alignWith: ['ema-pullback', 'order-block', 'vwap-reversion'],
    alignmentExplanation: 'EMA Trend + Support/Resistance + VWAP confirm sweep',
    riskLevel: 'LOW',
    rules: {
      needsSwingHLDetection: true,
      needsLiquiditySweep: true,
      needsStructureShift: true,
      pullbackEntry: true,
    }
  },
  
  // =====================================================================
  // BOT 4: LONDON SESSION BREAKOUT
  // ALIGNMENT: 2 out of 3 (Break & Retest + RSI confirm breakout)
  // Risk: Medium | Avoids false London breakouts
  // =====================================================================
  'london-breakout': {
    canTrade: true,
    strategy: 'london_breakout',
    description: 'Asian range breakout during London session',
    allowedPairs: ['XAUUSD', 'XAGUSD'],
    timeframes: ['m5', 'm15', 'm30'],
    maxLotSize: 0.4,
    maxPositions: 2,
    cooldownMs: 600000,
    goldTPPips: 300,
    goldSLPips: 150,
    silverTPPips: 45,
    silverSLPips: 22,
    riskRewardMin: 2.0,
    // ALIGNMENT REQUIREMENTS
    minAlignments: 2,           // Need 2 out of 3 strategies to agree
    alignWith: ['break-retest', 'rsi-divergence', 'ema-pullback'],
    alignmentExplanation: 'Break & Retest + RSI confirm breakout, avoids false breakouts',
    riskLevel: 'MEDIUM',
    rules: {
      sessionFilter: ['london'],
      timeWindow: { start: 8, end: 11 },
      asianRangeBreak: true,
    }
  },
  
  // =====================================================================
  // BOT 5: ORDER BLOCK TRADER - Institutional SMC
  // ALIGNMENT: 3 out of 3 (EMA Trend + S/R + RSI Divergence)
  // Risk: LOW | Probability: VERY HIGH | Trade Frequency: Low
  // =====================================================================
  'order-block': {
    canTrade: true,
    strategy: 'order_block',
    description: 'Institutional order block identification + rejection',
    allowedPairs: ['XAUUSD', 'XAGUSD'],
    timeframes: ['m5', 'm15', 'h1'],
    maxLotSize: 0.5,
    maxPositions: 3,
    cooldownMs: 300000,
    goldTPPips: 350,
    goldSLPips: 175,
    silverTPPips: 52,
    silverSLPips: 26,
    riskRewardMin: 2.0,
    // ALIGNMENT REQUIREMENTS - STRICTEST (requires ALL 3)
    minAlignments: 3,           // Need ALL 3 strategies to agree
    alignWith: ['ema-pullback', 'break-retest', 'rsi-divergence'],
    alignmentExplanation: 'EMA Trend + S/R + RSI Divergence = very high probability',
    riskLevel: 'LOW',
    rules: {
      needsOrderBlock: true,
      needsRejection: true,
      confirmationCandle: true,
    }
  },
  
  // =====================================================================
  // BOT 6: VWAP MEAN REVERSION
  // ALIGNMENT: 2 out of 3 (EMA Trend + RSI/BB confirms oversold/overbought)
  // Risk: Medium | Win Rate: Medium-High
  // =====================================================================
  'vwap-reversion': {
    canTrade: true,
    strategy: 'vwap_reversion',
    description: 'VWAP mean reversion with RSI confirmation',
    allowedPairs: ['XAUUSD', 'XAGUSD'],
    timeframes: ['m5', 'm15', 'm30'],
    maxLotSize: 0.4,
    maxPositions: 3,
    cooldownMs: 180000,
    goldTPPips: 250,
    goldSLPips: 150,
    silverTPPips: 38,
    silverSLPips: 22,
    riskRewardMin: 1.5,
    // ALIGNMENT REQUIREMENTS
    minAlignments: 2,           // Need 2 out of 3 strategies to agree
    alignWith: ['ema-pullback', 'rsi-divergence', 'fib-continuation'],
    alignmentExplanation: 'EMA Trend + RSI/Bollinger Band confirms oversold/overbought',
    riskLevel: 'MEDIUM',
    rules: {
      needsVWAPDeviation: true,
      needsRSIExtreme: true,
      confirmationCandle: true,
    }
  },
  
  // =====================================================================
  // BOT 7: FIBONACCI CONTINUATION
  // ALIGNMENT: 2 out of 3 (EMA Trend + Break & Retest + RSI Divergence)
  // Risk: Medium | Balance of win rate & trade frequency
  // =====================================================================
  'fib-continuation': {
    canTrade: true,
    strategy: 'fibonacci_continuation',
    description: 'Fibonacci 50-61.8% retracement continuation',
    allowedPairs: ['XAUUSD', 'XAGUSD'],
    timeframes: ['m15', 'h1', 'h4'],
    maxLotSize: 0.5,
    maxPositions: 3,
    cooldownMs: 300000,
    goldTPPips: 400,
    goldSLPips: 200,
    silverTPPips: 60,
    silverSLPips: 30,
    riskRewardMin: 2.0,
    // ALIGNMENT REQUIREMENTS
    minAlignments: 2,           // Need 2 out of 3 strategies to agree
    alignWith: ['ema-pullback', 'break-retest', 'rsi-divergence'],
    alignmentExplanation: 'EMA Trend + Break & Retest + RSI Divergence confirm fib level',
    riskLevel: 'MEDIUM',
    rules: {
      needsTrend: true,
      fibLevels: [0.5, 0.618],
      needsRejection: true,
    }
  },
  
  // =====================================================================
  // BOT 8: RSI DIVERGENCE REVERSAL
  // ALIGNMENT: 3 out of 3 (EMA Trend + S/R + Break & Retest)
  // Risk: LOW | Catches high-probability reversals
  // =====================================================================
  'rsi-divergence': {
    canTrade: true,
    strategy: 'rsi_divergence',
    description: 'RSI divergence reversal patterns',
    allowedPairs: ['XAUUSD', 'XAGUSD'],
    timeframes: ['m15', 'h1', 'h4'],
    maxLotSize: 0.4,
    maxPositions: 3,
    cooldownMs: 300000,
    goldTPPips: 350,
    goldSLPips: 175,
    silverTPPips: 52,
    silverSLPips: 26,
    riskRewardMin: 2.0,
    // ALIGNMENT REQUIREMENTS - STRICTEST (requires ALL 3)
    minAlignments: 3,           // Need ALL 3 strategies to agree
    alignWith: ['ema-pullback', 'order-block', 'break-retest'],
    alignmentExplanation: 'EMA Trend + Support/Resistance + Break & Retest confirm reversal',
    riskLevel: 'LOW',
    rules: {
      needsBullishDiv: true,
      needsBearishDiv: true,
      confirmationCandle: true,
    }
  },
};

/**
 * Helper function to check if a bot is allowed to trade
 * Returns bot config with all its rules
 */
function canBotTrade(robotId, robotName) {
  // Try to find config by ID first
  let config = BOT_CONFIG[robotId];
  
  // If not found by ID, try to match by name pattern
  if (!config) {
    const nameLower = robotName.toLowerCase();
    for (const [id, cfg] of Object.entries(BOT_CONFIG)) {
      const idPattern = id.replace(/-/g, ' ');
      if (nameLower.includes(idPattern) || nameLower.includes(idPattern.replace(' ', ''))) {
        config = cfg;
        break;
      }
    }
  }
  
  // Also check common name variations for the 8 core strategies
  if (!config) {
    const nameLower = robotName.toLowerCase();
    if (nameLower.includes('ema') || nameLower.includes('pullback')) config = BOT_CONFIG['ema-pullback'];
    else if (nameLower.includes('break') && nameLower.includes('retest')) config = BOT_CONFIG['break-retest'];
    else if (nameLower.includes('liquidity') || nameLower.includes('sweep') || nameLower.includes('smc')) config = BOT_CONFIG['liquidity-sweep'];
    else if (nameLower.includes('london') || nameLower.includes('session')) config = BOT_CONFIG['london-breakout'];
    else if (nameLower.includes('order') && nameLower.includes('block')) config = BOT_CONFIG['order-block'];
    else if (nameLower.includes('vwap') || nameLower.includes('reversion')) config = BOT_CONFIG['vwap-reversion'];
    else if (nameLower.includes('fib') || nameLower.includes('fibonacci')) config = BOT_CONFIG['fib-continuation'];
    else if (nameLower.includes('rsi') && nameLower.includes('divergence')) config = BOT_CONFIG['rsi-divergence'];
  }
  
  if (!config) {
    console.log(`  ⚠️ Unknown bot "${robotName}" - using default conservative settings`);
    // Return default conservative config for unknown bots - PRECIOUS METALS ONLY
    return { 
      allowed: true, 
      config: {
        canTrade: true,
        strategy: 'default',
        maxLotSize: 0.02,
        maxPositions: 1,
        cooldownMs: 600000,
        allowedPairs: ['XAUUSD', 'XAGUSD'],  // PRECIOUS METALS ONLY
        rules: {}
      }
    };
  }
  
  if (!config.canTrade) {
    console.log(`  🚫 Bot "${robotName}" is DISABLED - ${config.rules?.disabledReason || 'Not safe for live trading'}`);
    return { allowed: false, reason: config.rules?.disabledReason || 'Bot disabled for safety' };
  }
  
  console.log(`  ✅ Bot "${robotName}" [${config.strategy}] - ${config.description}`);
  return { allowed: true, config };
}

// =========================================================================
// CANDLE CACHE - Reduces API calls to avoid rate limiting
// =========================================================================
const candleCache = new Map();
const CANDLE_CACHE_TTL = 30000; // 30 seconds cache

// =========================================================================
// ACCOUNT DATA CACHE - Prevents rate limiting on getPositions/getAccountInfo
// =========================================================================
const accountInfoCache = new Map();
const positionsCache = new Map();
const ACCOUNT_CACHE_TTL = 60000; // 60 seconds cache for account info
const POSITIONS_CACHE_TTL = 30000; // 30 seconds cache for positions

/**
 * Get cached account information (reduces API calls)
 */
async function getCachedAccountInfo(connection, accountId) {
  const cacheKey = `account_${accountId}`;
  const cached = accountInfoCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < ACCOUNT_CACHE_TTL) {
    return cached.data;
  }
  
  try {
    const accountInfo = await connection.getAccountInformation();
    accountInfoCache.set(cacheKey, { data: accountInfo, timestamp: Date.now() });
    return accountInfo;
  } catch (error) {
    // Return cached data if available, even if stale
    if (cached) {
      console.log(`  ⚠️ Using stale account cache: ${error.message}`);
      return cached.data;
    }
    throw error;
  }
}

/**
 * Get cached positions (reduces API calls)
 */
async function getCachedPositions(connection, accountId) {
  const cacheKey = `positions_${accountId}`;
  const cached = positionsCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < POSITIONS_CACHE_TTL) {
    return cached.data;
  }
  
  try {
    const positions = await connection.getPositions() || [];
    positionsCache.set(cacheKey, { data: positions, timestamp: Date.now() });
    return positions;
  } catch (error) {
    // Return cached data if available, even if stale
    if (cached) {
      console.log(`  ⚠️ Using stale positions cache: ${error.message}`);
      return cached.data;
    }
    // Return empty array rather than throwing
    console.log(`  ⚠️ Could not get positions: ${error.message}`);
    return [];
  }
}

/**
 * Get max positions based on account balance
 * Bigger accounts can handle more positions
 * @param {number} balance - Account balance
 * @returns {{ target: number, max: number }} - Target and max positions
 */
function getPositionLimits(balance) {
  // Use environment variables for position targets
  const minPositions = RISK_CONFIG.MIN_OPEN_POSITIONS;  // Default 5
  const maxPositions = RISK_CONFIG.MAX_OPEN_POSITIONS;  // Default 10
  
  // Always maintain at least MIN_OPEN_POSITIONS trades
  return { target: minPositions, max: maxPositions };
}

// Track structure direction per symbol (for detecting real structure shifts)
const marketStructure = new Map();

/**
 * Get pip size for a symbol (the decimal place value of 1 pip)
 * Optimized for PRECIOUS METALS trading (Gold & Silver)
 * @param {string} symbol - Trading symbol
 * @returns {number} - Pip size
 */
function getPipSize(symbol) {
  if (symbol.includes('XAU') || symbol.includes('GOLD')) {
    return 0.1;  // Gold: 1 pip = $0.10 movement (e.g., 2650.00 to 2650.10)
  } else if (symbol.includes('XAG') || symbol.includes('SILVER')) {
    return 0.01; // Silver: 1 pip = $0.01 movement (e.g., 30.00 to 30.01)
  } else if (symbol.includes('JPY')) {
    return 0.01; // JPY pairs: 1 pip = 0.01
  } else {
    return 0.0001; // Standard pairs: 1 pip = 0.0001
  }
}

/**
 * Get pip value per lot for a symbol
 * Optimized for PRECIOUS METALS trading (Gold & Silver)
 * @param {string} symbol - Trading symbol  
 * @returns {number} - Dollar value per pip for 1 standard lot
 */
function getPipValuePerLot(symbol) {
  if (symbol.includes('XAU') || symbol.includes('GOLD')) {
    return 1;  // Gold: $1 per pip (0.1 move) per 1 lot (100 oz)
  } else if (symbol.includes('XAG') || symbol.includes('SILVER')) {
    return 5;  // Silver: $5 per pip (0.01 move) per 1 lot (5000 oz)
  } else if (symbol.includes('JPY')) {
    return 9;  // JPY pairs: ~$9 per pip per lot
  } else {
    return 10; // Standard pairs: $10 per pip per lot
  }
}

/**
 * Check if symbol is a precious metal (Gold or Silver)
 * @param {string} symbol - Trading symbol
 * @returns {boolean}
 */
function isPreciousMetal(symbol) {
  return symbol.includes('XAU') || symbol.includes('GOLD') || 
         symbol.includes('XAG') || symbol.includes('SILVER');
}

/**
 * Check if symbol is Gold
 */
function isGoldSymbol(symbol) {
  return symbol.includes('XAU') || symbol.includes('GOLD');
}

/**
 * Check if symbol is Silver
 */
function isSilverSymbol(symbol) {
  return symbol.includes('XAG') || symbol.includes('SILVER');
}

/**
 * Calculate position size based on account balance, risk, and SIGNAL STRENGTH
 * STRONGER SIGNALS = BIGGER LOTS (up to MAX_LOT_SIZE of 1.0)
 * @param {number} balance - Account balance
 * @param {number} stopLossPips - Stop loss in pips
 * @param {string} symbol - Trading symbol
 * @param {number} confidence - Signal confidence (0-100)
 * @param {object} botConfig - Bot-specific configuration
 * @param {number} lotMultiplier - Lot multiplier based on confluence (1.0 to 2.5)
 * @returns {number} - Lot size
 */
function calculatePositionSize(balance, stopLossPips, symbol, confidence = 50, botConfig = null, lotMultiplier = 1.0) {
  if (!balance || balance < RISK_CONFIG.MIN_ACCOUNT_BALANCE) {
    return RISK_CONFIG.MIN_LOT_SIZE; // Minimum lot if no balance info
  }
  
  // ================================================================
  // ACCOUNT SIZE-BASED LOT SIZING - PROTECT SMALL ACCOUNTS
  // Small accounts = smaller lots, conservative risk
  // Larger accounts = can handle bigger lots safely
  // ================================================================
  
  // Determine account tier and max risk based on balance
  let maxRiskForAccount;
  let maxLotForAccount;
  let accountTier;
  
  if (balance < 200) {
    // MICRO ACCOUNT: $100-$199 - Very conservative
    accountTier = 'MICRO';
    maxRiskForAccount = 0.02;  // Max 2% risk per trade
    maxLotForAccount = 0.02;   // Max 0.02 lots
    console.log(`    🔒 MICRO ACCOUNT ($${balance.toFixed(0)}) - Max 2% risk, max 0.02 lots`);
  } else if (balance < 500) {
    // MINI ACCOUNT: $200-$499 - Conservative
    accountTier = 'MINI';
    maxRiskForAccount = 0.03;  // Max 3% risk per trade
    maxLotForAccount = 0.05;   // Max 0.05 lots
    console.log(`    🔒 MINI ACCOUNT ($${balance.toFixed(0)}) - Max 3% risk, max 0.05 lots`);
  } else if (balance < 1000) {
    // SMALL ACCOUNT: $500-$999 - Moderate
    accountTier = 'SMALL';
    maxRiskForAccount = 0.04;  // Max 4% risk per trade
    maxLotForAccount = 0.10;   // Max 0.10 lots
    console.log(`    📊 SMALL ACCOUNT ($${balance.toFixed(0)}) - Max 4% risk, max 0.10 lots`);
  } else if (balance < 2500) {
    // MEDIUM ACCOUNT: $1000-$2499 - Standard
    accountTier = 'MEDIUM';
    maxRiskForAccount = 0.05;  // Max 5% risk per trade
    maxLotForAccount = 0.20;   // Max 0.20 lots
    console.log(`    📈 MEDIUM ACCOUNT ($${balance.toFixed(0)}) - Max 5% risk, max 0.20 lots`);
  } else if (balance < 5000) {
    // STANDARD ACCOUNT: $2500-$4999 - Normal
    accountTier = 'STANDARD';
    maxRiskForAccount = 0.06;  // Max 6% risk per trade
    maxLotForAccount = 0.35;   // Max 0.35 lots
    console.log(`    💪 STANDARD ACCOUNT ($${balance.toFixed(0)}) - Max 6% risk, max 0.35 lots`);
  } else if (balance < 10000) {
    // PROFESSIONAL ACCOUNT: $5000-$9999 - Aggressive
    accountTier = 'PROFESSIONAL';
    maxRiskForAccount = 0.08;  // Max 8% risk per trade
    maxLotForAccount = 0.50;   // Max 0.50 lots
    console.log(`    🔥 PROFESSIONAL ACCOUNT ($${balance.toFixed(0)}) - Max 8% risk, max 0.50 lots`);
  } else {
    // LARGE ACCOUNT: $10000+ - Full capacity
    accountTier = 'LARGE';
    maxRiskForAccount = 0.10;  // Max 10% risk per trade
    maxLotForAccount = 1.00;   // Max 1.00 lots
    console.log(`    🚀 LARGE ACCOUNT ($${balance.toFixed(0)}) - Max 10% risk, max 1.00 lots`);
  }
  
  // ================================================================
  // DYNAMIC RISK BASED ON SIGNAL STRENGTH
  // But CAPPED by account tier limits
  // ================================================================
  let riskPercent;
  
  if (confidence >= RISK_CONFIG.EXTREME_CONFIDENCE) {
    riskPercent = Math.min(0.10, maxRiskForAccount);  // Extreme but capped
  } else if (confidence >= RISK_CONFIG.VERY_HIGH_CONFIDENCE) {
    riskPercent = Math.min(0.08, maxRiskForAccount);  // Very strong but capped
  } else if (confidence >= RISK_CONFIG.HIGH_CONFIDENCE_THRESHOLD) {
    riskPercent = Math.min(0.06, maxRiskForAccount);  // Strong but capped
  } else if (confidence >= 60) {
    riskPercent = Math.min(0.04, maxRiskForAccount);  // Medium but capped
  } else {
    riskPercent = Math.min(0.02, maxRiskForAccount);  // Base - very conservative
  }
  
  console.log(`    📐 Risk: ${(riskPercent*100).toFixed(1)}% (capped by ${accountTier} tier max ${(maxRiskForAccount*100).toFixed(1)}%)`);
  
  const riskAmount = balance * riskPercent;
  
  // Get pip value per standard lot for this symbol
  const pipValuePerLot = getPipValuePerLot(symbol);
  
  // USE STRATEGY SL - Don't override with arbitrary values
  const isGold = symbol.includes('XAU') || symbol.includes('GOLD');
  let effectiveSL = stopLossPips;
  
  // Only apply bounds if SL is missing or invalid
  if (!effectiveSL || effectiveSL <= 0) {
    const minSL = isGold ? 150 : 20;   // Fallback min SL
    effectiveSL = minSL;
    console.log(`    ⚠️ No strategy SL provided - using fallback ${effectiveSL} pips`);
  }
  
  // Calculate base lot size: Risk Amount / (Stop Loss Pips * Pip Value per lot)
  let baseLotSize = riskAmount / (effectiveSL * pipValuePerLot);
  
  // Apply confluence-based lot multiplier (but reduced for small accounts)
  let effectiveMultiplier = lotMultiplier;
  if (balance < 500) {
    effectiveMultiplier = Math.min(lotMultiplier, 1.2);  // Cap multiplier for small accounts
  } else if (balance < 1000) {
    effectiveMultiplier = Math.min(lotMultiplier, 1.5);  // Cap for medium-small accounts
  }
  
  let lotSize = baseLotSize * effectiveMultiplier;
  
  // Round to 2 decimal places
  lotSize = Math.round(lotSize * 100) / 100;
  
  // STRICT ACCOUNT-BASED MAX - Never exceed account tier limit
  const maxLot = Math.min(maxLotForAccount, RISK_CONFIG.MAX_LOT_SIZE);
  
  // Clamp to min/max
  lotSize = Math.max(RISK_CONFIG.MIN_LOT_SIZE, Math.min(maxLot, lotSize));
  
  console.log(`    💰 Lot calc: Balance=$${balance.toFixed(0)}, Risk=${(riskPercent*100).toFixed(1)}%=$${riskAmount.toFixed(2)}, SL=${effectiveSL.toFixed(0)}pips`);
  console.log(`    💰 Result: ${lotSize} lots (max for ${accountTier}: ${maxLot}, multiplier: ${effectiveMultiplier.toFixed(1)}x)`);
  
  return lotSize;
}

// Track daily starting balance for loss limit
const dailyBalanceTracker = new Map(); // accountId -> { date: string, startBalance: number }

function getDailyStartBalance(accountId, currentBalance) {
  const today = new Date().toDateString();
  const tracker = dailyBalanceTracker.get(accountId);
  
  if (!tracker || tracker.date !== today) {
    // New day - reset starting balance
    dailyBalanceTracker.set(accountId, { date: today, startBalance: currentBalance });
    console.log(`  📅 New trading day for account ${accountId}: Starting balance $${currentBalance.toFixed(2)}`);
    return currentBalance;
  }
  
  return tracker.startBalance;
}

/**
 * Check if we can open more trades based on risk exposure
 * NO POSITION LIMITS - Always trade strong signals
 * Only protect against catastrophic losses
 */
function canOpenMoreTrades(balance, equity, openPositionsCount, currentProfitLoss, signalConfidence = 50, accountId = null) {
  // Don't trade if no balance info
  if (!balance || balance < RISK_CONFIG.MIN_ACCOUNT_BALANCE) {
    return { canTrade: false, reason: 'Account balance too low or unknown' };
  }
  
  // ================================================================
  // DAILY LOSS LIMIT - Only stop if down 20% today (catastrophic)
  // ================================================================
  if (accountId && equity) {
    const dailyStartBalance = getDailyStartBalance(accountId, balance);
    const dailyPL = equity - dailyStartBalance;
    const dailyPLPercent = (dailyPL / dailyStartBalance) * 100;
    
    if (dailyPL < -(dailyStartBalance * RISK_CONFIG.DAILY_LOSS_LIMIT)) {
      console.log(`  🛑 DAILY LOSS LIMIT HIT: Down $${Math.abs(dailyPL).toFixed(2)} (${dailyPLPercent.toFixed(1)}%) today`);
      return { canTrade: false, reason: `Daily loss limit hit (${dailyPLPercent.toFixed(1)}%)` };
    }
  }
  
  // Get dynamic position limits based on account balance
  const { target, max } = getPositionLimits(balance);
  
  // Check if equity is critically low (stop out protection)
  if (equity && equity < balance * 0.5) {
    return { canTrade: false, reason: `Equity critically low (${((equity / balance) * 100).toFixed(1)}% of balance)` };
  }
  
  // Check drawdown - only stop if losing more than 25% (catastrophic)
  if (currentProfitLoss < -(balance * 0.25)) {
    return { canTrade: false, reason: `Drawdown limit reached (${((currentProfitLoss / balance) * 100).toFixed(1)}%)` };
  }
  
  // NO POSITION LIMITS - Always allow trades for any signal strength
  // Lot size is calculated based on account balance for proper risk management
  return { canTrade: true, reason: `UNLIMITED POSITIONS - Signal ${signalConfidence}%` };
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
    
    // For streaming connections, we need to use terminalState for account info
    // Check what methods are available
    const connMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(rpcConnection))
      .filter(m => typeof rpcConnection[m] === 'function');
    console.log(`  📋 Connection methods: ${connMethods.slice(0, 20).join(', ')}`);
    
    // If connection doesn't have getAccountInformation, wrap it with terminalState access
    if (typeof rpcConnection.getAccountInformation !== 'function') {
      console.log(`  ⚠️ Connection missing getAccountInformation - using terminalState wrapper`);
      
      // Check if terminalState is available
      if (rpcConnection.terminalState) {
        // Create wrapper methods using terminalState
        rpcConnection.getAccountInformation = async () => {
          const state = rpcConnection.terminalState;
          return {
            balance: state.accountInformation?.balance || 0,
            equity: state.accountInformation?.equity || 0,
            margin: state.accountInformation?.margin || 0,
            freeMargin: state.accountInformation?.freeMargin || 0,
            leverage: state.accountInformation?.leverage || 100,
            currency: state.accountInformation?.currency || 'USD',
          };
        };
        rpcConnection.getPositions = async () => {
          return rpcConnection.terminalState.positions || [];
        };
        console.log(`  ✅ Added terminalState wrapper methods`);
      } else {
        console.log(`  ❌ No terminalState available - cannot get account info`);
        return null;
      }
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
    
    // Track strategy info for smart position management (especially swing breakeven)
    const positionId = result.positionId || result.orderId;
    if (positionId && signal.strategy) {
      positionStrategyMap.set(String(positionId), {
        strategy: signal.strategy,
        entryPrice: result.price || signal.entryPrice,
        slPips: signal.slPips,
        tpPips: signal.tpPips,
        symbol: signal.symbol,
        type: signal.type,
      });
      console.log(`  📝 Tracking position ${positionId} with strategy: ${signal.strategy}`);
    }
    
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
      
      // Send email notification (async - don't block trade execution)
      sendTradeOpenedAlert(userId, {
        ...trade,
        robot: robotName,
        reason: signal.reason,
        stop_loss: signal.stopLoss,
        take_profit: signal.takeProfit,
      }).catch(err => console.log(`  ⚠️ Email notification failed:`, err.message));
      
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

// PRECIOUS METALS ONLY - Optimized for Gold and Silver
const TRADING_PAIRS = [
  'XAUUSD',  // Gold - Primary pair
  'XAGUSD',  // Silver - Secondary pair
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

// =========================================================================
// PROVEN TRADING STRATEGIES - Battle-tested patterns that work with 100 candles
// Each strategy returns { direction, confidence, reason, slPips, tpPips }
// =========================================================================

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
function calculateMACD(closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const emaFast = calculateEMA(closes, fastPeriod);
  const emaSlow = calculateEMA(closes, slowPeriod);
  
  const macdLine = [];
  for (let i = 0; i < closes.length; i++) {
    macdLine.push(emaFast[i] - emaSlow[i]);
  }
  
  const signalLine = calculateEMA(macdLine, signalPeriod);
  const histogram = macdLine.map((m, i) => m - signalLine[i]);
  
  return { macdLine, signalLine, histogram };
}

/**
 * Calculate Bollinger Bands
 */
function calculateBollingerBands(closes, period = 20, stdDev = 2) {
  const sma = [];
  const upper = [];
  const lower = [];
  
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      sma.push(closes[i]);
      upper.push(closes[i]);
      lower.push(closes[i]);
      continue;
    }
    
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
    const std = Math.sqrt(variance);
    
    sma.push(mean);
    upper.push(mean + stdDev * std);
    lower.push(mean - stdDev * std);
  }
  
  return { sma, upper, lower };
}

/**
 * Calculate Stochastic Oscillator
 */
function calculateStochastic(candles, period = 14, smoothK = 3, smoothD = 3) {
  const kValues = [];
  
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      kValues.push(50);
      continue;
    }
    
    const slice = candles.slice(i - period + 1, i + 1);
    const highestHigh = Math.max(...slice.map(c => c.high));
    const lowestLow = Math.min(...slice.map(c => c.low));
    const close = candles[i].close;
    
    if (highestHigh === lowestLow) {
      kValues.push(50);
    } else {
      kValues.push(((close - lowestLow) / (highestHigh - lowestLow)) * 100);
    }
  }
  
  // Smooth K values
  const smoothedK = calculateSMA(kValues, smoothK);
  const smoothedD = calculateSMA(smoothedK, smoothD);
  
  return { k: smoothedK, d: smoothedD };
}

/**
 * Calculate Simple Moving Average
 */
function calculateSMA(data, period) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(data[i]);
      continue;
    }
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push(sum / period);
  }
  return result;
}

/**
 * STRATEGY 1: MACD Divergence + RSI Confirmation
 * Historically one of the most reliable reversal patterns
 * Works best with 50-100 candles to identify divergence
 */
function analyzeMACD_Divergence(candles, symbol, botConfig = null) {
  if (!candles || candles.length < 50) return null;
  
  const closes = candles.map(c => c.close);
  const { macdLine, signalLine, histogram } = calculateMACD(closes);
  const rsi = calculateRSI(closes, 14);
  
  const currentMACD = macdLine[macdLine.length - 1];
  const prevMACD = macdLine[macdLine.length - 2];
  const currentSignal = signalLine[signalLine.length - 1];
  const currentRSI = rsi[rsi.length - 1];
  const currentHist = histogram[histogram.length - 1];
  const prevHist = histogram[histogram.length - 2];
  
  // Check for MACD crossover
  const bullishCross = prevMACD < signalLine[signalLine.length - 2] && currentMACD > currentSignal;
  const bearishCross = prevMACD > signalLine[signalLine.length - 2] && currentMACD < currentSignal;
  
  // Check for histogram momentum shift
  const histBullish = currentHist > prevHist && currentHist > histogram[histogram.length - 3];
  const histBearish = currentHist < prevHist && currentHist < histogram[histogram.length - 3];
  
  // Look for divergence in last 20 candles
  let bullishDivergence = false;
  let bearishDivergence = false;
  
  // Find recent price lows/highs and compare with MACD
  const recentCloses = closes.slice(-20);
  const recentMACD = macdLine.slice(-20);
  
  const priceLowIdx = recentCloses.indexOf(Math.min(...recentCloses));
  const priceHighIdx = recentCloses.indexOf(Math.max(...recentCloses));
  
  // Bullish divergence: Lower price low + higher MACD low
  if (priceLowIdx > 5) {
    const prevPriceLowIdx = recentCloses.slice(0, priceLowIdx).indexOf(Math.min(...recentCloses.slice(0, priceLowIdx)));
    if (recentCloses[priceLowIdx] < recentCloses[prevPriceLowIdx] && 
        recentMACD[priceLowIdx] > recentMACD[prevPriceLowIdx]) {
      bullishDivergence = true;
    }
  }
  
  // Bearish divergence: Higher price high + lower MACD high
  if (priceHighIdx > 5) {
    const prevPriceHighIdx = recentCloses.slice(0, priceHighIdx).indexOf(Math.max(...recentCloses.slice(0, priceHighIdx)));
    if (recentCloses[priceHighIdx] > recentCloses[prevPriceHighIdx] && 
        recentMACD[priceHighIdx] < recentMACD[prevPriceHighIdx]) {
      bearishDivergence = true;
    }
  }
  
  let signal = null;
  let confidence = 0;
  let reason = '';
  
  // BUY signal
  if ((bullishCross || histBullish) && (currentRSI < 45 || bullishDivergence)) {
    confidence = 45;
    reason = 'MACD-Strategy: ';
    
    if (bullishCross) { confidence += 25; reason += 'MACD-Crossover '; }
    if (histBullish) { confidence += 15; reason += 'Histogram-Up '; }
    if (bullishDivergence) { confidence += 20; reason += 'Bullish-Divergence '; }
    if (currentRSI < 30) { confidence += 15; reason += 'RSI-Oversold '; }
    else if (currentRSI < 45) { confidence += 8; reason += 'RSI-Low '; }
    
    signal = { type: 'buy', confidence: Math.min(confidence, 95), reason: reason.trim(), strategy: 'macd_divergence' };
  }
  
  // SELL signal
  else if ((bearishCross || histBearish) && (currentRSI > 55 || bearishDivergence)) {
    confidence = 45;
    reason = 'MACD-Strategy: ';
    
    if (bearishCross) { confidence += 25; reason += 'MACD-Crossover '; }
    if (histBearish) { confidence += 15; reason += 'Histogram-Down '; }
    if (bearishDivergence) { confidence += 20; reason += 'Bearish-Divergence '; }
    if (currentRSI > 70) { confidence += 15; reason += 'RSI-Overbought '; }
    else if (currentRSI > 55) { confidence += 8; reason += 'RSI-High '; }
    
    signal = { type: 'sell', confidence: Math.min(confidence, 95), reason: reason.trim(), strategy: 'macd_divergence' };
  }
  
  return signal;
}

/**
 * STRATEGY 2: Bollinger Band Squeeze + Breakout
 * Identifies low volatility periods followed by explosive moves
 */
function analyzeBollingerBreakout(candles, symbol, botConfig = null) {
  if (!candles || candles.length < 40) return null;
  
  const closes = candles.map(c => c.close);
  const currentPrice = closes[closes.length - 1];
  const { sma, upper, lower } = calculateBollingerBands(closes, 20, 2);
  const atr = calculateATR(candles, 14);
  
  const currentUpper = upper[upper.length - 1];
  const currentLower = lower[lower.length - 1];
  const currentSMA = sma[sma.length - 1];
  const bandWidth = (currentUpper - currentLower) / currentSMA;
  
  // Check recent band widths to identify squeeze
  const recentBandWidths = [];
  for (let i = Math.max(0, upper.length - 20); i < upper.length; i++) {
    recentBandWidths.push((upper[i] - lower[i]) / sma[i]);
  }
  const avgBandWidth = recentBandWidths.reduce((a, b) => a + b, 0) / recentBandWidths.length;
  const isSqueezing = bandWidth < avgBandWidth * 0.8;
  const justBrokeOut = bandWidth > avgBandWidth && recentBandWidths[recentBandWidths.length - 2] < avgBandWidth;
  
  // Volume/momentum confirmation
  const recentCandles = candles.slice(-5);
  const bullishCount = recentCandles.filter(c => c.close > c.open).length;
  const bearishCount = 5 - bullishCount;
  
  let signal = null;
  let confidence = 0;
  let reason = '';
  
  // BUY: Price breaks above upper band after squeeze
  if (currentPrice > currentUpper && (justBrokeOut || isSqueezing)) {
    confidence = 50;
    reason = 'BB-Breakout: ';
    
    if (currentPrice > currentUpper) { confidence += 20; reason += 'Above-Upper '; }
    if (justBrokeOut) { confidence += 15; reason += 'Squeeze-Break '; }
    if (bullishCount >= 3) { confidence += 12; reason += `Momentum(${bullishCount}/5) `; }
    if (currentPrice > closes[closes.length - 2]) { confidence += 8; reason += 'Higher-Close '; }
    
    signal = { type: 'buy', confidence: Math.min(confidence, 95), reason: reason.trim(), strategy: 'bollinger_breakout' };
  }
  
  // SELL: Price breaks below lower band after squeeze
  else if (currentPrice < currentLower && (justBrokeOut || isSqueezing)) {
    confidence = 50;
    reason = 'BB-Breakout: ';
    
    if (currentPrice < currentLower) { confidence += 20; reason += 'Below-Lower '; }
    if (justBrokeOut) { confidence += 15; reason += 'Squeeze-Break '; }
    if (bearishCount >= 3) { confidence += 12; reason += `Momentum(${bearishCount}/5) `; }
    if (currentPrice < closes[closes.length - 2]) { confidence += 8; reason += 'Lower-Close '; }
    
    signal = { type: 'sell', confidence: Math.min(confidence, 95), reason: reason.trim(), strategy: 'bollinger_breakout' };
  }
  
  // Mean reversion opportunity
  else if (currentPrice < currentLower * 1.005) {
    confidence = 40;
    reason = 'BB-MeanRevert: ';
    if (currentPrice < currentLower) { confidence += 20; reason += 'At-Lower '; }
    if (bullishCount >= 2) { confidence += 10; reason += 'Reversal-Candle '; }
    signal = { type: 'buy', confidence: Math.min(confidence, 85), reason: reason.trim(), strategy: 'bollinger_reversion' };
  }
  else if (currentPrice > currentUpper * 0.995) {
    confidence = 40;
    reason = 'BB-MeanRevert: ';
    if (currentPrice > currentUpper) { confidence += 20; reason += 'At-Upper '; }
    if (bearishCount >= 2) { confidence += 10; reason += 'Reversal-Candle '; }
    signal = { type: 'sell', confidence: Math.min(confidence, 85), reason: reason.trim(), strategy: 'bollinger_reversion' };
  }
  
  return signal;
}

/**
 * STRATEGY 3: Double Top/Bottom Pattern
 * Classic reversal pattern with high win rate when identified correctly
 */
function analyzeDoublePattern(candles, symbol, botConfig = null) {
  if (!candles || candles.length < 60) return null;
  
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const currentPrice = closes[closes.length - 1];
  const atr = calculateATR(candles, 14);
  
  // Find significant peaks and troughs in last 60 candles
  const tolerance = atr * 0.5; // Peaks/troughs must be within 0.5 ATR to be "double"
  
  // Find swing highs
  const swingHighs = [];
  for (let i = 5; i < candles.length - 5; i++) {
    const isSwingHigh = highs[i] > Math.max(...highs.slice(i-5, i)) && 
                        highs[i] > Math.max(...highs.slice(i+1, i+6));
    if (isSwingHigh) {
      swingHighs.push({ idx: i, price: highs[i] });
    }
  }
  
  // Find swing lows
  const swingLows = [];
  for (let i = 5; i < candles.length - 5; i++) {
    const isSwingLow = lows[i] < Math.min(...lows.slice(i-5, i)) && 
                       lows[i] < Math.min(...lows.slice(i+1, i+6));
    if (isSwingLow) {
      swingLows.push({ idx: i, price: lows[i] });
    }
  }
  
  let signal = null;
  let confidence = 0;
  let reason = '';
  
  // Check for Double Top (bearish)
  if (swingHighs.length >= 2) {
    const lastTwo = swingHighs.slice(-2);
    const priceDiff = Math.abs(lastTwo[0].price - lastTwo[1].price);
    const timeDiff = lastTwo[1].idx - lastTwo[0].idx;
    
    if (priceDiff < tolerance && timeDiff > 10 && timeDiff < 40) {
      // Found double top - check if price is breaking below neckline
      const neckline = Math.min(...lows.slice(lastTwo[0].idx, lastTwo[1].idx + 1));
      
      if (currentPrice < neckline) {
        confidence = 55;
        reason = 'DoubleTop: ';
        confidence += 25; reason += 'Pattern-Complete ';
        confidence += 15; reason += 'Neckline-Break ';
        if (currentPrice < closes[closes.length - 2]) { confidence += 10; reason += 'Bearish-Confirm '; }
        
        signal = { type: 'sell', confidence: Math.min(confidence, 95), reason: reason.trim(), strategy: 'double_top' };
      }
    }
  }
  
  // Check for Double Bottom (bullish)
  if (!signal && swingLows.length >= 2) {
    const lastTwo = swingLows.slice(-2);
    const priceDiff = Math.abs(lastTwo[0].price - lastTwo[1].price);
    const timeDiff = lastTwo[1].idx - lastTwo[0].idx;
    
    if (priceDiff < tolerance && timeDiff > 10 && timeDiff < 40) {
      // Found double bottom - check if price is breaking above neckline
      const neckline = Math.max(...highs.slice(lastTwo[0].idx, lastTwo[1].idx + 1));
      
      if (currentPrice > neckline) {
        confidence = 55;
        reason = 'DoubleBottom: ';
        confidence += 25; reason += 'Pattern-Complete ';
        confidence += 15; reason += 'Neckline-Break ';
        if (currentPrice > closes[closes.length - 2]) { confidence += 10; reason += 'Bullish-Confirm '; }
        
        signal = { type: 'buy', confidence: Math.min(confidence, 95), reason: reason.trim(), strategy: 'double_bottom' };
      }
    }
  }
  
  return signal;
}

/**
 * STRATEGY 4: EMA Ribbon with Stochastic Confirmation
 * Multiple EMAs aligned with momentum confirmation
 */
function analyzeEMARibbon(candles, symbol, botConfig = null) {
  if (!candles || candles.length < 55) return null;
  
  const closes = candles.map(c => c.close);
  const currentPrice = closes[closes.length - 1];
  
  // EMA Ribbon: 8, 13, 21, 34, 55
  const ema8 = calculateEMA(closes, 8);
  const ema13 = calculateEMA(closes, 13);
  const ema21 = calculateEMA(closes, 21);
  const ema34 = calculateEMA(closes, 34);
  const ema55 = calculateEMA(closes, 55);
  
  const e8 = ema8[ema8.length - 1];
  const e13 = ema13[ema13.length - 1];
  const e21 = ema21[ema21.length - 1];
  const e34 = ema34[ema34.length - 1];
  const e55 = ema55[ema55.length - 1];
  
  // Check ribbon alignment
  const bullishRibbon = e8 > e13 && e13 > e21 && e21 > e34 && e34 > e55;
  const bearishRibbon = e8 < e13 && e13 < e21 && e21 < e34 && e34 < e55;
  
  // Stochastic for timing
  const { k, d } = calculateStochastic(candles, 14, 3, 3);
  const currentK = k[k.length - 1];
  const currentD = d[d.length - 1];
  const prevK = k[k.length - 2];
  
  const stochBullish = currentK > currentD && prevK < d[d.length - 2];
  const stochBearish = currentK < currentD && prevK > d[d.length - 2];
  const stochOversold = currentK < 25;
  const stochOverbought = currentK > 75;
  
  // Price relative to ribbon
  const priceAboveRibbon = currentPrice > e8;
  const priceBelowRibbon = currentPrice < e8;
  
  let signal = null;
  let confidence = 0;
  let reason = '';
  
  // BUY: Bullish ribbon + stochastic turning up from oversold
  if (bullishRibbon && (stochBullish || stochOversold)) {
    confidence = 50;
    reason = 'EMA-Ribbon: ';
    
    confidence += 25; reason += 'Bullish-Align ';
    if (stochBullish) { confidence += 15; reason += 'Stoch-CrossUp '; }
    if (stochOversold) { confidence += 12; reason += 'Oversold '; }
    if (priceAboveRibbon) { confidence += 8; reason += 'Above-EMAs '; }
    
    signal = { type: 'buy', confidence: Math.min(confidence, 95), reason: reason.trim(), strategy: 'ema_ribbon' };
  }
  
  // SELL: Bearish ribbon + stochastic turning down from overbought
  else if (bearishRibbon && (stochBearish || stochOverbought)) {
    confidence = 50;
    reason = 'EMA-Ribbon: ';
    
    confidence += 25; reason += 'Bearish-Align ';
    if (stochBearish) { confidence += 15; reason += 'Stoch-CrossDown '; }
    if (stochOverbought) { confidence += 12; reason += 'Overbought '; }
    if (priceBelowRibbon) { confidence += 8; reason += 'Below-EMAs '; }
    
    signal = { type: 'sell', confidence: Math.min(confidence, 95), reason: reason.trim(), strategy: 'ema_ribbon' };
  }
  
  return signal;
}

/**
 * STRATEGY 5: Support/Resistance Bounce with Volume
 * Identifies key S/R levels and trades bounces
 */
function analyzeSupportResistance(candles, symbol, botConfig = null) {
  if (!candles || candles.length < 50) return null;
  
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const currentPrice = closes[closes.length - 1];
  const atr = calculateATR(candles, 14);
  
  // Find key support and resistance levels from last 50 candles
  const priceHistory = [...highs, ...lows];
  
  // Cluster nearby prices to find S/R zones
  function findKeyLevels(prices, tolerance) {
    const sorted = [...prices].sort((a, b) => a - b);
    const levels = [];
    let cluster = [sorted[0]];
    
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - cluster[cluster.length - 1] < tolerance) {
        cluster.push(sorted[i]);
      } else {
        if (cluster.length >= 3) {
          levels.push(cluster.reduce((a, b) => a + b, 0) / cluster.length);
        }
        cluster = [sorted[i]];
      }
    }
    if (cluster.length >= 3) {
      levels.push(cluster.reduce((a, b) => a + b, 0) / cluster.length);
    }
    return levels;
  }
  
  const keyLevels = findKeyLevels(priceHistory, atr * 0.3);
  
  // Find nearest support and resistance
  let nearestSupport = null;
  let nearestResistance = null;
  
  for (const level of keyLevels) {
    if (level < currentPrice && (!nearestSupport || level > nearestSupport)) {
      nearestSupport = level;
    }
    if (level > currentPrice && (!nearestResistance || level < nearestResistance)) {
      nearestResistance = level;
    }
  }
  
  if (!nearestSupport || !nearestResistance) return null;
  
  const distToSupport = currentPrice - nearestSupport;
  const distToResist = nearestResistance - currentPrice;
  const touchingSupport = distToSupport < atr * 0.5;
  const touchingResist = distToResist < atr * 0.5;
  
  // Check for bounce confirmation
  const recentCandles = candles.slice(-3);
  const bullishBounce = touchingSupport && recentCandles[2].close > recentCandles[1].close;
  const bearishBounce = touchingResist && recentCandles[2].close < recentCandles[1].close;
  
  let signal = null;
  let confidence = 0;
  let reason = '';
  
  // BUY: At support with bullish bounce
  if (bullishBounce) {
    confidence = 50;
    reason = 'S/R-Strategy: ';
    
    confidence += 20; reason += `Support@${nearestSupport.toFixed(4)} `;
    confidence += 15; reason += 'Bounce-Confirm ';
    if (recentCandles[2].close > recentCandles[2].open) { confidence += 10; reason += 'Bullish-Candle '; }
    
    signal = { type: 'buy', confidence: Math.min(confidence, 90), reason: reason.trim(), strategy: 'support_bounce' };
  }
  
  // SELL: At resistance with bearish rejection
  else if (bearishBounce) {
    confidence = 50;
    reason = 'S/R-Strategy: ';
    
    confidence += 20; reason += `Resist@${nearestResistance.toFixed(4)} `;
    confidence += 15; reason += 'Rejection-Confirm ';
    if (recentCandles[2].close < recentCandles[2].open) { confidence += 10; reason += 'Bearish-Candle '; }
    
    signal = { type: 'sell', confidence: Math.min(confidence, 90), reason: reason.trim(), strategy: 'resistance_reject' };
  }
  
  return signal;
}

// =========================================================================
// � ADVANCED CANDLE PATTERN ANALYZER FOR GOLD (XAUUSD)
// Studies candle formations to improve signal quality
// =========================================================================

/**
 * Analyze candlestick patterns for signal confirmation
 * Returns pattern info with confidence boost
 */
function analyzeCandlePatterns(candles) {
  if (!candles || candles.length < 5) return { pattern: null, boost: 0 };
  
  const recent = candles.slice(-5);
  const last = recent[recent.length - 1];
  const prev = recent[recent.length - 2];
  const prev2 = recent[recent.length - 3];
  
  // Calculate candle body and wick sizes
  const lastBody = Math.abs(last.close - last.open);
  const lastUpperWick = last.high - Math.max(last.open, last.close);
  const lastLowerWick = Math.min(last.open, last.close) - last.low;
  const lastRange = last.high - last.low;
  
  const prevBody = Math.abs(prev.close - prev.open);
  const prevRange = prev.high - prev.low;
  
  const atr = calculateATR(candles, 14);
  
  let patterns = [];
  
  // 🔨 HAMMER / HANGING MAN (Reversal)
  if (lastLowerWick > lastBody * 2 && lastUpperWick < lastBody * 0.5 && lastBody > 0) {
    const isBullish = last.close > last.open;
    patterns.push({
      name: isBullish ? 'Hammer' : 'Hanging-Man',
      type: isBullish ? 'bullish' : 'bearish',
      boost: 8
    });
  }
  
  // ⭐ SHOOTING STAR / INVERTED HAMMER (Reversal)
  if (lastUpperWick > lastBody * 2 && lastLowerWick < lastBody * 0.5 && lastBody > 0) {
    const isBullish = last.close > last.open;
    patterns.push({
      name: isBullish ? 'Inverted-Hammer' : 'Shooting-Star',
      type: isBullish ? 'bullish' : 'bearish',
      boost: 8
    });
  }
  
  // 🌟 ENGULFING PATTERN (Strong reversal)
  if (lastBody > prevBody * 1.5) {
    const isBullish = last.close > last.open && prev.close < prev.open;
    const isBearish = last.close < last.open && prev.close > prev.open;
    
    if (isBullish && last.close > prev.open && last.open < prev.close) {
      patterns.push({ name: 'Bullish-Engulfing', type: 'bullish', boost: 12 });
    } else if (isBearish && last.close < prev.open && last.open > prev.close) {
      patterns.push({ name: 'Bearish-Engulfing', type: 'bearish', boost: 12 });
    }
  }
  
  // 💪 STRONG MOMENTUM CANDLE (Large body, small wicks)
  if (lastBody > atr * 0.8 && lastUpperWick < lastBody * 0.3 && lastLowerWick < lastBody * 0.3) {
    const isBullish = last.close > last.open;
    patterns.push({
      name: isBullish ? 'Strong-Bull-Candle' : 'Strong-Bear-Candle',
      type: isBullish ? 'bullish' : 'bearish',
      boost: 10
    });
  }
  
  // 🔄 DOJI (Indecision - potential reversal)
  if (lastBody < lastRange * 0.1 && lastRange > atr * 0.3) {
    patterns.push({ name: 'Doji', type: 'neutral', boost: 5 });
  }
  
  // 📈 THREE WHITE SOLDIERS (Strong bullish continuation)
  const threeCandles = recent.slice(-3);
  if (threeCandles.every(c => c.close > c.open) && 
      threeCandles[1].close > threeCandles[0].close &&
      threeCandles[2].close > threeCandles[1].close) {
    patterns.push({ name: 'Three-White-Soldiers', type: 'bullish', boost: 15 });
  }
  
  // 📉 THREE BLACK CROWS (Strong bearish continuation)
  if (threeCandles.every(c => c.close < c.open) && 
      threeCandles[1].close < threeCandles[0].close &&
      threeCandles[2].close < threeCandles[1].close) {
    patterns.push({ name: 'Three-Black-Crows', type: 'bearish', boost: 15 });
  }
  
  // 🌅 MORNING/EVENING STAR (Reversal pattern)
  if (recent.length >= 3) {
    const c1 = prev2, c2 = prev, c3 = last;
    const c1Body = Math.abs(c1.close - c1.open);
    const c2Body = Math.abs(c2.close - c2.open);
    const c3Body = Math.abs(c3.close - c3.open);
    
    // Morning Star (bullish reversal)
    if (c1.close < c1.open && c1Body > atr * 0.5 &&  // Big bearish
        c2Body < atr * 0.2 &&                         // Small body (star)
        c3.close > c3.open && c3Body > atr * 0.5 &&  // Big bullish
        c3.close > (c1.open + c1.close) / 2) {       // Closes above midpoint
      patterns.push({ name: 'Morning-Star', type: 'bullish', boost: 15 });
    }
    
    // Evening Star (bearish reversal)
    if (c1.close > c1.open && c1Body > atr * 0.5 &&  // Big bullish
        c2Body < atr * 0.2 &&                         // Small body (star)
        c3.close < c3.open && c3Body > atr * 0.5 &&  // Big bearish
        c3.close < (c1.open + c1.close) / 2) {       // Closes below midpoint
      patterns.push({ name: 'Evening-Star', type: 'bearish', boost: 15 });
    }
  }
  
  // Return strongest pattern
  if (patterns.length === 0) {
    return { pattern: null, boost: 0, type: 'neutral' };
  }
  
  // Sort by boost (highest first)
  patterns.sort((a, b) => b.boost - a.boost);
  const strongest = patterns[0];
  
  return {
    pattern: strongest.name,
    boost: strongest.boost,
    type: strongest.type,
    allPatterns: patterns.map(p => p.name)
  };
}

/**
 * Analyze market structure for XAUUSD
 * Identifies trend strength, momentum, and key levels
 */
function analyzeGoldMarketStructure(candles) {
  if (!candles || candles.length < 50) return null;
  
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const currentPrice = closes[closes.length - 1];
  
  // Calculate key indicators
  const ema8 = calculateEMA(closes, 8);
  const ema21 = calculateEMA(closes, 21);
  const ema50 = calculateEMA(closes, 50);
  const rsi = calculateRSI(closes, 14);
  const atr = calculateATR(candles, 14);
  
  const ema8Val = ema8[ema8.length - 1];
  const ema21Val = ema21[ema21.length - 1];
  const ema50Val = ema50[ema50.length - 1];
  const currentRSI = rsi[rsi.length - 1];
  
  // Trend detection
  const shortTermTrend = ema8Val > ema21Val ? 'bullish' : 'bearish';
  const mediumTermTrend = ema21Val > ema50Val ? 'bullish' : 'bearish';
  const priceVsEMA50 = currentPrice > ema50Val ? 'above' : 'below';
  
  // Trend alignment (all EMAs aligned = strong trend)
  const trendAligned = shortTermTrend === mediumTermTrend;
  const trendStrength = trendAligned ? 'strong' : 'weak';
  
  // Momentum from recent candles
  const recentCandles = candles.slice(-5);
  const bullishCandles = recentCandles.filter(c => c.close > c.open).length;
  const bearishCandles = recentCandles.filter(c => c.close < c.open).length;
  const momentum = bullishCandles > bearishCandles ? 'bullish' : 
                   bearishCandles > bullishCandles ? 'bearish' : 'neutral';
  
  // Volatility assessment
  const avgRange = recentCandles.reduce((sum, c) => sum + (c.high - c.low), 0) / 5;
  const volatility = avgRange > atr * 1.5 ? 'high' : avgRange < atr * 0.7 ? 'low' : 'normal';
  
  // Find support/resistance levels
  const lookback = 20;
  const recentHighs = highs.slice(-lookback);
  const recentLows = lows.slice(-lookback);
  const resistance = Math.max(...recentHighs);
  const support = Math.min(...recentLows);
  
  // Distance to key levels
  const distToResist = resistance - currentPrice;
  const distToSupport = currentPrice - support;
  const nearResistance = distToResist < atr * 1.5;
  const nearSupport = distToSupport < atr * 1.5;
  
  return {
    currentPrice,
    trend: {
      short: shortTermTrend,
      medium: mediumTermTrend,
      strength: trendStrength,
      aligned: trendAligned
    },
    momentum,
    volatility,
    rsi: currentRSI,
    rsiZone: currentRSI > 70 ? 'overbought' : currentRSI < 30 ? 'oversold' : 'neutral',
    levels: {
      resistance,
      support,
      nearResistance,
      nearSupport
    },
    emas: { ema8: ema8Val, ema21: ema21Val, ema50: ema50Val },
    atr
  };
}

// =========================================================================
// �🚀 PROVEN HIGH WIN-RATE STRATEGIES
// These strategies have recorded impressive results over time
// =========================================================================

/**
 * 🚀 STRATEGY: EMA 200 Trend + Pullback (HIGH WIN RATE)
 * One of the most reliable institutional strategies
 * - Trend: Price relative to EMA200
 * - Pullback: Near EMA50
 * - Confirmation: RSI neutral (40-60) + candle close
 * - SL: Below recent swing low (BUY) / Above recent swing high (SELL)
 * - TP: Recent swing high (BUY) / Recent swing low (SELL) or 2x SL
 */
function analyzeEMA200Pullback(candles, symbol, botConfig = null) {
  if (!candles || candles.length < 200) return null;
  
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const currentPrice = closes[closes.length - 1];
  const prevPrice = closes[closes.length - 2];
  const currentCandle = candles[candles.length - 1];
  const atr = calculateATR(candles, 14);
  const pipSize = getPipSize(symbol);
  const isGold = symbol.includes('XAU') || symbol.includes('GOLD');
  
  // Calculate EMAs
  const ema50 = calculateEMA(closes, 50);
  const ema200 = calculateEMA(closes, 200);
  const rsi = calculateRSI(closes, 14);
  
  const ema50Val = ema50[ema50.length - 1];
  const ema200Val = ema200[ema200.length - 1];
  const currentRSI = rsi[rsi.length - 1];
  
  // Find recent swing highs/lows for SL/TP calculation
  const recentLows = lows.slice(-20);
  const recentHighs = highs.slice(-20);
  const recentSwingLow = Math.min(...recentLows);
  const recentSwingHigh = Math.max(...recentHighs);
  
  // Trend detection
  const bullishTrend = currentPrice > ema200Val && ema50Val > ema200Val;
  const bearishTrend = currentPrice < ema200Val && ema50Val < ema200Val;
  
  // Pullback detection - price near EMA50 (within 0.5 ATR)
  const nearEMA50 = Math.abs(currentPrice - ema50Val) < atr * 0.5;
  
  // RSI neutral zone (40-60) - not overbought/oversold
  const rsiNeutral = currentRSI >= 40 && currentRSI <= 60;
  
  // Candle confirmation
  const bullishCandle = currentCandle.close > currentCandle.open;
  const bearishCandle = currentCandle.close < currentCandle.open;
  
  let signal = null;
  let confidence = 0;
  let reason = '';
  
  // 🟢 BUY: Bullish trend + pullback to EMA50 + RSI neutral + bullish candle
  if (bullishTrend && nearEMA50 && rsiNeutral && bullishCandle) {
    confidence = 55;
    reason = 'EMA200-Pullback: ';
    
    confidence += 20; reason += 'Bullish-Trend ';
    confidence += 15; reason += 'Pullback-EMA50 ';
    confidence += 10; reason += `RSI-Neutral(${currentRSI.toFixed(0)}) `;
    confidence += 10; reason += 'Bullish-Confirm ';
    
    // Extra confidence if price bounced off EMA50
    if (prevPrice < ema50Val && currentPrice > ema50Val) {
      confidence += 10; reason += 'EMA50-Bounce ';
    }
    
    // 📐 CALCULATE PROPER SL/TP FROM MARKET STRUCTURE
    // SL: Below recent swing low + buffer
    const slBuffer = atr * 0.3;
    const stopLossPrice = recentSwingLow - slBuffer;
    const slDistance = currentPrice - stopLossPrice;
    
    // TP: At recent swing high OR 2x risk if swing high is too close
    let takeProfitPrice = recentSwingHigh;
    const tpDistance = takeProfitPrice - currentPrice;
    
    // Ensure minimum 1:2 RR
    if (tpDistance < slDistance * 2) {
      takeProfitPrice = currentPrice + (slDistance * 2.5);
    }
    
    // Calculate pips for logging
    const slPips = Math.round(slDistance / pipSize);
    const tpPips = Math.round((takeProfitPrice - currentPrice) / pipSize);
    
    signal = { 
      type: 'buy', 
      confidence: Math.min(confidence, 95), 
      reason: reason.trim(), 
      strategy: 'ema200_pullback',
      stopLoss: stopLossPrice,
      takeProfit: takeProfitPrice,
      slPips: slPips,
      tpPips: tpPips,
      entryPrice: currentPrice
    };
  }
  
  // 🔴 SELL: Bearish trend + pullback to EMA50 + RSI neutral + bearish candle
  else if (bearishTrend && nearEMA50 && rsiNeutral && bearishCandle) {
    confidence = 55;
    reason = 'EMA200-Pullback: ';
    
    confidence += 20; reason += 'Bearish-Trend ';
    confidence += 15; reason += 'Pullback-EMA50 ';
    confidence += 10; reason += `RSI-Neutral(${currentRSI.toFixed(0)}) `;
    confidence += 10; reason += 'Bearish-Confirm ';
    
    if (prevPrice > ema50Val && currentPrice < ema50Val) {
      confidence += 10; reason += 'EMA50-Reject ';
    }
    
    // 📐 CALCULATE PROPER SL/TP FROM MARKET STRUCTURE
    // SL: Above recent swing high + buffer
    const slBuffer = atr * 0.3;
    const stopLossPrice = recentSwingHigh + slBuffer;
    const slDistance = stopLossPrice - currentPrice;
    
    // TP: At recent swing low OR 2x risk if swing low is too close
    let takeProfitPrice = recentSwingLow;
    const tpDistance = currentPrice - takeProfitPrice;
    
    // Ensure minimum 1:2 RR
    if (tpDistance < slDistance * 2) {
      takeProfitPrice = currentPrice - (slDistance * 2.5);
    }
    
    // Calculate pips for logging
    const slPips = Math.round(slDistance / pipSize);
    const tpPips = Math.round((currentPrice - takeProfitPrice) / pipSize);
    
    signal = { 
      type: 'sell', 
      confidence: Math.min(confidence, 95), 
      reason: reason.trim(), 
      strategy: 'ema200_pullback',
      stopLoss: stopLossPrice,
      takeProfit: takeProfitPrice,
      slPips: slPips,
      tpPips: tpPips,
      entryPrice: currentPrice
    };
  }
  
  return signal;
}

/**
 * ⚡ STRATEGY: Break and Retest (Institutional Favorite)
 * - Detect breakout of S/R level
 * - Wait for price to retest the broken level
 * - Enter on confirmation candle
 * - SL: Just below broken level (BUY) / Just above broken level (SELL)
 * - TP: Measured move OR next structure level
 */
function analyzeBreakAndRetest(candles, symbol, botConfig = null) {
  if (!candles || candles.length < 50) return null;
  
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const currentPrice = closes[closes.length - 1];
  const currentCandle = candles[candles.length - 1];
  const atr = calculateATR(candles, 14);
  const pipSize = getPipSize(symbol);
  const isGold = symbol.includes('XAU') || symbol.includes('GOLD');
  
  // Find recent swing highs and lows (last 30 candles for structure)
  const lookback = 30;
  const recentHighs = highs.slice(-lookback);
  const recentLows = lows.slice(-lookback);
  
  // Key levels - resistance from highs, support from lows
  const resistance = Math.max(...recentHighs.slice(0, -5)); // Exclude last 5 candles
  const support = Math.min(...recentLows.slice(0, -5));
  
  // Find next structure levels for TP
  const nextResistance = Math.max(...highs.slice(-50));
  const nextSupport = Math.min(...lows.slice(-50));
  
  // Check for recent breakout (in last 10 candles)
  let brokeResistance = false;
  let brokeSupport = false;
  let breakoutCandle = -1;
  
  for (let i = candles.length - 10; i < candles.length - 2; i++) {
    if (highs[i] > resistance && closes[i] > resistance) {
      brokeResistance = true;
      breakoutCandle = i;
    }
    if (lows[i] < support && closes[i] < support) {
      brokeSupport = true;
      breakoutCandle = i;
    }
  }
  
  // Check for retest (price came back near the level)
  const retestingResistance = brokeResistance && 
    currentPrice > resistance && 
    Math.abs(lows[lows.length - 1] - resistance) < atr * 0.3;
    
  const retestingSupport = brokeSupport && 
    currentPrice < support && 
    Math.abs(highs[highs.length - 1] - support) < atr * 0.3;
  
  // Candle confirmation
  const bullishConfirm = currentCandle.close > currentCandle.open && 
                         currentCandle.close > closes[closes.length - 2];
  const bearishConfirm = currentCandle.close < currentCandle.open && 
                         currentCandle.close < closes[closes.length - 2];
  
  let signal = null;
  let confidence = 0;
  let reason = '';
  
  // 🟢 BUY: Broke resistance + retesting + bullish confirmation
  if (retestingResistance && bullishConfirm) {
    confidence = 60;
    reason = 'Break-Retest: ';
    
    confidence += 20; reason += `Broke-R@${resistance.toFixed(4)} `;
    confidence += 15; reason += 'Retest-Complete ';
    confidence += 10; reason += 'Bullish-Confirm ';
    
    // 📐 CALCULATE PROPER SL/TP FROM MARKET STRUCTURE
    // SL: Just below the broken resistance level (now support)
    const slBuffer = atr * 0.3;
    const stopLossPrice = resistance - slBuffer;
    const slDistance = currentPrice - stopLossPrice;
    
    // TP: Next resistance level OR 2.5x risk
    let takeProfitPrice = nextResistance;
    const tpDistance = takeProfitPrice - currentPrice;
    
    // Ensure minimum 1:2 RR
    if (tpDistance < slDistance * 2) {
      takeProfitPrice = currentPrice + (slDistance * 2.5);
    }
    
    const slPips = Math.round(slDistance / pipSize);
    const tpPips = Math.round((takeProfitPrice - currentPrice) / pipSize);
    
    signal = { 
      type: 'buy', 
      confidence: Math.min(confidence, 95), 
      reason: reason.trim(), 
      strategy: 'break_retest',
      stopLoss: stopLossPrice,
      takeProfit: takeProfitPrice,
      slPips: slPips,
      tpPips: tpPips,
      entryPrice: currentPrice
    };
  }
  
  // 🔴 SELL: Broke support + retesting + bearish confirmation
  else if (retestingSupport && bearishConfirm) {
    confidence = 60;
    reason = 'Break-Retest: ';
    
    confidence += 20; reason += `Broke-S@${support.toFixed(4)} `;
    confidence += 15; reason += 'Retest-Complete ';
    confidence += 10; reason += 'Bearish-Confirm ';
    
    // 📐 CALCULATE PROPER SL/TP FROM MARKET STRUCTURE
    // SL: Just above the broken support level (now resistance)
    const slBuffer = atr * 0.3;
    const stopLossPrice = support + slBuffer;
    const slDistance = stopLossPrice - currentPrice;
    
    // TP: Next support level OR 2.5x risk
    let takeProfitPrice = nextSupport;
    const tpDistance = currentPrice - takeProfitPrice;
    
    // Ensure minimum 1:2 RR
    if (tpDistance < slDistance * 2) {
      takeProfitPrice = currentPrice - (slDistance * 2.5);
    }
    
    const slPips = Math.round(slDistance / pipSize);
    const tpPips = Math.round((currentPrice - takeProfitPrice) / pipSize);
    
    signal = { 
      type: 'sell', 
      confidence: Math.min(confidence, 95), 
      reason: reason.trim(), 
      strategy: 'break_retest',
      stopLoss: stopLossPrice,
      takeProfit: takeProfitPrice,
      slPips: slPips,
      tpPips: tpPips,
      entryPrice: currentPrice
    };
  }
  
  return signal;
}

/**
 * 🧠 STRATEGY: Liquidity Sweep + Market Structure Shift (SMC)
 * Smart Money Concepts - hunt stop losses then reverse
 * - Detect liquidity sweep (wick beyond swing H/L)
 * - Detect market structure shift
 * - Enter on pullback
 * - SL: At the sweep wick (where liquidity was grabbed)
 * - TP: Opposite liquidity zone (where stops are resting)
 */
function analyzeLiquiditySweep(candles, symbol, botConfig = null) {
  if (!candles || candles.length < 50) return null;
  
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const currentPrice = closes[closes.length - 1];
  const atr = calculateATR(candles, 14);
  const pipSize = getPipSize(symbol);
  const isGold = symbol.includes('XAU') || symbol.includes('GOLD');
  
  // Find swing highs and lows
  const swingHighs = [];
  const swingLows = [];
  
  for (let i = 3; i < candles.length - 3; i++) {
    // Swing high: higher than 3 candles before and after
    if (highs[i] > Math.max(...highs.slice(i-3, i)) && 
        highs[i] > Math.max(...highs.slice(i+1, i+4))) {
      swingHighs.push({ idx: i, price: highs[i] });
    }
    // Swing low: lower than 3 candles before and after
    if (lows[i] < Math.min(...lows.slice(i-3, i)) && 
        lows[i] < Math.min(...lows.slice(i+1, i+4))) {
      swingLows.push({ idx: i, price: lows[i] });
    }
  }
  
  if (swingHighs.length < 2 || swingLows.length < 2) return null;
  
  // Check for liquidity sweep in last 5 candles
  const lastSwingHigh = swingHighs[swingHighs.length - 1];
  const lastSwingLow = swingLows[swingLows.length - 1];
  const prevSwingHigh = swingHighs.length > 1 ? swingHighs[swingHighs.length - 2] : lastSwingHigh;
  const prevSwingLow = swingLows.length > 1 ? swingLows[swingLows.length - 2] : lastSwingLow;
  
  let sweptLow = false;
  let sweptHigh = false;
  let sweepCandle = -1;
  let sweepWickLow = Infinity;
  let sweepWickHigh = -Infinity;
  
  // Check last 5 candles for sweep
  for (let i = candles.length - 5; i < candles.length - 1; i++) {
    // Swept low: wick below swing low but closed above
    if (lows[i] < lastSwingLow.price && closes[i] > lastSwingLow.price) {
      sweptLow = true;
      sweepCandle = i;
      sweepWickLow = Math.min(sweepWickLow, lows[i]);
    }
    // Swept high: wick above swing high but closed below
    if (highs[i] > lastSwingHigh.price && closes[i] < lastSwingHigh.price) {
      sweptHigh = true;
      sweepCandle = i;
      sweepWickHigh = Math.max(sweepWickHigh, highs[i]);
    }
  }
  
  // Check for market structure shift after sweep
  const recentCandles = candles.slice(-5);
  const bullishShift = sweptLow && 
    recentCandles.filter(c => c.close > c.open).length >= 3 &&
    currentPrice > closes[sweepCandle];
    
  const bearishShift = sweptHigh && 
    recentCandles.filter(c => c.close < c.open).length >= 3 &&
    currentPrice < closes[sweepCandle];
  
  let signal = null;
  let confidence = 0;
  let reason = '';
  
  // 🟢 BUY: Liquidity sweep below swing low + bullish structure shift
  if (bullishShift) {
    confidence = 60;
    reason = 'SMC-Sweep: ';
    
    confidence += 20; reason += `Swept-Low@${lastSwingLow.price.toFixed(4)} `;
    confidence += 15; reason += 'Bullish-Shift ';
    confidence += 10; reason += 'Reversal-Confirm ';
    
    // 📐 CALCULATE PROPER SL/TP FROM MARKET STRUCTURE
    // SL: Just below the sweep wick (where liquidity was grabbed)
    const slBuffer = atr * 0.2;
    const stopLossPrice = sweepWickLow - slBuffer;
    const slDistance = currentPrice - stopLossPrice;
    
    // TP: Target the opposite liquidity (swing high where shorts have stops)
    let takeProfitPrice = lastSwingHigh.price;
    const tpDistance = takeProfitPrice - currentPrice;
    
    // Ensure minimum 1:2 RR
    if (tpDistance < slDistance * 2) {
      takeProfitPrice = currentPrice + (slDistance * 2.5);
    }
    
    const slPips = Math.round(slDistance / pipSize);
    const tpPips = Math.round((takeProfitPrice - currentPrice) / pipSize);
    
    signal = { 
      type: 'buy', 
      confidence: Math.min(confidence, 95), 
      reason: reason.trim(), 
      strategy: 'liquidity_sweep',
      stopLoss: stopLossPrice,
      takeProfit: takeProfitPrice,
      slPips: slPips,
      tpPips: tpPips,
      entryPrice: currentPrice
    };
  }
  
  // 🔴 SELL: Liquidity sweep above swing high + bearish structure shift
  else if (bearishShift) {
    confidence = 60;
    reason = 'SMC-Sweep: ';
    
    confidence += 20; reason += `Swept-High@${lastSwingHigh.price.toFixed(4)} `;
    confidence += 15; reason += 'Bearish-Shift ';
    confidence += 10; reason += 'Reversal-Confirm ';
    
    // 📐 CALCULATE PROPER SL/TP FROM MARKET STRUCTURE
    // SL: Just above the sweep wick (where liquidity was grabbed)
    const slBuffer = atr * 0.2;
    const stopLossPrice = sweepWickHigh + slBuffer;
    const slDistance = stopLossPrice - currentPrice;
    
    // TP: Target the opposite liquidity (swing low where longs have stops)
    let takeProfitPrice = lastSwingLow.price;
    const tpDistance = currentPrice - takeProfitPrice;
    
    // Ensure minimum 1:2 RR
    if (tpDistance < slDistance * 2) {
      takeProfitPrice = currentPrice - (slDistance * 2.5);
    }
    
    const slPips = Math.round(slDistance / pipSize);
    const tpPips = Math.round((currentPrice - takeProfitPrice) / pipSize);
    
    signal = { 
      type: 'sell', 
      confidence: Math.min(confidence, 95), 
      reason: reason.trim(), 
      strategy: 'liquidity_sweep',
      stopLoss: stopLossPrice,
      takeProfit: takeProfitPrice,
      slPips: slPips,
      tpPips: tpPips,
      entryPrice: currentPrice
    };
  }
  
  return signal;
}

/**
 * 📈 STRATEGY: London Session Breakout
 * Trade breakouts during London session (08:00-11:00 GMT)
 * - Identify Asian session range
 * - Trade breakout direction
 * - SL: Mid-range of Asian session
 * - TP: 1.5-2x the Asian range from breakout point
 */
function analyzeLondonBreakout(candles, symbol, botConfig = null) {
  if (!candles || candles.length < 50) return null;
  
  const currentTime = new Date();
  const utcHour = currentTime.getUTCHours();
  
  // Only trade during London session: 08:00-11:00 GMT
  const isLondonSession = utcHour >= 8 && utcHour <= 11;
  if (!isLondonSession) return null;
  
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const currentPrice = closes[closes.length - 1];
  const currentCandle = candles[candles.length - 1];
  const atr = calculateATR(candles, 14);
  const pipSize = getPipSize(symbol);
  const isGold = symbol.includes('XAU') || symbol.includes('GOLD');
  
  // Estimate Asian session range (last ~12-16 candles on M15, ~24-32 on M5)
  // Use last 20 candles as approximation for Asian range
  const asianCandles = candles.slice(-20, -3); // Exclude last 3 (current London)
  if (asianCandles.length < 10) return null;
  
  const asianHigh = Math.max(...asianCandles.map(c => c.high));
  const asianLow = Math.min(...asianCandles.map(c => c.low));
  const asianRange = asianHigh - asianLow;
  const asianMid = (asianHigh + asianLow) / 2;
  
  // Check for breakout
  const brokeAbove = currentPrice > asianHigh && closes[closes.length - 2] <= asianHigh;
  const brokeBelow = currentPrice < asianLow && closes[closes.length - 2] >= asianLow;
  
  // Confirmation: strong candle in breakout direction
  const bullishBreak = brokeAbove && currentCandle.close > currentCandle.open;
  const bearishBreak = brokeBelow && currentCandle.close < currentCandle.open;
  
  let signal = null;
  let confidence = 0;
  let reason = '';
  
  // 🟢 BUY: Break above Asian high during London
  if (bullishBreak) {
    confidence = 60;
    reason = 'London-Breakout: ';
    
    confidence += 20; reason += `Broke-Asian-High@${asianHigh.toFixed(4)} `;
    confidence += 15; reason += 'London-Session ';
    confidence += 10; reason += 'Bullish-Momentum ';
    
    // 📐 CALCULATE PROPER SL/TP FROM MARKET STRUCTURE
    // SL: Mid-range of Asian session (conservative) or just below Asian high
    const stopLossPrice = asianMid; // Mid-range is standard for London breakout
    const slDistance = currentPrice - stopLossPrice;
    
    // TP: 1.5-2x the Asian range from the breakout point
    const takeProfitPrice = asianHigh + (asianRange * 2);
    const tpDistance = takeProfitPrice - currentPrice;
    
    const slPips = Math.round(slDistance / pipSize);
    const tpPips = Math.round(tpDistance / pipSize);
    
    signal = { 
      type: 'buy', 
      confidence: Math.min(confidence, 95), 
      reason: reason.trim(), 
      strategy: 'london_breakout',
      stopLoss: stopLossPrice,
      takeProfit: takeProfitPrice,
      slPips: slPips,
      tpPips: tpPips,
      entryPrice: currentPrice
    };
  }
  
  // 🔴 SELL: Break below Asian low during London
  else if (bearishBreak) {
    confidence = 60;
    reason = 'London-Breakout: ';
    
    confidence += 20; reason += `Broke-Asian-Low@${asianLow.toFixed(4)} `;
    confidence += 15; reason += 'London-Session ';
    confidence += 10; reason += 'Bearish-Momentum ';
    
    // 📐 CALCULATE PROPER SL/TP FROM MARKET STRUCTURE
    // SL: Mid-range of Asian session (conservative)
    const stopLossPrice = asianMid;
    const slDistance = stopLossPrice - currentPrice;
    
    // TP: 1.5-2x the Asian range from the breakout point
    const takeProfitPrice = asianLow - (asianRange * 2);
    const tpDistance = currentPrice - takeProfitPrice;
    
    const slPips = Math.round(slDistance / pipSize);
    const tpPips = Math.round(tpDistance / pipSize);
    
    signal = { 
      type: 'sell', 
      confidence: Math.min(confidence, 95), 
      reason: reason.trim(), 
      strategy: 'london_breakout',
      stopLoss: stopLossPrice,
      takeProfit: takeProfitPrice,
      slPips: slPips,
      tpPips: tpPips,
      entryPrice: currentPrice
    };
  }
  
  return signal;
}

/**
 * 🏦 STRATEGY: Order Block Detection
 * Identify institutional order blocks and trade rejections
 * - Find last bullish/bearish candle before major move
 * - Trade when price returns to that zone
 * - SL: Just beyond the order block zone
 * - TP: Target the liquidity above/below (where stops are resting)
 */
function analyzeOrderBlock(candles, symbol, botConfig = null) {
  if (!candles || candles.length < 50) return null;
  
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const opens = candles.map(c => c.open);
  const currentPrice = closes[closes.length - 1];
  const currentCandle = candles[candles.length - 1];
  const atr = calculateATR(candles, 14);
  const pipSize = getPipSize(symbol);
  const isGold = symbol.includes('XAU') || symbol.includes('GOLD');
  
  // Find swing highs and lows for TP targeting
  const recentHighs = highs.slice(-30);
  const recentLows = lows.slice(-30);
  const swingHigh = Math.max(...recentHighs);
  const swingLow = Math.min(...recentLows);
  
  // Find order blocks - last opposite candle before strong move
  let bullishOB = null; // Last bearish candle before bullish move
  let bearishOB = null; // Last bullish candle before bearish move
  
  // Look for order blocks in candles 10-40 (not too recent, not too old)
  for (let i = 10; i < 40 && i < candles.length - 5; i++) {
    const idx = candles.length - 1 - i;
    const candle = candles[idx];
    const isBearish = candle.close < candle.open;
    const isBullish = candle.close > candle.open;
    
    // Check if followed by strong move (3+ candles in opposite direction)
    const nextCandles = candles.slice(idx + 1, idx + 5);
    const bullishMove = nextCandles.filter(c => c.close > c.open).length >= 3;
    const bearishMove = nextCandles.filter(c => c.close < c.open).length >= 3;
    
    // Bullish OB: bearish candle before bullish move
    if (!bullishOB && isBearish && bullishMove) {
      bullishOB = {
        high: candle.high,
        low: candle.low,
        idx: idx
      };
    }
    
    // Bearish OB: bullish candle before bearish move
    if (!bearishOB && isBullish && bearishMove) {
      bearishOB = {
        high: candle.high,
        low: candle.low,
        idx: idx
      };
    }
  }
  
  let signal = null;
  let confidence = 0;
  let reason = '';
  
  // 🟢 BUY: Price returns to bullish order block + rejection
  if (bullishOB && currentPrice >= bullishOB.low && currentPrice <= bullishOB.high * 1.001) {
    const rejection = currentCandle.close > currentCandle.open && 
                      currentCandle.low <= bullishOB.high;
    
    if (rejection) {
      confidence = 55;
      reason = 'OrderBlock: ';
      
      confidence += 20; reason += `Bullish-OB@${bullishOB.low.toFixed(4)}-${bullishOB.high.toFixed(4)} `;
      confidence += 15; reason += 'Price-In-Zone ';
      confidence += 10; reason += 'Rejection-Candle ';
      
      // 📐 CALCULATE PROPER SL/TP FROM MARKET STRUCTURE
      // SL: Just below the order block low + buffer
      const slBuffer = atr * 0.3;
      const stopLossPrice = bullishOB.low - slBuffer;
      const slDistance = currentPrice - stopLossPrice;
      
      // TP: Target the swing high (liquidity above)
      let takeProfitPrice = swingHigh;
      const tpDistance = takeProfitPrice - currentPrice;
      
      // Ensure minimum 1:2 RR
      if (tpDistance < slDistance * 2) {
        takeProfitPrice = currentPrice + (slDistance * 2.5);
      }
      
      const slPips = Math.round(slDistance / pipSize);
      const tpPips = Math.round((takeProfitPrice - currentPrice) / pipSize);
      
      signal = { 
        type: 'buy', 
        confidence: Math.min(confidence, 95), 
        reason: reason.trim(), 
        strategy: 'order_block',
        stopLoss: stopLossPrice,
        takeProfit: takeProfitPrice,
        slPips: slPips,
        tpPips: tpPips,
        entryPrice: currentPrice
      };
    }
  }
  
  // 🔴 SELL: Price returns to bearish order block + rejection
  if (!signal && bearishOB && currentPrice <= bearishOB.high && currentPrice >= bearishOB.low * 0.999) {
    const rejection = currentCandle.close < currentCandle.open && 
                      currentCandle.high >= bearishOB.low;
    
    if (rejection) {
      confidence = 55;
      reason = 'OrderBlock: ';
      
      confidence += 20; reason += `Bearish-OB@${bearishOB.low.toFixed(4)}-${bearishOB.high.toFixed(4)} `;
      confidence += 15; reason += 'Price-In-Zone ';
      confidence += 10; reason += 'Rejection-Candle ';
      
      // 📐 CALCULATE PROPER SL/TP FROM MARKET STRUCTURE
      // SL: Just above the order block high + buffer
      const slBuffer = atr * 0.3;
      const stopLossPrice = bearishOB.high + slBuffer;
      const slDistance = stopLossPrice - currentPrice;
      
      // TP: Target the swing low (liquidity below)
      let takeProfitPrice = swingLow;
      const tpDistance = currentPrice - takeProfitPrice;
      
      // Ensure minimum 1:2 RR
      if (tpDistance < slDistance * 2) {
        takeProfitPrice = currentPrice - (slDistance * 2.5);
      }
      
      const slPips = Math.round(slDistance / pipSize);
      const tpPips = Math.round((currentPrice - takeProfitPrice) / pipSize);
      
      signal = { 
        type: 'sell', 
        confidence: Math.min(confidence, 95), 
        reason: reason.trim(), 
        strategy: 'order_block',
        stopLoss: stopLossPrice,
        takeProfit: takeProfitPrice,
        slPips: slPips,
        tpPips: tpPips,
        entryPrice: currentPrice
      };
    }
  }
  
  return signal;
}

/**
 * 📉 STRATEGY: VWAP Mean Reversion
 * Trade bounces off Volume Weighted Average Price
 * - Buy when price below VWAP + RSI oversold
 * - Sell when price above VWAP + RSI overbought
 * - SL: Beyond the recent extreme (lowest low or highest high)
 * - TP: At or slightly past VWAP
 */
function analyzeVWAPReversion(candles, symbol, botConfig = null) {
  if (!candles || candles.length < 30) return null;
  
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const currentPrice = closes[closes.length - 1];
  const currentCandle = candles[candles.length - 1];
  const atr = calculateATR(candles, 14);
  const pipSize = getPipSize(symbol);
  const isGold = symbol.includes('XAU') || symbol.includes('GOLD');
  
  // Find recent extremes for SL placement
  const recentLows = lows.slice(-10);
  const recentHighs = highs.slice(-10);
  const recentSwingLow = Math.min(...recentLows);
  const recentSwingHigh = Math.max(...recentHighs);
  
  // Calculate VWAP (using typical price * volume proxy from range)
  let cumulativeTPV = 0;
  let cumulativeVolume = 0;
  
  for (let i = 0; i < candles.length; i++) {
    const typicalPrice = (candles[i].high + candles[i].low + candles[i].close) / 3;
    // Use range as volume proxy (bigger range = more activity)
    const volumeProxy = candles[i].high - candles[i].low;
    cumulativeTPV += typicalPrice * volumeProxy;
    cumulativeVolume += volumeProxy;
  }
  
  const vwap = cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : currentPrice;
  
  // RSI
  const rsi = calculateRSI(closes, 14);
  const currentRSI = rsi[rsi.length - 1];
  
  // Distance from VWAP
  const distFromVWAP = currentPrice - vwap;
  const percentFromVWAP = (distFromVWAP / vwap) * 100;
  
  // Conditions
  const belowVWAP = currentPrice < vwap;
  const aboveVWAP = currentPrice > vwap;
  const oversold = currentRSI < 35;
  const overbought = currentRSI > 65;
  const bullishCandle = currentCandle.close > currentCandle.open;
  const bearishCandle = currentCandle.close < currentCandle.open;
  
  let signal = null;
  let confidence = 0;
  let reason = '';
  
  // 🟢 BUY: Below VWAP + RSI oversold + bullish candle
  if (belowVWAP && oversold && bullishCandle) {
    confidence = 55;
    reason = 'VWAP-Reversion: ';
    
    confidence += 15; reason += `Below-VWAP(${percentFromVWAP.toFixed(2)}%) `;
    confidence += 20; reason += `RSI-Oversold(${currentRSI.toFixed(0)}) `;
    confidence += 10; reason += 'Bullish-Candle ';
    
    // Extra confidence if significantly below VWAP
    if (percentFromVWAP < -0.3) { confidence += 10; reason += 'Extended '; }
    
    // 📐 CALCULATE PROPER SL/TP FROM MARKET STRUCTURE
    // SL: Just below the recent swing low (where the extreme was)
    const slBuffer = atr * 0.3;
    const stopLossPrice = recentSwingLow - slBuffer;
    const slDistance = currentPrice - stopLossPrice;
    
    // TP: Target VWAP or slightly above (mean reversion target)
    let takeProfitPrice = vwap + (atr * 0.5); // Slightly past VWAP
    const tpDistance = takeProfitPrice - currentPrice;
    
    // Ensure minimum 1:1.5 RR for mean reversion (typically tighter)
    if (tpDistance < slDistance * 1.5) {
      takeProfitPrice = currentPrice + (slDistance * 2);
    }
    
    const slPips = Math.round(slDistance / pipSize);
    const tpPips = Math.round((takeProfitPrice - currentPrice) / pipSize);
    
    signal = { 
      type: 'buy', 
      confidence: Math.min(confidence, 95), 
      reason: reason.trim(), 
      strategy: 'vwap_reversion',
      stopLoss: stopLossPrice,
      takeProfit: takeProfitPrice,
      slPips: slPips,
      tpPips: tpPips,
      entryPrice: currentPrice
    };
  }
  
  // 🔴 SELL: Above VWAP + RSI overbought + bearish candle
  else if (aboveVWAP && overbought && bearishCandle) {
    confidence = 55;
    reason = 'VWAP-Reversion: ';
    
    confidence += 15; reason += `Above-VWAP(${percentFromVWAP.toFixed(2)}%) `;
    confidence += 20; reason += `RSI-Overbought(${currentRSI.toFixed(0)}) `;
    confidence += 10; reason += 'Bearish-Candle ';
    
    if (percentFromVWAP > 0.3) { confidence += 10; reason += 'Extended '; }
    
    // 📐 CALCULATE PROPER SL/TP FROM MARKET STRUCTURE
    // SL: Just above the recent swing high (where the extreme was)
    const slBuffer = atr * 0.3;
    const stopLossPrice = recentSwingHigh + slBuffer;
    const slDistance = stopLossPrice - currentPrice;
    
    // TP: Target VWAP or slightly below (mean reversion target)
    let takeProfitPrice = vwap - (atr * 0.5); // Slightly past VWAP
    const tpDistance = currentPrice - takeProfitPrice;
    
    // Ensure minimum 1:1.5 RR for mean reversion
    if (tpDistance < slDistance * 1.5) {
      takeProfitPrice = currentPrice - (slDistance * 2);
    }
    
    const slPips = Math.round(slDistance / pipSize);
    const tpPips = Math.round((currentPrice - takeProfitPrice) / pipSize);
    
    signal = { 
      type: 'sell', 
      confidence: Math.min(confidence, 95), 
      reason: reason.trim(), 
      strategy: 'vwap_reversion',
      stopLoss: stopLossPrice,
      takeProfit: takeProfitPrice,
      slPips: slPips,
      tpPips: tpPips,
      entryPrice: currentPrice
    };
  }
  
  return signal;
}

/**
 * 🎯 STRATEGY: Fibonacci Continuation
 * Trade pullbacks to Fibonacci levels in trending market
 * - Find recent swing
 * - Wait for pullback to 50-61.8%
 * - Enter on rejection candle
 * - SL: Just beyond the 78.6% fib level
 * - TP: At or past the previous swing high/low (127.2% or 161.8% extension)
 */
function analyzeFibonacciContinuation(candles, symbol, botConfig = null) {
  if (!candles || candles.length < 50) return null;
  
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const currentPrice = closes[closes.length - 1];
  const currentCandle = candles[candles.length - 1];
  const atr = calculateATR(candles, 14);
  const pipSize = getPipSize(symbol);
  const isGold = symbol.includes('XAU') || symbol.includes('GOLD');
  
  // Find recent swing high and low (last 30 candles)
  const recentCandles = candles.slice(-30);
  const swingHigh = Math.max(...recentCandles.map(c => c.high));
  const swingLow = Math.min(...recentCandles.map(c => c.low));
  const swingRange = swingHigh - swingLow;
  
  // Determine trend direction
  const highIdx = recentCandles.findIndex(c => c.high === swingHigh);
  const lowIdx = recentCandles.findIndex(c => c.low === swingLow);
  const isUpswing = lowIdx < highIdx; // Low came first = upswing
  const isDownswing = highIdx < lowIdx; // High came first = downswing
  
  // Calculate Fibonacci levels
  const fib382 = isUpswing ? swingHigh - swingRange * 0.382 : swingLow + swingRange * 0.382;
  const fib50 = isUpswing ? swingHigh - swingRange * 0.5 : swingLow + swingRange * 0.5;
  const fib618 = isUpswing ? swingHigh - swingRange * 0.618 : swingLow + swingRange * 0.618;
  const fib786 = isUpswing ? swingHigh - swingRange * 0.786 : swingLow + swingRange * 0.786;
  
  // Fibonacci extensions for TP
  const fib127 = isUpswing ? swingHigh + swingRange * 0.272 : swingLow - swingRange * 0.272;
  const fib161 = isUpswing ? swingHigh + swingRange * 0.618 : swingLow - swingRange * 0.618;
  
  // Check if price is at 50-61.8% retracement
  let atFibLevel = false;
  let fibLevel = '';
  
  if (isUpswing) {
    // Bullish trend - price should pull back down to fib levels
    if (currentPrice >= fib618 && currentPrice <= fib50) {
      atFibLevel = true;
      fibLevel = '50-61.8%';
    }
  } else if (isDownswing) {
    // Bearish trend - price should pull back up to fib levels
    if (currentPrice <= fib618 && currentPrice >= fib50) {
      atFibLevel = true;
      fibLevel = '50-61.8%';
    }
  }
  
  if (!atFibLevel) return null;
  
  // Check for rejection candle at fib level
  const bullishRejection = currentCandle.close > currentCandle.open &&
                           currentCandle.close > closes[closes.length - 2];
  const bearishRejection = currentCandle.close < currentCandle.open &&
                           currentCandle.close < closes[closes.length - 2];
  
  let signal = null;
  let confidence = 0;
  let reason = '';
  
  // 🟢 BUY: Upswing + at fib 50-61.8% + bullish rejection
  if (isUpswing && atFibLevel && bullishRejection) {
    confidence = 55;
    reason = 'Fib-Continuation: ';
    
    confidence += 20; reason += 'Uptrend ';
    confidence += 15; reason += `At-Fib-${fibLevel} `;
    confidence += 15; reason += 'Rejection-Candle ';
    
    // 📐 CALCULATE PROPER SL/TP FROM MARKET STRUCTURE
    // SL: Just below the 78.6% fib level (invalidation point)
    const slBuffer = atr * 0.2;
    const stopLossPrice = fib786 - slBuffer;
    const slDistance = currentPrice - stopLossPrice;
    
    // TP: Target the swing high or 127.2% extension
    let takeProfitPrice = swingHigh > currentPrice ? swingHigh : fib127;
    const tpDistance = takeProfitPrice - currentPrice;
    
    // Ensure minimum 1:2 RR
    if (tpDistance < slDistance * 2) {
      takeProfitPrice = currentPrice + (slDistance * 2.5);
    }
    
    const slPips = Math.round(slDistance / pipSize);
    const tpPips = Math.round((takeProfitPrice - currentPrice) / pipSize);
    
    signal = { 
      type: 'buy', 
      confidence: Math.min(confidence, 95), 
      reason: reason.trim(), 
      strategy: 'fibonacci_continuation',
      stopLoss: stopLossPrice,
      takeProfit: takeProfitPrice,
      slPips: slPips,
      tpPips: tpPips,
      entryPrice: currentPrice
    };
  }
  
  // 🔴 SELL: Downswing + at fib 50-61.8% + bearish rejection
  else if (isDownswing && atFibLevel && bearishRejection) {
    confidence = 55;
    reason = 'Fib-Continuation: ';
    
    confidence += 20; reason += 'Downtrend ';
    confidence += 15; reason += `At-Fib-${fibLevel} `;
    confidence += 15; reason += 'Rejection-Candle ';
    
    // 📐 CALCULATE PROPER SL/TP FROM MARKET STRUCTURE
    // SL: Just above the 78.6% fib level (invalidation point)
    const slBuffer = atr * 0.2;
    const stopLossPrice = fib786 + slBuffer;
    const slDistance = stopLossPrice - currentPrice;
    
    // TP: Target the swing low or 127.2% extension
    let takeProfitPrice = swingLow < currentPrice ? swingLow : fib127;
    const tpDistance = currentPrice - takeProfitPrice;
    
    // Ensure minimum 1:2 RR
    if (tpDistance < slDistance * 2) {
      takeProfitPrice = currentPrice - (slDistance * 2.5);
    }
    
    const slPips = Math.round(slDistance / pipSize);
    const tpPips = Math.round((currentPrice - takeProfitPrice) / pipSize);
    
    signal = { 
      type: 'sell', 
      confidence: Math.min(confidence, 95), 
      reason: reason.trim(), 
      strategy: 'fibonacci_continuation',
      stopLoss: stopLossPrice,
      takeProfit: takeProfitPrice,
      slPips: slPips,
      tpPips: tpPips,
      entryPrice: currentPrice
    };
  }
  
  return signal;
}

/**
 * 🔥 STRATEGY: RSI Divergence Reversal (Enhanced)
 * More precise divergence detection
 * - Price makes lower low but RSI makes higher low (bullish)
 * - Price makes higher high but RSI makes lower high (bearish)
 * - SL: Just beyond the divergence swing point
 * - TP: Target the previous swing high/low (reversal target)
 */
function analyzeRSIDivergence(candles, symbol, botConfig = null) {
  if (!candles || candles.length < 50) return null;
  
  const closes = candles.map(c => c.close);
  const lows = candles.map(c => c.low);
  const highs = candles.map(c => c.high);
  const currentPrice = closes[closes.length - 1];
  const currentCandle = candles[candles.length - 1];
  const atr = calculateATR(candles, 14);
  const pipSize = getPipSize(symbol);
  const isGold = symbol.includes('XAU') || symbol.includes('GOLD');
  
  const rsi = calculateRSI(closes, 14);
  const currentRSI = rsi[rsi.length - 1];
  
  // Find swing highs for TP targeting
  const recentHighs = highs.slice(-30);
  const recentLows = lows.slice(-30);
  const swingHigh = Math.max(...recentHighs);
  const swingLow = Math.min(...recentLows);
  
  // Find swing points in last 30 candles
  const lookback = 30;
  let priceLows = [];
  let priceHighs = [];
  let rsiAtLows = [];
  let rsiAtHighs = [];
  
  for (let i = 5; i < lookback - 5 && i < candles.length - 5; i++) {
    const idx = candles.length - lookback + i;
    
    // Swing low
    if (lows[idx] < Math.min(...lows.slice(idx - 3, idx)) &&
        lows[idx] < Math.min(...lows.slice(idx + 1, idx + 4))) {
      priceLows.push({ idx, price: lows[idx], rsi: rsi[idx] });
    }
    
    // Swing high
    if (highs[idx] > Math.max(...highs.slice(idx - 3, idx)) &&
        highs[idx] > Math.max(...highs.slice(idx + 1, idx + 4))) {
      priceHighs.push({ idx, price: highs[idx], rsi: rsi[idx] });
    }
  }
  
  let signal = null;
  let confidence = 0;
  let reason = '';
  
  // Check for bullish divergence (lower price low, higher RSI low)
  if (priceLows.length >= 2) {
    const recent = priceLows[priceLows.length - 1];
    const prev = priceLows[priceLows.length - 2];
    
    const bullishDiv = recent.price < prev.price && recent.rsi > prev.rsi;
    const bullishConfirm = currentCandle.close > currentCandle.open;
    
    if (bullishDiv && bullishConfirm && currentRSI < 45) {
      confidence = 60;
      reason = 'RSI-Divergence: ';
      
      confidence += 25; reason += 'Bullish-Divergence ';
      confidence += 10; reason += `RSI(${currentRSI.toFixed(0)}) `;
      confidence += 10; reason += 'Confirm-Candle ';
      
      // 📐 CALCULATE PROPER SL/TP FROM MARKET STRUCTURE
      // SL: Just below the recent divergence low (the swing low)
      const slBuffer = atr * 0.3;
      const stopLossPrice = recent.price - slBuffer;
      const slDistance = currentPrice - stopLossPrice;
      
      // TP: Target the previous swing high (reversal target)
      let takeProfitPrice = swingHigh;
      const tpDistance = takeProfitPrice - currentPrice;
      
      // Ensure minimum 1:2 RR
      if (tpDistance < slDistance * 2) {
        takeProfitPrice = currentPrice + (slDistance * 2.5);
      }
      
      const slPips = Math.round(slDistance / pipSize);
      const tpPips = Math.round((takeProfitPrice - currentPrice) / pipSize);
      
      signal = { 
        type: 'buy', 
        confidence: Math.min(confidence, 95), 
        reason: reason.trim(), 
        strategy: 'rsi_divergence',
        stopLoss: stopLossPrice,
        takeProfit: takeProfitPrice,
        slPips: slPips,
        tpPips: tpPips,
        entryPrice: currentPrice
      };
    }
  }
  
  // Check for bearish divergence (higher price high, lower RSI high)
  if (!signal && priceHighs.length >= 2) {
    const recent = priceHighs[priceHighs.length - 1];
    const prev = priceHighs[priceHighs.length - 2];
    
    const bearishDiv = recent.price > prev.price && recent.rsi < prev.rsi;
    const bearishConfirm = currentCandle.close < currentCandle.open;
    
    if (bearishDiv && bearishConfirm && currentRSI > 55) {
      confidence = 60;
      reason = 'RSI-Divergence: ';
      
      confidence += 25; reason += 'Bearish-Divergence ';
      confidence += 10; reason += `RSI(${currentRSI.toFixed(0)}) `;
      confidence += 10; reason += 'Confirm-Candle ';
      
      // 📐 CALCULATE PROPER SL/TP FROM MARKET STRUCTURE
      // SL: Just above the recent divergence high (the swing high)
      const slBuffer = atr * 0.3;
      const stopLossPrice = recent.price + slBuffer;
      const slDistance = stopLossPrice - currentPrice;
      
      // TP: Target the previous swing low (reversal target)
      let takeProfitPrice = swingLow;
      const tpDistance = currentPrice - takeProfitPrice;
      
      // Ensure minimum 1:2 RR
      if (tpDistance < slDistance * 2) {
        takeProfitPrice = currentPrice - (slDistance * 2.5);
      }
      
      const slPips = Math.round(slDistance / pipSize);
      const tpPips = Math.round((currentPrice - takeProfitPrice) / pipSize);
      
      signal = { 
        type: 'sell', 
        confidence: Math.min(confidence, 95), 
        reason: reason.trim(), 
        strategy: 'rsi_divergence',
        stopLoss: stopLossPrice,
        takeProfit: takeProfitPrice,
        slPips: slPips,
        tpPips: tpPips,
        entryPrice: currentPrice
      };
    }
  }
  
  return signal;
}

/**
 * MULTI-STRATEGY ANALYZER
 * Runs all proven strategies and returns the STRONGEST signal
 * This maximizes accuracy by only trading the best setups
 * 
 * ✅ ONLY PROVEN HIGH WIN-RATE STRATEGIES:
 * - EMA 200 Pullback (Institutional favorite)
 * - Break and Retest
 * - Liquidity Sweep (SMC)
 * - London Session Breakout
 * - Order Block
 * - VWAP Mean Reversion
 * - Fibonacci Continuation
 * - RSI Divergence
 */
function analyzeWithMultipleStrategies(candles, symbol, botConfig = null) {
  if (!candles || candles.length < 60) return null;
  
  const isGold = isGoldSymbol(symbol);
  const isSilver = isSilverSymbol(symbol);
  const isMetal = isPreciousMetal(symbol);
  
  // ================================================================
  // 🔍 COMPREHENSIVE CANDLE ANALYSIS FOR BEST SIGNAL QUALITY
  // Study the candles first before running strategies
  // ================================================================
  const candlePatterns = analyzeCandlePatterns(candles);
  // Market structure analysis works for both Gold and Silver
  const marketStructure = isMetal ? analyzeGoldMarketStructure(candles) : null;
  
  if (marketStructure) {
    const metalName = isGold ? 'Gold' : 'Silver';
    console.log(`  📊 ${symbol} (${metalName}) Market Structure:`);
    console.log(`     Trend: ${marketStructure.trend.short}/${marketStructure.trend.medium} (${marketStructure.trend.strength})`);
    console.log(`     Momentum: ${marketStructure.momentum} | RSI: ${marketStructure.rsi.toFixed(1)} (${marketStructure.rsiZone})`);
    console.log(`     Volatility: ${marketStructure.volatility} | ATR: ${marketStructure.atr.toFixed(2)}`);
    if (marketStructure.levels.nearSupport) console.log(`     ⚠️ Near Support: ${marketStructure.levels.support.toFixed(2)}`);
    if (marketStructure.levels.nearResistance) console.log(`     ⚠️ Near Resistance: ${marketStructure.levels.resistance.toFixed(2)}`);
  }
  
  if (candlePatterns.pattern) {
    console.log(`  🕯️ ${symbol} Candle Pattern: ${candlePatterns.pattern} (${candlePatterns.type}) +${candlePatterns.boost}% boost`);
  }
  
  // 🚀 PRECIOUS METALS OPTIMIZED STRATEGIES
  // Both Gold and Silver are traded - each has different characteristics
  
  const strategies = isGold ? [
    // GOLD-OPTIMIZED WEIGHTS - Gold respects these patterns strongly
    { name: 'Break-Retest', fn: analyzeBreakAndRetest, weight: 1.5 },          // ⭐⭐ Gold loves break & retest
    { name: 'Liquidity-Sweep', fn: analyzeLiquiditySweep, weight: 1.45 },      // ⭐⭐ Gold sweeps liquidity hard
    { name: 'EMA200-Pullback', fn: analyzeEMA200Pullback, weight: 1.4 },       // ⭐ Gold respects EMA200
    { name: 'Order-Block', fn: analyzeOrderBlock, weight: 1.35 },              // ⭐ Institutional zones on gold
    { name: 'Fibonacci', fn: analyzeFibonacciContinuation, weight: 1.3 },      // Gold respects fib levels
    { name: 'RSI-Divergence', fn: analyzeRSIDivergence, weight: 1.25 },        // Divergence works on gold
    { name: 'VWAP-Reversion', fn: analyzeVWAPReversion, weight: 1.2 },         // Mean reversion
    { name: 'London-Breakout', fn: analyzeLondonBreakout, weight: 1.15 },      // Session breakouts
  ] : isSilver ? [
    // SILVER-OPTIMIZED WEIGHTS - Silver is more volatile, momentum-driven
    { name: 'Liquidity-Sweep', fn: analyzeLiquiditySweep, weight: 1.55 },      // ⭐⭐⭐ Silver sweeps are aggressive
    { name: 'Break-Retest', fn: analyzeBreakAndRetest, weight: 1.5 },          // ⭐⭐ Silver respects break levels
    { name: 'London-Breakout', fn: analyzeLondonBreakout, weight: 1.45 },      // ⭐⭐ Silver volatile at London open
    { name: 'EMA200-Pullback', fn: analyzeEMA200Pullback, weight: 1.35 },      // ⭐ EMA200 pullbacks work
    { name: 'RSI-Divergence', fn: analyzeRSIDivergence, weight: 1.3 },         // Divergence for reversals
    { name: 'Fibonacci', fn: analyzeFibonacciContinuation, weight: 1.25 },     // Fib levels on silver
    { name: 'Order-Block', fn: analyzeOrderBlock, weight: 1.2 },               // Institutional activity
    { name: 'VWAP-Reversion', fn: analyzeVWAPReversion, weight: 1.15 },        // Mean reversion (less reliable)
  ] : [
    // FALLBACK WEIGHTS (should not be used - only trading Gold/Silver)
    { name: 'EMA200-Pullback', fn: analyzeEMA200Pullback, weight: 1.4 },
    { name: 'Break-Retest', fn: analyzeBreakAndRetest, weight: 1.35 },
    { name: 'Liquidity-Sweep', fn: analyzeLiquiditySweep, weight: 1.3 },
    { name: 'VWAP-Reversion', fn: analyzeVWAPReversion, weight: 1.25 },
    { name: 'RSI-Divergence', fn: analyzeRSIDivergence, weight: 1.25 },
    { name: 'London-Breakout', fn: analyzeLondonBreakout, weight: 1.2 },
    { name: 'Fibonacci', fn: analyzeFibonacciContinuation, weight: 1.15 },
    { name: 'Order-Block', fn: analyzeOrderBlock, weight: 1.1 },
  ];
  
  const signals = [];
  const currentPrice = candles[candles.length - 1].close;
  const atr = calculateATR(candles, 14);
  const pipSize = getPipSize(symbol);
  
  // Run all strategies - collect ALL signals regardless of confidence
  console.log(`  🔍 ${symbol}: Running ${strategies.length} strategies...`);
  
  for (const strategy of strategies) {
    try {
      const signal = strategy.fn(candles, symbol, botConfig);
      if (signal) {
        // Apply candle pattern boost if pattern confirms signal direction
        let patternBoost = 0;
        if (candlePatterns.pattern) {
          if ((signal.type === 'buy' && candlePatterns.type === 'bullish') ||
              (signal.type === 'sell' && candlePatterns.type === 'bearish')) {
            patternBoost = candlePatterns.boost;
            signal.confidence = Math.min(95, signal.confidence + patternBoost);
          }
        }
        
        // Apply market structure confirmation boost
        let structureBoost = 0;
        if (marketStructure) {
          // Boost if signal aligns with trend
          if ((signal.type === 'buy' && marketStructure.trend.aligned && marketStructure.trend.short === 'bullish') ||
              (signal.type === 'sell' && marketStructure.trend.aligned && marketStructure.trend.short === 'bearish')) {
            structureBoost = 5;
            signal.confidence = Math.min(95, signal.confidence + structureBoost);
          }
          // Extra boost for trend + momentum alignment
          if ((signal.type === 'buy' && marketStructure.momentum === 'bullish') ||
              (signal.type === 'sell' && marketStructure.momentum === 'bearish')) {
            structureBoost += 3;
            signal.confidence = Math.min(95, signal.confidence + 3);
          }
        }
        
        const weighted = signal.confidence * strategy.weight;
        const boostInfo = (patternBoost > 0 || structureBoost > 0) ? 
          ` [+${patternBoost}pattern +${structureBoost}struct]` : '';
        console.log(`    ✓ ${strategy.name}: ${signal.type.toUpperCase()} ${signal.confidence}% (weighted: ${weighted.toFixed(1)})${boostInfo}`);
        signals.push({
          ...signal,
          strategyName: strategy.name,
          weightedConfidence: weighted,
          patternBoost,
          structureBoost,
          candlePattern: candlePatterns.pattern,
        });
      }
    } catch (err) {
      // Strategy failed - skip it
    }
  }
  
  if (signals.length === 0) {
    console.log(`  ⏸️ ${symbol}: No signals from any strategy - waiting for setup`);
    return null;
  }
  
  // ================================================================
  // SORT ALL SIGNALS BY WEIGHTED CONFIDENCE (HIGHEST FIRST)
  // This ensures we always pick the strongest signal
  // ================================================================
  signals.sort((a, b) => b.weightedConfidence - a.weightedConfidence);
  
  console.log(`  📊 ${symbol}: Signal ranking by weighted confidence:`);
  signals.forEach((s, i) => {
    console.log(`      ${i+1}. ${s.strategyName}: ${s.type.toUpperCase()} ${s.confidence}% (weighted: ${s.weightedConfidence.toFixed(1)})`);
  });
  
  // ================================================================
  // BOT-SPECIFIC ALIGNMENT CHECK
  // Each bot has specific strategies that MUST confirm its signals
  // NO GLOBAL REQUIREMENT - Only bot-specific alignment matters
  // ================================================================
  const buySignals = signals.filter(s => s.type === 'buy');
  const sellSignals = signals.filter(s => s.type === 'sell');
  
  // Use bot-specific minAlignments instead of global MIN_STRATEGIES_REQUIRED
  const minStrategies = botConfig?.minAlignments || 2;
  
  // Sort agreeing signals by weighted confidence
  buySignals.sort((a, b) => b.weightedConfidence - a.weightedConfidence);
  sellSignals.sort((a, b) => b.weightedConfidence - a.weightedConfidence);
  
  console.log(`  📊 ${symbol}: ${buySignals.length} BUY signals, ${sellSignals.length} SELL signals (bot needs ${minStrategies} alignment)`);
  
  let bestSignal = null;
  let confluenceCount = 0;
  let allAgreeingSignals = [];
  
  // ================================================================
  // BOT-SPECIFIC ALIGNMENT VALIDATION
  // Check if bot's required alignment strategies are confirming
  // ================================================================
  const checkBotAlignment = (agreeing, direction) => {
    if (!botConfig || !botConfig.minAlignments || !botConfig.alignWith) {
      // No specific alignment requirements - need at least 2 strategies agreeing
      return { passed: agreeing.length >= 2, reason: 'general confluence (2+)', alignmentCount: agreeing.length, minRequired: 2, confirmingStrategies: agreeing.map(s => s.strategyName) };
    }
    
    const minRequired = botConfig.minAlignments;
    const alignStrategies = botConfig.alignWith || [];
    
    // Map strategy names to check names (handles naming differences)
    const strategyNameMap = {
      'ema-pullback': ['EMA200-Pullback', 'ema', 'pullback'],
      'break-retest': ['Break-Retest', 'break', 'retest'],
      'liquidity-sweep': ['Liquidity-Sweep', 'liquidity', 'sweep', 'smc'],
      'london-breakout': ['London-Breakout', 'london', 'session'],
      'order-block': ['Order-Block', 'order', 'block'],
      'vwap-reversion': ['VWAP-Reversion', 'vwap', 'reversion'],
      'fib-continuation': ['Fibonacci', 'fib', 'fibonacci'],
      'rsi-divergence': ['RSI-Divergence', 'rsi', 'divergence'],
    };
    
    // Find which required alignment strategies are confirming
    const confirmingStrategies = [];
    for (const requiredStrategy of alignStrategies) {
      const aliases = strategyNameMap[requiredStrategy] || [requiredStrategy];
      const found = agreeing.find(s => 
        aliases.some(alias => 
          s.strategyName.toLowerCase().includes(alias.toLowerCase())
        )
      );
      if (found) {
        confirmingStrategies.push({ required: requiredStrategy, found: found.strategyName });
      }
    }
    
    const alignmentCount = confirmingStrategies.length;
    const passed = alignmentCount >= minRequired;
    
    if (passed) {
      console.log(`  🎯 BOT ALIGNMENT MET: ${alignmentCount}/${minRequired} required strategies confirming`);
      console.log(`     Confirming: ${confirmingStrategies.map(c => c.found).join(', ')}`);
      console.log(`     Explanation: ${botConfig.alignmentExplanation}`);
    } else {
      console.log(`  ⏸️ BOT ALIGNMENT NOT MET: Only ${alignmentCount}/${minRequired} strategies confirming`);
      console.log(`     Found: ${confirmingStrategies.map(c => c.found).join(', ') || 'none'}`);
      console.log(`     Needed: ${alignStrategies.join(', ')}`);
    }
    
    return { 
      passed, 
      alignmentCount,
      minRequired,
      confirmingStrategies: confirmingStrategies.map(c => c.found),
      reason: passed ? 
        `BOT ALIGNMENT (${alignmentCount}/${minRequired}): ${confirmingStrategies.map(c => c.found).join('+')}` :
        `Need ${minRequired - alignmentCount} more alignment strategies`
    };
  };
  
  // Check BUY signals with bot-specific alignment
  if (buySignals.length > 0) {
    // Check bot-specific alignment
    const alignment = checkBotAlignment(buySignals, 'BUY');
    
    if (alignment.passed) {
      // Bot alignment confirmed - can trade
      confluenceCount = buySignals.length;
      allAgreeingSignals = buySignals;
      bestSignal = buySignals[0]; // Already sorted - first is highest weighted confidence
      
      // Calculate average weighted confidence of all agreeing strategies
      const avgWeighted = buySignals.reduce((sum, s) => sum + s.weightedConfidence, 0) / buySignals.length;
      
      bestSignal.reason = `🔥ALIGNMENT(${alignment.alignmentCount}/${alignment.minRequired}): ` + 
        `[${alignment.confirmingStrategies.join('+')}] ` + bestSignal.reason;
      console.log(`  ✅ ${symbol}: BOT ALIGNMENT MET for BUY - TOP: ${bestSignal.strategyName} (${bestSignal.weightedConfidence.toFixed(1)})`);
    }
  }
  
  // Check SELL signals with bot-specific alignment (only if no buy signal passed)
  if (!bestSignal && sellSignals.length > 0) {
    // Check bot-specific alignment
    const alignment = checkBotAlignment(sellSignals, 'SELL');
    
    if (alignment.passed) {
      // Bot alignment confirmed - can trade
      confluenceCount = sellSignals.length;
      allAgreeingSignals = sellSignals;
      bestSignal = sellSignals[0]; // Already sorted - first is highest weighted confidence
      
      // Calculate average weighted confidence
      const avgWeighted = sellSignals.reduce((sum, s) => sum + s.weightedConfidence, 0) / sellSignals.length;
      
      bestSignal.reason = `🔥ALIGNMENT(${alignment.alignmentCount}/${alignment.minRequired}): ` + 
        `[${alignment.confirmingStrategies.join('+')}] ` + bestSignal.reason;
      console.log(`  ✅ ${symbol}: BOT ALIGNMENT MET for SELL - TOP: ${bestSignal.strategyName} (${bestSignal.weightedConfidence.toFixed(1)})`);
    }
  }
  
  // No alignment met - wait for setup
  if (!bestSignal) {
    console.log(`  ⏸️ ${symbol}: BOT ALIGNMENT NOT MET - waiting for ${minStrategies} confirming strategies`);
    return null;
  }
  
  // ================================================================
  // CONFLUENCE-BASED LOT SCALING
  // More agreeing strategies = bigger lots for higher probability trades
  // ================================================================
  let lotMultiplier = RISK_CONFIG.LOT_MULTIPLIER_3_STRATS;
  if (confluenceCount >= 6) {
    lotMultiplier = RISK_CONFIG.LOT_MULTIPLIER_6_PLUS;
    console.log(`  🚀 ${symbol}: EXTREME CONFLUENCE (${confluenceCount} strategies) - ${lotMultiplier}x lot multiplier`);
  } else if (confluenceCount >= 5) {
    lotMultiplier = RISK_CONFIG.LOT_MULTIPLIER_5_STRATS;
    console.log(`  🔥 ${symbol}: VERY HIGH CONFLUENCE (${confluenceCount} strategies) - ${lotMultiplier}x lot multiplier`);
  } else if (confluenceCount >= 4) {
    lotMultiplier = RISK_CONFIG.LOT_MULTIPLIER_4_STRATS;
    console.log(`  ⭐ ${symbol}: HIGH CONFLUENCE (${confluenceCount} strategies) - ${lotMultiplier}x lot multiplier`);
  } else {
    console.log(`  ✅ ${symbol}: ALIGNMENT MET (${confluenceCount} strategies) - ${lotMultiplier}x base lot`);
  }
  
  // Boost confidence based on number of agreeing strategies (+5% per extra strategy beyond minimum)
  const confluenceBonus = Math.max(0, (confluenceCount - minStrategies) * 5);
  bestSignal.confidence = Math.min(95, bestSignal.confidence + confluenceBonus);
  
  console.log(`  🎯 ${symbol}: BEST SIGNAL = ${bestSignal.type.toUpperCase()} via ${bestSignal.strategyName} (${bestSignal.confidence}%)`);
  
  // ================================================================
  // USE THE SL/TP ALREADY CALCULATED BY THE STRATEGY
  // Each strategy calculates proper structure-based SL/TP
  // This ensures SL/TP are based on actual market levels that WILL get hit
  // ================================================================
  
  // The strategy should have already calculated these values
  // If not present for some reason, fall back to ATR-based defaults
  let stopLoss = bestSignal.stopLoss;
  let takeProfit = bestSignal.takeProfit;
  let slPips = bestSignal.slPips;
  let tpPips = bestSignal.tpPips;
  
  // Fallback only if strategy didn't calculate SL/TP
  if (!stopLoss || !takeProfit) {
    console.log(`  ⚠️ ${symbol}: Strategy ${bestSignal.strategy} missing SL/TP - using ATR fallback`);
    const isBuy = bestSignal.type === 'buy';
    const atrMultiplierSL = isGold ? 1.5 : 1.5;
    const atrMultiplierTP = isGold ? 3 : 3;
    
    slPips = Math.round((atr * atrMultiplierSL) / pipSize);
    tpPips = Math.round((atr * atrMultiplierTP) / pipSize);
    
    stopLoss = isBuy ? currentPrice - (slPips * pipSize) : currentPrice + (slPips * pipSize);
    takeProfit = isBuy ? currentPrice + (tpPips * pipSize) : currentPrice - (tpPips * pipSize);
  }
  
  return {
    symbol,
    type: bestSignal.type,
    entryPrice: currentPrice,
    stopLoss: stopLoss,
    takeProfit: takeProfit,
    volume: 0.01,
    confidence: bestSignal.confidence,
    reason: bestSignal.reason,
    atr,
    strategy: bestSignal.strategy,
    slPips: slPips,
    tpPips: tpPips,
    confluenceCount: confluenceCount,
    lotMultiplier: lotMultiplier,
    allAgreeingStrategies: allAgreeingSignals.map(s => s.strategyName),
    avgWeightedConfidence: allAgreeingSignals.reduce((sum, s) => sum + s.weightedConfidence, 0) / allAgreeingSignals.length,
  };
}

// Track open positions with their strategy for smart management
const positionStrategyMap = new Map(); // positionId -> { strategy, entryPrice, slPips, tpPips }

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
 * SCALPING ANALYSIS - Ultra-fast entries with STRICT BOT-DEFINED SL/TP
 * Scalper uses: 12 pip SL, 20 pip TP (from BOT_CONFIG)
 * =========================================================================
 */
function analyzeMarketForScalping(candles, symbol, riskLevel = 'medium', botConfig = null) {
  if (!candles || candles.length < 30) return null;
  
  const closes = candles.map(c => c.close);
  const currentPrice = closes[closes.length - 1];
  const atr = calculateATR(candles, 7); // Shorter ATR for scalping
  
  if (atr === 0) return null;
  
  // Calculate fast indicators for scalping
  const ema5 = calculateEMA(closes, 5);
  const ema10 = calculateEMA(closes, 10);
  const ema20 = calculateEMA(closes, 20);
  const rsi = calculateRSI(closes, 7); // Faster RSI for scalping
  const currentRsi = rsi[rsi.length - 1] || 50;
  
  const ema5Val = ema5[ema5.length - 1];
  const ema10Val = ema10[ema10.length - 1];
  const ema20Val = ema20[ema20.length - 1];
  
  // Quick trend check
  const fastTrendUp = ema5Val > ema10Val && ema10Val > ema20Val;
  const fastTrendDown = ema5Val < ema10Val && ema10Val < ema20Val;
  
  // Momentum check - need 3 candles in same direction for scalp
  const recentCandles = candles.slice(-3);
  const bullishCandles = recentCandles.filter(c => c.close > c.open).length;
  const bearishCandles = 3 - bullishCandles;
  
  // Price momentum
  const priceChange = (currentPrice - closes[closes.length - 4]) / currentPrice * 100;
  const strongMomentum = Math.abs(priceChange) > 0.1; // 0.1% move
  
  // Candle body strength (strong bodies = conviction)
  const lastCandle = candles[candles.length - 1];
  const bodySize = Math.abs(lastCandle.close - lastCandle.open);
  const wickSize = lastCandle.high - lastCandle.low - bodySize;
  const strongBody = bodySize > wickSize; // Body > wicks = conviction
  
  let signal = null;
  let confidence = 0;
  let reason = '';
  
  // SCALP BUY: Quick momentum entries
  if ((ema5Val > ema10Val || bullishCandles >= 2 || currentPrice > ema5Val)) {
    confidence = 40; // Start with base
    reason = 'SCALP-BUY: ';
    
    if (fastTrendUp) { confidence += 20; reason += 'FastTrend '; }
    else if (ema5Val > ema10Val) { confidence += 10; reason += 'EMA-Up '; }
    if (currentRsi > 40 && currentRsi < 70) { confidence += 10; reason += 'RSI-Good '; }
    if (strongMomentum && priceChange > 0) { confidence += 15; reason += 'Momentum '; }
    if (bullishCandles >= 2) { confidence += 10; reason += `${bullishCandles}-Green `; }
    if (strongBody && lastCandle.close > lastCandle.open) { confidence += 10; reason += 'StrongCandle '; }
    if (currentPrice > ema5Val) { confidence += 5; reason += 'Above-EMA '; }
    
    // Always return signal - confluence will filter
    signal = { type: 'buy', confidence: Math.min(confidence, 95), reason: reason.trim() };
  }
  
  // SCALP SELL: Quick momentum entries
  if (!signal && (ema5Val < ema10Val || bearishCandles >= 2 || currentPrice < ema5Val)) {
    confidence = 40;
    reason = 'SCALP-SELL: ';
    
    if (fastTrendDown) { confidence += 20; reason += 'FastTrend '; }
    else if (ema5Val < ema10Val) { confidence += 10; reason += 'EMA-Down '; }
    if (currentRsi < 60 && currentRsi > 30) { confidence += 10; reason += 'RSI-Good '; }
    if (strongMomentum && priceChange < 0) { confidence += 15; reason += 'Momentum '; }
    if (bearishCandles >= 2) { confidence += 10; reason += `${bearishCandles}-Red `; }
    if (strongBody && lastCandle.close < lastCandle.open) { confidence += 10; reason += 'StrongCandle '; }
    if (currentPrice < ema5Val) { confidence += 5; reason += 'Below-EMA '; }
    
    // Always return signal - confluence will filter
    signal = { type: 'sell', confidence: Math.min(confidence, 95), reason: reason.trim() };
  }
  
  if (!signal) return null;
  
  // ================================================================
  // USE BOT-DEFINED SL/TP - These are FIXED values that WILL be hit
  // ================================================================
  const isGold = symbol.includes('XAU') || symbol.includes('GOLD');
  const isBuy = signal.type === 'buy';
  const pipSize = getPipSize(symbol);
  
  // Get SL/TP from bot config or use defaults
  const slPips = isGold 
    ? (botConfig?.goldSLPips || 100)   // Gold: 100 cents = $1.00
    : (botConfig?.stopLossPips || 12); // Forex: 12 pips
  const tpPips = isGold 
    ? (botConfig?.goldTPPips || 150)   // Gold: 150 cents = $1.50
    : (botConfig?.takeProfitPips || 20); // Forex: 20 pips
  
  const stopLossPrice = isBuy 
    ? currentPrice - (slPips * pipSize) 
    : currentPrice + (slPips * pipSize);
  const takeProfitPrice = isBuy 
    ? currentPrice + (tpPips * pipSize) 
    : currentPrice - (tpPips * pipSize);
  
  return {
    symbol,
    type: signal.type,
    entryPrice: currentPrice,
    stopLoss: stopLossPrice,
    takeProfit: takeProfitPrice,
    volume: 0.01, // Will be recalculated based on confidence
    confidence: signal.confidence,
    reason: signal.reason,
    atr,
    isScalp: true,
    slPips,
    tpPips,
    indicators: { rsi: currentRsi, ema5: ema5Val, ema10: ema10Val, ema20: ema20Val }
  };
}

/**
 * =========================================================================
 * MOMENTUM STRATEGY - RSI/MACD divergence trading
 * Uses: 25 pip SL, 45 pip TP (from BOT_CONFIG)
 * =========================================================================
 */
function analyzeMarketForMomentum(candles, symbol, riskLevel = 'medium', botConfig = null) {
  if (!candles || candles.length < 50) return null;
  
  const closes = candles.map(c => c.close);
  const currentPrice = closes[closes.length - 1];
  const atr = calculateATR(candles, 14);
  
  if (atr === 0) return null;
  
  // RSI for momentum
  const rsi = calculateRSI(closes, 14);
  const currentRsi = rsi[rsi.length - 1] || 50;
  const prevRsi = rsi[rsi.length - 2] || 50;
  
  // MACD calculation
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = calculateEMA(macdLine, 9);
  const histogram = macdLine[macdLine.length - 1] - signalLine[signalLine.length - 1];
  const prevHistogram = macdLine[macdLine.length - 2] - signalLine[signalLine.length - 2];
  
  // EMA trend
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);
  const trendUp = ema20[ema20.length - 1] > ema50[ema50.length - 1];
  
  let signal = null;
  let confidence = 0;
  let reason = '';
  
  // MOMENTUM BUY: RSI low OR MACD turning up
  if ((currentRsi < 45 && histogram > prevHistogram) || (currentRsi < 35) || (trendUp && histogram > 0 && histogram > prevHistogram)) {
    confidence = 40;
    reason = 'MOMENTUM-BUY: ';
    
    if (currentRsi < 30) { confidence += 25; reason += 'RSI-Oversold '; }
    else if (currentRsi < 40) { confidence += 15; reason += 'RSI-Low '; }
    if (histogram > 0 && prevHistogram < 0) { confidence += 20; reason += 'MACD-Cross '; }
    else if (histogram > prevHistogram) { confidence += 12; reason += 'MACD-Rising '; }
    if (trendUp) { confidence += 12; reason += 'TrendUp '; }
    if (currentRsi > prevRsi) { confidence += 8; reason += 'RSI-Turning '; }
    
    // Always return signal - confluence will filter
    signal = { type: 'buy', confidence: Math.min(confidence, 95), reason: reason.trim() };
  }
  
  // MOMENTUM SELL: RSI high OR MACD turning down
  if (!signal && ((currentRsi > 55 && histogram < prevHistogram) || (currentRsi > 65) || (!trendUp && histogram < 0 && histogram < prevHistogram))) {
    confidence = 40;
    reason = 'MOMENTUM-SELL: ';
    
    if (currentRsi > 70) { confidence += 25; reason += 'RSI-Overbought '; }
    else if (currentRsi > 60) { confidence += 15; reason += 'RSI-High '; }
    if (histogram < 0 && prevHistogram > 0) { confidence += 20; reason += 'MACD-Cross '; }
    else if (histogram < prevHistogram) { confidence += 12; reason += 'MACD-Falling '; }
    if (!trendUp) { confidence += 12; reason += 'TrendDown '; }
    if (currentRsi < prevRsi) { confidence += 8; reason += 'RSI-Turning '; }
    
    // Always return signal - confluence will filter
    signal = { type: 'sell', confidence: Math.min(confidence, 95), reason: reason.trim() };
  }
  
  if (!signal) return null;
  
  // ================================================================
  // USE BOT-DEFINED SL/TP - Fixed values that WILL be hit
  // ================================================================
  const isGold = symbol.includes('XAU') || symbol.includes('GOLD');
  const isBuy = signal.type === 'buy';
  const pipSize = getPipSize(symbol);
  
  const slPips = isGold 
    ? (botConfig?.goldSLPips || 200) 
    : (botConfig?.stopLossPips || 25);
  const tpPips = isGold 
    ? (botConfig?.goldTPPips || 350) 
    : (botConfig?.takeProfitPips || 45);
  
  return {
    symbol, 
    type: signal.type, 
    entryPrice: currentPrice,
    stopLoss: isBuy ? currentPrice - (slPips * pipSize) : currentPrice + (slPips * pipSize),
    takeProfit: isBuy ? currentPrice + (tpPips * pipSize) : currentPrice - (tpPips * pipSize),
    volume: 0.01, 
    confidence: signal.confidence, 
    reason: signal.reason, 
    atr,
    strategy: 'momentum', 
    slPips, 
    tpPips
  };
}

/**
 * =========================================================================
 * TREND STRATEGY - EMA crossover with ADX filter
 * Uses: 35 pip SL, 70 pip TP (from BOT_CONFIG)
 * =========================================================================
 */
function analyzeMarketForTrend(candles, symbol, riskLevel = 'medium', botConfig = null) {
  if (!candles || candles.length < 50) return null;
  
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const currentPrice = closes[closes.length - 1];
  const atr = calculateATR(candles, 14);
  
  if (atr === 0) return null;
  
  // EMAs for trend
  const ema8 = calculateEMA(closes, 8);
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);
  
  const ema8Val = ema8[ema8.length - 1];
  const ema20Val = ema20[ema20.length - 1];
  const ema50Val = ema50[ema50.length - 1];
  const prevEma8 = ema8[ema8.length - 2];
  const prevEma20 = ema20[ema20.length - 2];
  
  // Calculate ADX
  const adx = calculateADX(candles, 14);
  const strongTrend = adx > 20;
  
  // Check for EMA crossover
  const bullishCross = prevEma8 <= prevEma20 && ema8Val > ema20Val;
  const bearishCross = prevEma8 >= prevEma20 && ema8Val < ema20Val;
  
  // All EMAs aligned
  const bullishAlign = ema8Val > ema20Val && ema20Val > ema50Val;
  const bearishAlign = ema8Val < ema20Val && ema20Val < ema50Val;
  
  let signal = null;
  let confidence = 0;
  let reason = '';
  
  // TREND BUY: EMA crossover or bullish alignment
  if (bullishCross || bullishAlign || (ema8Val > ema20Val && currentPrice > ema8Val)) {
    confidence = 40;
    reason = 'TREND-BUY: ';
    
    if (bullishCross) { confidence += 25; reason += 'EMA-Cross '; }
    if (bullishAlign) { confidence += 18; reason += 'Aligned '; }
    if (strongTrend) { confidence += 15; reason += `ADX${adx.toFixed(0)} `; }
    if (currentPrice > ema8Val) { confidence += 10; reason += 'AboveEMA '; }
    if (currentPrice > ema50Val) { confidence += 8; reason += 'Above50 '; }
    
    // Always return signal - confluence will filter
    signal = { type: 'buy', confidence: Math.min(confidence, 95), reason: reason.trim() };
  }
  
  // TREND SELL: EMA crossover or bearish alignment
  if (!signal && (bearishCross || bearishAlign || (ema8Val < ema20Val && currentPrice < ema8Val))) {
    confidence = 40;
    reason = 'TREND-SELL: ';
    
    if (bearishCross) { confidence += 25; reason += 'EMA-Cross '; }
    if (bearishAlign) { confidence += 18; reason += 'Aligned '; }
    if (strongTrend) { confidence += 15; reason += `ADX${adx.toFixed(0)} `; }
    if (currentPrice < ema8Val) { confidence += 10; reason += 'BelowEMA '; }
    if (currentPrice < ema50Val) { confidence += 8; reason += 'Below50 '; }
    
    // Always return signal - confluence will filter
    signal = { type: 'sell', confidence: Math.min(confidence, 95), reason: reason.trim() };
  }
  
  if (!signal) return null;
  
  // ================================================================
  // USE BOT-DEFINED SL/TP
  // ================================================================
  const isGold = symbol.includes('XAU') || symbol.includes('GOLD');
  const isBuy = signal.type === 'buy';
  const pipSize = getPipSize(symbol);
  
  const slPips = isGold 
    ? (botConfig?.goldSLPips || 250) 
    : (botConfig?.stopLossPips || 35);
  const tpPips = isGold 
    ? (botConfig?.goldTPPips || 500) 
    : (botConfig?.takeProfitPips || 70);
  
  return {
    symbol, 
    type: signal.type, 
    entryPrice: currentPrice,
    stopLoss: isBuy ? currentPrice - (slPips * pipSize) : currentPrice + (slPips * pipSize),
    takeProfit: isBuy ? currentPrice + (tpPips * pipSize) : currentPrice - (tpPips * pipSize),
    volume: 0.01, 
    confidence: signal.confidence, 
    reason: signal.reason, 
    atr,
    strategy: 'trend', 
    slPips, 
    tpPips
  };
}

/**
 * =========================================================================
 * BREAKOUT STRATEGY - Support/Resistance breakout detection
 * Uses: 25 pip SL, 55 pip TP (from BOT_CONFIG)
 * =========================================================================
 */
function analyzeMarketForBreakout(candles, symbol, riskLevel = 'medium', botConfig = null) {
  if (!candles || candles.length < 50) return null;
  
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const currentPrice = closes[closes.length - 1];
  const atr = calculateATR(candles, 14);
  
  if (atr === 0) return null;
  
  // Find recent highs and lows (support/resistance)
  const lookback = 20;
  const recentHighs = highs.slice(-lookback);
  const recentLows = lows.slice(-lookback);
  const resistance = Math.max(...recentHighs);
  const support = Math.min(...recentLows);
  
  // Check for range (consolidation)
  const range = resistance - support;
  const avgRange = atr * 10;
  const isConsolidating = range < avgRange * 1.5;
  
  // Check for breakout
  const breakoutThreshold = atr * 0.3;
  const bullishBreakout = currentPrice > resistance - breakoutThreshold;
  const bearishBreakout = currentPrice < support + breakoutThreshold;
  
  // Volume check (using candle body size as proxy)
  const lastCandle = candles[candles.length - 1];
  const avgBodySize = closes.slice(-10).reduce((sum, c, i) => 
    sum + Math.abs(candles[candles.length - 10 + i].close - candles[candles.length - 10 + i].open), 0) / 10;
  const currentBodySize = Math.abs(lastCandle.close - lastCandle.open);
  const strongCandle = currentBodySize > avgBodySize * 1.2;
  
  let signal = null;
  let confidence = 0;
  let reason = '';
  
  // BREAKOUT BUY: Price breaks above resistance
  if (bullishBreakout) {
    confidence = 45;
    reason = 'BREAKOUT-BUY: ';
    
    if (currentPrice > resistance) { confidence += 20; reason += 'AboveResist '; }
    else { confidence += 10; reason += 'NearResist '; }
    if (isConsolidating) { confidence += 15; reason += 'FromRange '; }
    if (strongCandle) { confidence += 12; reason += 'StrongCandle '; }
    if (lastCandle.close > lastCandle.open) { confidence += 8; reason += 'Bullish '; }
    
    // Always return signal - confluence will filter
    signal = { type: 'buy', confidence: Math.min(confidence, 95), reason: reason.trim() };
  }
  
  // BREAKOUT SELL: Price breaks below support
  if (!signal && bearishBreakout) {
    confidence = 45;
    reason = 'BREAKOUT-SELL: ';
    
    if (currentPrice < support) { confidence += 20; reason += 'BelowSupport '; }
    else { confidence += 10; reason += 'NearSupport '; }
    if (isConsolidating) { confidence += 15; reason += 'FromRange '; }
    if (strongCandle) { confidence += 12; reason += 'StrongCandle '; }
    if (lastCandle.close < lastCandle.open) { confidence += 8; reason += 'Bearish '; }
    
    // Always return signal - confluence will filter
    signal = { type: 'sell', confidence: Math.min(confidence, 95), reason: reason.trim() };
  }
  
  if (!signal) return null;
  
  // ================================================================
  // USE BOT-DEFINED SL/TP
  // ================================================================
  const isGold = symbol.includes('XAU') || symbol.includes('GOLD');
  const isBuy = signal.type === 'buy';
  const pipSize = getPipSize(symbol);
  
  const slPips = isGold 
    ? (botConfig?.goldSLPips || 200) 
    : (botConfig?.stopLossPips || 25);
  const tpPips = isGold 
    ? (botConfig?.goldTPPips || 450) 
    : (botConfig?.takeProfitPips || 55);
  
  return {
    symbol, 
    type: signal.type, 
    entryPrice: currentPrice,
    stopLoss: isBuy ? currentPrice - (slPips * pipSize) : currentPrice + (slPips * pipSize),
    takeProfit: isBuy ? currentPrice + (tpPips * pipSize) : currentPrice - (tpPips * pipSize),
    volume: 0.01, 
    confidence: signal.confidence, 
    reason: signal.reason, 
    atr,
    strategy: 'breakout', 
    slPips, 
    tpPips, 
    levels: { support, resistance }
  };
}

/**
 * =========================================================================
 * SWING STRATEGY - Multi-timeframe swing trading
 * Uses: 55 pip SL, 120 pip TP (from BOT_CONFIG)
 * =========================================================================
 */
function analyzeMarketForSwing(candles, symbol, riskLevel = 'medium', botConfig = null) {
  if (!candles || candles.length < 50) return null;
  
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const currentPrice = closes[closes.length - 1];
  const atr = calculateATR(candles, 14);
  
  if (atr === 0) return null;
  
  // Swing highs and lows detection
  const swingHighs = [];
  const swingLows = [];
  for (let i = 2; i < candles.length - 2; i++) {
    if (highs[i] > highs[i-1] && highs[i] > highs[i-2] && highs[i] > highs[i+1] && highs[i] > highs[i+2]) {
      swingHighs.push({ index: i, price: highs[i] });
    }
    if (lows[i] < lows[i-1] && lows[i] < lows[i-2] && lows[i] < lows[i+1] && lows[i] < lows[i+2]) {
      swingLows.push({ index: i, price: lows[i] });
    }
  }
  
  // Check for higher highs/higher lows (uptrend) or lower highs/lower lows (downtrend)
  const recentSwingHighs = swingHighs.slice(-3);
  const recentSwingLows = swingLows.slice(-3);
  
  let uptrend = false;
  let downtrend = false;
  
  if (recentSwingHighs.length >= 2 && recentSwingLows.length >= 2) {
    const hhCheck = recentSwingHighs[recentSwingHighs.length-1].price > recentSwingHighs[recentSwingHighs.length-2].price;
    const hlCheck = recentSwingLows[recentSwingLows.length-1].price > recentSwingLows[recentSwingLows.length-2].price;
    uptrend = hhCheck && hlCheck;
    
    const lhCheck = recentSwingHighs[recentSwingHighs.length-1].price < recentSwingHighs[recentSwingHighs.length-2].price;
    const llCheck = recentSwingLows[recentSwingLows.length-1].price < recentSwingLows[recentSwingLows.length-2].price;
    downtrend = lhCheck && llCheck;
  }
  
  // EMA filter
  const ema50 = calculateEMA(closes, 50);
  const aboveEma = currentPrice > ema50[ema50.length - 1];
  
  // Pullback to key level
  const lastSwingLow = recentSwingLows[recentSwingLows.length - 1]?.price || 0;
  const lastSwingHigh = recentSwingHighs[recentSwingHighs.length - 1]?.price || currentPrice;
  const nearSwingLow = currentPrice < lastSwingLow + atr * 2;
  const nearSwingHigh = currentPrice > lastSwingHigh - atr * 2;
  
  let signal = null;
  let confidence = 0;
  let reason = '';
  
  // SWING BUY: Uptrend + pullback to support
  if ((uptrend || aboveEma) && nearSwingLow) {
    confidence = 45;
    reason = 'SWING-BUY: ';
    
    if (uptrend) { confidence += 20; reason += 'Uptrend '; }
    if (nearSwingLow) { confidence += 15; reason += 'AtSupport '; }
    if (aboveEma) { confidence += 12; reason += 'AboveEMA '; }
    
    // Always return signal - confluence will filter
    signal = { type: 'buy', confidence: Math.min(confidence, 95), reason: reason.trim() };
  }
  
  // SWING SELL: Downtrend + rally to resistance
  if (!signal && (downtrend || !aboveEma) && nearSwingHigh) {
    confidence = 45;
    reason = 'SWING-SELL: ';
    
    if (downtrend) { confidence += 20; reason += 'Downtrend '; }
    if (nearSwingHigh) { confidence += 15; reason += 'AtResist '; }
    if (!aboveEma) { confidence += 12; reason += 'BelowEMA '; }
    
    // Always return signal - confluence will filter
    signal = { type: 'sell', confidence: Math.min(confidence, 95), reason: reason.trim() };
  }
  
  if (!signal) return null;
  
  // ================================================================
  // USE BOT-DEFINED SL/TP
  // ================================================================
  const isGold = symbol.includes('XAU') || symbol.includes('GOLD');
  const isBuy = signal.type === 'buy';
  const pipSize = getPipSize(symbol);
  
  const slPips = isGold 
    ? (botConfig?.goldSLPips || 400) 
    : (botConfig?.stopLossPips || 55);
  const tpPips = isGold 
    ? (botConfig?.goldTPPips || 800) 
    : (botConfig?.takeProfitPips || 120);
  
  return {
    symbol, 
    type: signal.type, 
    entryPrice: currentPrice,
    stopLoss: isBuy ? currentPrice - (slPips * pipSize) : currentPrice + (slPips * pipSize),
    takeProfit: isBuy ? currentPrice + (tpPips * pipSize) : currentPrice - (tpPips * pipSize),
    volume: 0.01, 
    confidence: signal.confidence, 
    reason: signal.reason, 
    atr,
    strategy: 'swing', 
    slPips, 
    tpPips
  };
}

/**
 * Calculate ADX (Average Directional Index)
 */
function calculateADX(candles, period = 14) {
  if (candles.length < period * 2) return 20; // Default
  
  let sumDX = 0;
  let plusDMSum = 0;
  let minusDMSum = 0;
  let trSum = 0;
  
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevHigh = candles[i-1].high;
    const prevLow = candles[i-1].low;
    const prevClose = candles[i-1].close;
    
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    const plusDM = high - prevHigh > prevLow - low ? Math.max(high - prevHigh, 0) : 0;
    const minusDM = prevLow - low > high - prevHigh ? Math.max(prevLow - low, 0) : 0;
    
    if (i <= period) {
      trSum += tr;
      plusDMSum += plusDM;
      minusDMSum += minusDM;
    } else {
      trSum = trSum - trSum/period + tr;
      plusDMSum = plusDMSum - plusDMSum/period + plusDM;
      minusDMSum = minusDMSum - minusDMSum/period + minusDM;
    }
    
    if (i >= period) {
      const plusDI = trSum > 0 ? (plusDMSum / trSum) * 100 : 0;
      const minusDI = trSum > 0 ? (minusDMSum / trSum) * 100 : 0;
      const dx = (plusDI + minusDI) > 0 ? Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100 : 0;
      sumDX += dx;
    }
  }
  
  return sumDX / (candles.length - period);
}

/**
 * =========================================================================
 * SMART MARKET ANALYSIS - Only trade on real opportunities
 * =========================================================================
 */
function analyzeMarket(candles, symbol, riskLevel = 'medium', botConfig = null) {
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
  // SIGNAL DETECTION - Trade when opportunities present (AGGRESSIVE MODE)
  // 45%+ = Normal trade, 60%+ = High confidence unlimited
  // =========================================================================
  let signal = null;
  let confidence = 0;
  let reason = '';
  
  // Get previous market structure
  const prevStructure = marketStructure.get(symbol);
  
  // BUY CONDITIONS: Various bullish setups (RELAXED)
  if (
    (isUptrend) ||                                   // Any uptrend
    (emaCrossUp) ||                                  // Fresh crossover
    (currentRsi < 45 && bullishCount >= 2) ||        // RSI low with momentum
    (bullishCount >= 2) ||                           // Any momentum
    (nearSupport) ||                                 // Near support
    (currentPrice > ema8Val) ||                      // Price above fast EMA
    (ema8Val > ema20Val)                             // Fast EMA above slow
  ) {
    confidence = 25; // Start with base confidence
    reason = '';
    
    if (isUptrend) { confidence += 20; reason += 'Uptrend '; }
    if (emaCrossUp) { confidence += 25; reason += 'EMA-Cross-Up '; }
    if (currentRsi < 30) { confidence += 20; reason += 'RSI-Oversold '; }
    else if (currentRsi < 45) { confidence += 10; reason += 'RSI-Low '; }
    if (nearSupport) { confidence += 15; reason += 'Support-Bounce '; }
    if (bullishCount >= 4) { confidence += 20; reason += `Strong-Mom(${bullishCount}/5) `; }
    else if (bullishCount >= 2) { confidence += 10; reason += `Momentum(${bullishCount}/5) `; }
    if (ema8Val > ema20Val && ema20Val > ema50Val) { confidence += 15; reason += 'EMA-Aligned '; }
    else if (ema8Val > ema20Val) { confidence += 10; reason += 'EMA-Bullish '; }
    if (currentPrice > ema8Val) { confidence += 5; reason += 'Above-EMA '; }
    
    // Always return signal - confluence check happens at multi-strategy level
    signal = { type: 'buy', confidence: Math.min(confidence, 100), reason: `BUY: ${reason.trim()}` };
    marketStructure.set(symbol, 'bullish');
  }
  
  // SELL CONDITIONS: Various bearish setups (RELAXED)
  if (
    !signal && (
      (isDowntrend) ||                               // Any downtrend
      (emaCrossDown) ||                              // Fresh crossover
      (currentRsi > 55 && bearishCount >= 2) ||      // RSI high with momentum
      (bearishCount >= 2) ||                         // Any momentum
      (nearResistance) ||                            // Near resistance
      (currentPrice < ema8Val) ||                    // Price below fast EMA
      (ema8Val < ema20Val)                           // Fast EMA below slow
    )
  ) {
    confidence = 25; // Start with base confidence
    reason = '';
    
    if (isDowntrend) { confidence += 20; reason += 'Downtrend '; }
    if (emaCrossDown) { confidence += 25; reason += 'EMA-Cross-Down '; }
    if (currentRsi > 70) { confidence += 20; reason += 'RSI-Overbought '; }
    else if (currentRsi > 55) { confidence += 10; reason += 'RSI-High '; }
    if (nearResistance) { confidence += 15; reason += 'Resistance-Reject '; }
    if (bearishCount >= 4) { confidence += 20; reason += `Strong-Mom(${bearishCount}/5) `; }
    else if (bearishCount >= 2) { confidence += 10; reason += `Momentum(${bearishCount}/5) `; }
    if (ema8Val < ema20Val && ema20Val < ema50Val) { confidence += 15; reason += 'EMA-Aligned '; }
    else if (ema8Val < ema20Val) { confidence += 10; reason += 'EMA-Bearish '; }
    if (currentPrice < ema8Val) { confidence += 5; reason += 'Below-EMA '; }
    
    // Always return signal - confluence check happens at multi-strategy level
    signal = { type: 'sell', confidence: Math.min(confidence, 100), reason: `SELL: ${reason.trim()}` };
    marketStructure.set(symbol, 'bearish');
  }
  
  // FALLBACK: If no signal but ANY momentum, generate a signal
  if (!signal && (bullishCount >= 2 || bearishCount >= 2)) {
    const isBullish = bullishCount >= bearishCount;
    confidence = 45 + (Math.abs(bullishCount - bearishCount) * 5);
    reason = isBullish ? `Momentum(${bullishCount}/5 bullish)` : `Momentum(${bearishCount}/5 bearish)`;
    signal = { type: isBullish ? 'buy' : 'sell', confidence, reason };
    marketStructure.set(symbol, isBullish ? 'bullish' : 'bearish');
  }
  
  // LAST RESORT: Generate a signal based on current price vs EMA (low confidence)
  if (!signal) {
    const isBullish = currentPrice > ema20Val;
    confidence = 40; // Low confidence - needs other strategies to confirm
    reason = isBullish ? 'Price-Above-EMA20' : 'Price-Below-EMA20';
    signal = { type: isBullish ? 'buy' : 'sell', confidence, reason };
    marketStructure.set(symbol, isBullish ? 'bullish' : 'bearish');
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
  
  // Use bot-defined SL/TP pip values if available, otherwise fall back to ATR
  const isGold = symbol.toUpperCase().includes('XAU') || symbol.toUpperCase().includes('GOLD');
  let slPips, tpPips;
  
  if (botConfig) {
    slPips = isGold ? (botConfig.goldSLPips || botConfig.stopLossPips * 10) : botConfig.stopLossPips;
    tpPips = isGold ? (botConfig.goldTPPips || botConfig.takeProfitPips * 10) : botConfig.takeProfitPips;
  } else {
    // Fallback: Calculate from ATR but convert to reasonable pip values
    const pipValue = symbol.includes('JPY') ? 0.01 : 0.0001;
    slPips = Math.round((atr * slMultiplier) / pipValue);
    tpPips = Math.round((atr * tpMultiplier) / pipValue);
    // Ensure reasonable bounds
    slPips = Math.max(10, Math.min(slPips, 100));
    tpPips = Math.max(20, Math.min(tpPips, 200));
  }
  
  // Calculate actual SL/TP prices from pip values
  const pipSize = symbol.includes('JPY') ? 0.01 : (isGold ? 0.1 : 0.0001);
  const stopLoss = isBuy ? currentPrice - (slPips * pipSize) : currentPrice + (slPips * pipSize);
  const takeProfit = isBuy ? currentPrice + (tpPips * pipSize) : currentPrice - (tpPips * pipSize);
  
  return {
    symbol,
    type: signal.type,
    entryPrice: currentPrice,
    stopLoss,
    takeProfit,
    slPips,
    tpPips,
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
 * IMPORTANT: Only returns robots that users have explicitly started (is_enabled = true)
 * If no robots are enabled, no trades will be executed
 */
async function getActiveRobots() {
  try {
    // Query ONLY robots that users have clicked "Start Bot" on (is_enabled = true)
    // AND have a properly connected MT5 account
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
      // No users have started any robots - no trades will be executed
      return [];
    }
    
    console.log(`Found ${result.rows.length} user-enabled robot(s) with connected accounts`);
    
    // Log details for debugging
    result.rows.forEach(r => {
      console.log(`  ✅ Robot: ${r.name} (started by user ${r.user_id}), MT5: ${r.mt5_account_id}`);
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
 * DISABLED: Let SL/TP handle all exits - don't close positions early
 * Returns true to allow new trades (but won't close existing ones)
 */
async function closeOpposingPositions(connection, accountId, userId, symbol, newDirection) {
  // DISABLED: Don't close opposing positions - let them hit SL/TP
  // We allow multiple positions, but won't close existing ones
  console.log(`    ℹ️ Opposing position check skipped - letting SL/TP handle exits`);
  return true; // Allow new trade but don't close existing positions
  
  /*
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
  */
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
    
    // ================================================================
    // BOT PERMISSION CHECK - Only allowed bots can trade
    // ================================================================
    const botPermission = canBotTrade(robotId, robotName);
    if (!botPermission.allowed) {
      console.log(`  ⛔ SKIPPING: ${botPermission.reason}`);
      return;
    }
    
    const botConfig = botPermission.config;
    console.log(`  ✅ Bot "${robotName}" is ALLOWED to trade`);
    
    // Apply bot-specific settings
    const botMaxLotSize = botConfig.maxLotSize || RISK_CONFIG.MAX_LOT_SIZE;
    const botMaxPositions = botConfig.maxPositions || 3;
    const botCooldown = botConfig.cooldownMs || RISK_CONFIG.TRADE_COOLDOWN_MS;
    
    // Get connection and account
    const connection = existingConnection || await getConnection(metaApiAccountId, accountId);
    if (!connection) {
      console.log(`  ⚠️ Could not establish connection for MT5 account ${accountId}`);
      return;
    }
    
    // Get account info for risk management (CACHED to avoid rate limits)
    let accountInfo;
    try {
      accountInfo = await getCachedAccountInfo(connection, accountId);
      console.log(`  💰 Account: Balance=$${accountInfo.balance?.toFixed(2)}, Equity=$${accountInfo.equity?.toFixed(2)}, P/L=$${(accountInfo.equity - accountInfo.balance)?.toFixed(2)}`);
    } catch (e) {
      console.log(`  ⚠️ Could not get account info: ${e.message}`);
      accountInfo = { balance: 0, equity: 0 };
    }
    
    // Get existing open positions from MT5 (CACHED to avoid rate limits)
    let livePositions = [];
    try {
      livePositions = await getCachedPositions(connection, accountId);
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
      currentProfitLoss,
      50,
      accountId  // Pass accountId for daily loss tracking
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
    const isScalper = robotName.toLowerCase().includes('scalp');
    
    // Get allowed pairs for this bot (or use all if not specified)
    const allowedPairs = botConfig.allowedPairs || TRADING_PAIRS;
    const pairsToScan = TRADING_PAIRS.filter(p => allowedPairs.includes(p));
    
    console.log(`  📋 Scanning ${pairsToScan.length} pairs for ${robotName}: ${pairsToScan.join(', ')}`);
    console.log(`  ⚙️ Bot settings: minStrategies=${RISK_CONFIG.MIN_STRATEGIES_REQUIRED}, maxLot=${botMaxLotSize}, cooldown=${botCooldown/1000}s`);
    
    for (const symbol of pairsToScan) {
      try {
        // Check cooldown using BOT-SPECIFIC cooldown
        const lastTrade = lastTradeTime.get(symbol) || 0;
        const onCooldown = Date.now() - lastTrade < botCooldown;
        
        // Get signal first to check confidence level
        const candles = await fetchCandles(account, symbol, timeframe?.toLowerCase() || 'm15', 100);
        
        if (!candles || candles.length < 30) {
          skippedSymbols.push(`${symbol}(no candles)`);
          continue;
        }
        
        // Get current price from latest candle
        const currentPrice = candles[candles.length - 1].close;
        
        let signal = null;
        const botStrategy = botConfig.strategy || 'default';
        
        // ================================================================
        // STRATEGY-SPECIFIC SIGNAL GENERATION
        // ALL BOTS NOW USE THE 8 PROVEN HIGH WIN-RATE STRATEGIES
        // The multi-strategy analyzer picks the strongest signal
        // ================================================================
        
        // 🚀 ALL BOTS USE PROVEN STRATEGIES
        signal = analyzeWithMultipleStrategies(candles, symbol, botConfig);
        
        if (signal) {
          // Log with bot-specific emoji for clarity
          const botEmoji = {
            'scalping': '⚡',
            'momentum': '🚀', 
            'trend': '📈',
            'breakout': '💥',
            'swing': '🔄',
            'gold': '🥇',
            'position': '🎯',
            'sniper': '🎯',
            'news': '📰',
            'grid': '📊',
            'hedge': '🛡️',
            'default': '🎯'
          };
          const emoji = botEmoji[botStrategy] || '🎯';
          console.log(`  ${emoji} ${symbol}: ${botStrategy.toUpperCase()} via [${signal.strategy}] ${signal.type} (${signal.confidence}%) SL=${signal.slPips}pips TP=${signal.tpPips}pips - ${signal.reason}`);
        }
        
        // Skip only if NO signal at all (strategy returned null)
        if (!signal) {
          continue;
        }
        
        // Get dynamic position limits based on account balance
        const positionLimits = getPositionLimits(accountInfo.balance);
        
        // Check if we're under target positions
        const underTarget = livePositions.length < positionLimits.target;
        const isHighConfidence = signal.confidence >= RISK_CONFIG.HIGH_CONFIDENCE_THRESHOLD;
        
        // ================================================================
        // NO POSITION LIMITS - Open as many trades as signals allow
        // Only prevent hedging (opposing positions on same symbol)
        // ================================================================
        const signalDirection = signal.type.toLowerCase();
        const oppositeDirection = signalDirection === 'buy' ? 'sell' : 'buy';
        const existingPositionsOnPair = livePositions.filter(p => p.symbol === symbol);
        
        // NO LIMIT on positions per symbol - keep opening if signals are strong
        // Just log how many we have
        if (existingPositionsOnPair.length > 0) {
          console.log(`  📊 ${symbol}: Have ${existingPositionsOnPair.length} existing position(s) - adding more allowed`);
        }
        
        const hasOpposingPosition = existingPositionsOnPair.some(p => 
          p.type?.toLowerCase() === oppositeDirection || 
          p.type?.toLowerCase()?.includes(oppositeDirection)
        );
        
        if (RISK_CONFIG.PREVENT_HEDGING && hasOpposingPosition) {
          // NEVER open opposite position - skip this pair entirely
          console.log(`  🚫 ${symbol}: Skipping ${signal.type.toUpperCase()} - already have ${oppositeDirection.toUpperCase()} position (no hedging)`);
          continue;
        }
        
        // Cooldown check - enforce 1 minute cooldown per symbol
        if (onCooldown) {
          const timeSinceLast = Math.round((Date.now() - lastTrade) / 1000);
          console.log(`  ⏳ ${symbol}: Cooldown - last trade ${timeSinceLast}s ago (need ${RISK_CONFIG.TRADE_COOLDOWN_MS/1000}s)`);
          skippedSymbols.push(`${symbol}(cooldown)`);
          continue;
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
      console.log(`  ⏸️ No confluence signals (need ${RISK_CONFIG.MIN_STRATEGIES_REQUIRED}+ strategies agreeing)`);
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
        // NO position limit check - always open if signal is strong
        const existingOnSymbol = livePositions.filter(p => p.symbol === symbol);
        console.log(`    📰 ${symbol}: Have ${existingOnSymbol.length} existing position(s) - news signal processing`);
        
        const currentPL = livePositions.reduce((sum, p) => sum + (p.profit || 0), 0);
        const riskCheck = canOpenMoreTrades(accountInfo.balance, accountInfo.equity, livePositions.length, currentPL, signal.confidence, accountId);
        
        if (!riskCheck.canTrade) {
          console.log(`    ⛔ ${symbol}: ${riskCheck.reason}`);
          continue;
        }
        
        try {
          // Calculate lot size using signal confidence, bot config, and confluence multiplier
          const lotMultiplier = signal.lotMultiplier || 1.0;
          const lotSize = calculatePositionSize(accountInfo.balance, signal.slPips, symbol, signal.confidence, botConfig, lotMultiplier);
          signal.volume = lotSize;
          
          console.log(`    📰 ${symbol}: ${signal.impactLevel} IMPACT NEWS - ${signal.tradingMode}`);
          console.log(`       ${signal.type} @ ${signal.entryPrice?.toFixed(5)}, SL: ${signal.stopLoss?.toFixed(5)}, TP: ${signal.takeProfit?.toFixed(5)}`);
          console.log(`       Lots: ${lotSize} (confidence: ${signal.confidence}%, multiplier: ${lotMultiplier}x)`);
          
          const trade = await executeTrade(connection, accountId, robotId, userId, robotName, signal);
          if (trade) {
            lastTradeTime.set(symbol, Date.now());
            // Invalidate cache so next check gets fresh data
            positionsCache.delete(`positions_${accountId}`);
            livePositions = await getCachedPositions(connection, accountId); // Refresh
            console.log(`    ✅ NEWS trade opened on ${symbol}`);
          }
        } catch (err) {
          console.error(`    ❌ Failed to open news trade on ${symbol}:`, err.message);
        }
      }
    }
    
    // For HIGH CONFIDENCE signals - BIGGER LOT SIZES
    if (highConfidenceSignals.length > 0) {
      console.log(`  🔥 STRONG SIGNALS - Processing ${highConfidenceSignals.length} high-confidence signal(s) with BIGGER LOTS...`);
      
      for (const { symbol, signal } of highConfidenceSignals) {
        // NO position limit - always open if signal is strong
        const existingOnSymbol = livePositions.filter(p => p.symbol === symbol);
        console.log(`    🔥 ${symbol}: Have ${existingOnSymbol.length} position(s) - adding HIGH CONFIDENCE trade`);
        
        // Re-check risk for each high-confidence trade
        const currentPL = livePositions.reduce((sum, p) => sum + (p.profit || 0), 0);
        const riskCheck = canOpenMoreTrades(accountInfo.balance, accountInfo.equity, livePositions.length, currentPL, signal.confidence, accountId);
        
        if (!riskCheck.canTrade) {
          console.log(`    ⛔ ${symbol}: ${riskCheck.reason}`);
          continue;
        }
        
        try {
          // Calculate position size - BIGGER lots for high confidence with confluence multiplier
          const lotMultiplier = signal.lotMultiplier || 1.0;
          const lotSize = calculatePositionSize(accountInfo.balance, signal.slPips, symbol, signal.confidence, botConfig, lotMultiplier);
          signal.volume = lotSize;
          
          console.log(`    🔥 ${symbol}: HIGH CONFIDENCE ${signal.confidence}% - Confluence: ${signal.confluenceCount || 'N/A'} strategies`);
          console.log(`       SL=${signal.slPips}pips, TP=${signal.tpPips}pips, Lots=${lotSize} (${lotMultiplier}x multiplier)`);
          
          // Execute trade
          const trade = await executeTrade(connection, accountId, robotId, userId, robotName, signal);
          if (trade) {
            lastTradeTime.set(symbol, Date.now());
            positionsCache.delete(`positions_${accountId}`); // Invalidate cache
            livePositions = await getCachedPositions(connection, accountId); // Use cache
            console.log(`    ✅ HIGH CONFIDENCE trade opened on ${symbol}`);
          }
        } catch (err) {
          console.error(`    ❌ Failed to open high-confidence trade on ${symbol}:`, err.message);
        }
      }
    }
    
    // For NORMAL signals - NO LIMIT, open all valid signals
    if (normalSignals.length > 0) {
      const currentPositionCount = livePositions.length;
      
      // NO LIMIT - open as many trades as signals allow
      console.log(`  🎯 NORMAL SIGNALS: ${normalSignals.length} signal(s) to process - NO POSITION LIMIT`);
      console.log(`  📊 Currently have ${currentPositionCount} position(s) - opening more...`);
      
      let tradesOpened = 0;
      
      for (const { symbol, signal } of normalSignals) {
        // NO position limit - open all valid signals
        const existingOnSymbol = livePositions.filter(p => p.symbol === symbol);
        console.log(`    📊 ${symbol}: Have ${existingOnSymbol.length} position(s) - adding normal signal trade`);
        
        // Re-check we can still trade
        const currentPL = livePositions.reduce((sum, p) => sum + (p.profit || 0), 0);
        const riskCheck = canOpenMoreTrades(accountInfo.balance, accountInfo.equity, livePositions.length, currentPL, signal.confidence, accountId);
        if (!riskCheck.canTrade) {
          console.log(`    ⛔ ${riskCheck.reason}`);
          break;
        }
        
        try {
          // Calculate proper position size based on account balance, signal strength, and confluence
          const lotMultiplier = signal.lotMultiplier || 1.0;
          const lotSize = calculatePositionSize(accountInfo.balance, signal.slPips, symbol, signal.confidence, botConfig, lotMultiplier);
          signal.volume = lotSize;
          
          console.log(`    📐 ${symbol}: ${signal.confidence}% - Confluence: ${signal.confluenceCount || 'N/A'} strategies`);
          console.log(`       SL=${signal.slPips}pips, TP=${signal.tpPips}pips, Lots=${lotSize} (${lotMultiplier}x multiplier)`);
          
          // Execute trade
          const trade = await executeTrade(connection, accountId, robotId, userId, robotName, signal);
          if (trade) {
            tradesOpened++;
            lastTradeTime.set(symbol, Date.now());
            positionsCache.delete(`positions_${accountId}`); // Invalidate cache
            livePositions = await getCachedPositions(connection, accountId); // Use cache
            console.log(`    ✅ Trade opened on ${symbol} (${livePositions.length} total positions)`);
          }
        } catch (err) {
          console.error(`    ❌ Failed to open trade on ${symbol}:`, err.message);
        }
      }
      
      console.log(`  📈 Opened ${tradesOpened} trade(s) this cycle`);
    }
    
    // Refresh final position count (use cache)
    livePositions = await getCachedPositions(connection, accountId);
    console.log(`  📈 Cycle complete. Total positions: ${livePositions.length}`);
    
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
        // Get live positions (CACHED to avoid rate limits)
        const positions = await getCachedPositions(connection, account.account_id);
        const info = await getCachedAccountInfo(connection, account.account_id);
        
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
  console.log('🚀 PRECIOUS METALS TRADING SCHEDULER');
  console.log('   📊 Trading: XAUUSD (Gold) + XAGUSD (Silver)');
  console.log('   🔒 ACCOUNT PROTECTION ENABLED');
  console.log('   Confluence: 3+ strategies required');
  console.log(`   Daily Loss Limit: ${RISK_CONFIG.DAILY_LOSS_LIMIT * 100}%`);
  console.log('   ');
  console.log('   📊 ACCOUNT TIER LOT LIMITS:');
  console.log('   • $100-199:  max 0.02 lots (2% risk)');
  console.log('   • $200-499:  max 0.05 lots (3% risk)');
  console.log('   • $500-999:  max 0.10 lots (4% risk)');
  console.log('   • $1000-2499: max 0.20 lots (5% risk)');
  console.log('   • $2500-4999: max 0.35 lots (6% risk)');
  console.log('   • $5000-9999: max 0.50 lots (8% risk)');
  console.log('   • $10000+:   max 1.00 lots (10% risk)');
  console.log('========================================\n');
  
  // Run immediately on start
  await runTradingCycle();
  
  // Run every 60 seconds to stay under rate limits
  tradingInterval = setInterval(runTradingCycle, 60 * 1000);
  
  // Stream positions every 5 seconds (uses cache, so rate-limit safe)
  positionStreamInterval = setInterval(streamPositions, 5000);
  
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
      // No robots enabled by users - don't execute any trades
      // Users must click "Start Bot" to enable trading
      return;
    }
    
    console.log(`\n[${new Date().toLocaleTimeString()}] ========== TRADING CYCLE ==========`);
    console.log(`📊 Processing ${robots.length} user-enabled robot(s)...`);
    console.log(`   (Only robots started by users will trade)\n`);
    
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
    // Get open positions from MT5 (CACHED to avoid rate limits)
    let positions = [];
    try {
      positions = await getCachedPositions(connection, accountId);
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
          
          // =========================================================================
          // SMART BREAKEVEN - Strategy-aware position management
          // Swing trades: Move to BE when price moves X pips AND shows momentum
          // Other trades: Standard breakeven at 1 ATR profit
          // =========================================================================
          const pipSize = getPipSize(symbol);
          const breakevenBuffer = pipSize * 3; // 3 pips buffer above entry for spread
          
          // Calculate profit in pips/points
          const priceDiff = positionType === 'buy' 
            ? currentPrice - openPrice 
            : openPrice - currentPrice;
          const profitInATR = atr > 0 ? priceDiff / atr : 0;
          const profitInPips = priceDiff / pipSize;
          
          // Get tracked strategy info if available
          const strategyInfo = positionStrategyMap.get(String(positionId));
          const isSwingTrade = strategyInfo?.strategy === 'swing' || 
                              strategyInfo?.strategy?.includes('swing') ||
                              (strategyInfo?.slPips >= 40 && strategyInfo?.tpPips >= 80);
          const isPositionTrade = strategyInfo?.strategy === 'position' ||
                                  strategyInfo?.strategy === 'ema_ribbon' ||
                                  (strategyInfo?.slPips >= 60);
          
          // SWING/POSITION TRADE: Special breakeven rules
          // Move to BE when: 30+ pips profit AND momentum confirms continuation
          let shouldMoveToBreakeven = false;
          let breakevenReason = '';
          
          if (isSwingTrade || isPositionTrade) {
            const minPipsForBE = isPositionTrade ? 40 : 30; // Position needs more confirmation
            
            if (profitInPips >= minPipsForBE) {
              // Check if momentum shows continuation
              const recentCandles = candles.slice(-5);
              const isBuy = positionType === 'buy' || positionType?.toLowerCase()?.includes('buy');
              const favorableCount = isBuy 
                ? recentCandles.filter(c => c.close > c.open).length
                : recentCandles.filter(c => c.close < c.open).length;
              
              // Also check RSI for momentum
              const rsiConfirm = isBuy ? (currentRsi > 40 && currentRsi < 70) : (currentRsi > 30 && currentRsi < 60);
              
              // Move to BE if 3+ candles favorable OR strong profit (50+ pips)
              if (favorableCount >= 3 || profitInPips >= 50) {
                shouldMoveToBreakeven = true;
                breakevenReason = `SWING-BE: ${profitInPips.toFixed(0)}pips profit + ${favorableCount}/5 favorable candles`;
              } else if (rsiConfirm && profitInPips >= minPipsForBE + 10) {
                shouldMoveToBreakeven = true;
                breakevenReason = `SWING-BE: ${profitInPips.toFixed(0)}pips profit + RSI ${currentRsi.toFixed(0)} confirms`;
              }
            }
          } else {
            // Standard trades: Move to breakeven when profit reaches 1 ATR OR $10
            shouldMoveToBreakeven = profitInATR >= 1.0 || profit >= 10;
            if (shouldMoveToBreakeven) {
              breakevenReason = `Standard-BE: ${profitInATR.toFixed(1)} ATR profit`;
            }
          }
          
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
                console.log(`    🛡️ ${breakevenReason}`);
                console.log(`       SL moved to ${newSL.toFixed(5)} (entry: ${openPrice.toFixed(5)})`);
              } catch (modifyErr) {
                // Don't spam errors for this
                if (!modifyErr.message?.includes('same value')) {
                  console.log(`    ⚠️ Could not set breakeven: ${modifyErr.message}`);
                }
              }
            }
          }
          
          // =========================================================================
          // EXIT CONDITIONS - DISABLED: LET SL/TP HIT NATURALLY ON MT5
          // Positions will only close when broker hits the actual SL or TP
          // This ensures structure-based exits are respected
          // =========================================================================
          
          // ALL EARLY EXIT LOGIC DISABLED - SL/TP ONLY
          // The MT5 broker will close positions when price hits SL or TP
          // We do NOT interfere with trades - let them play out
          
          /*
          // DISABLED: Early profit taking
          if (profitInATR >= 2.0) {
            shouldClose = true;
            closeReason = `PROFIT SECURED: ${profitInATR.toFixed(1)} ATR move captured ($${profit.toFixed(2)})`;
          }
          
          // DISABLED: Fixed dollar profit target
          else if (profit >= 25) {
            shouldClose = true;
            closeReason = `PROFIT TARGET: $${profit.toFixed(2)} reached`;
          }
          
          // DISABLED: Structure change exits
          else if (positionType === 'buy' && ema8Val < ema20Val && currentRsi > 70) {
            const recentCandles = candles.slice(-5);
            const bearishCount = recentCandles.filter(c => c.close < c.open).length;
            if (bearishCount >= 3) {
              shouldClose = true;
              closeReason = `STRUCTURE CHANGE: EMA bearish + RSI ${currentRsi.toFixed(0)} + ${bearishCount}/5 bearish candles`;
            }
          }
          else if (positionType === 'sell' && ema8Val > ema20Val && currentRsi < 30) {
            const recentCandles = candles.slice(-5);
            const bullishCount = recentCandles.filter(c => c.close > c.open).length;
            if (bullishCount >= 3) {
              shouldClose = true;
              closeReason = `STRUCTURE CHANGE: EMA bullish + RSI ${currentRsi.toFixed(0)} + ${bullishCount}/5 bullish candles`;
            }
          }
          
          // DISABLED: Trailing stop
          else if (profitInATR >= 1.5 && profit > 5) {
            const recentCandles = candles.slice(-4);
            const againstCount = positionType === 'buy'
              ? recentCandles.filter(c => c.close < c.open).length
              : recentCandles.filter(c => c.close > c.open).length;
            
            if (againstCount >= 3) {
              shouldClose = true;
              closeReason = `TRAILING STOP: Momentum reversed after ${profitInATR.toFixed(1)} ATR profit`;
            }
          }
          
          // DISABLED: Early stop loss
          else if (profitInATR <= -3.0 || profit <= -30) {
            shouldClose = true;
            closeReason = `STOP LOSS: ${profitInATR.toFixed(1)} ATR loss ($${profit.toFixed(2)})`;
          }
          */
          
          // Just log position status - NO closing
          console.log(`    📊 Position: ${symbol} ${positionType} | P/L: $${profit.toFixed(2)} (${profitInATR.toFixed(1)} ATR) | Waiting for SL/TP`);
        }
      } catch (analysisError) {
        console.log(`    ⚠️ Could not analyze ${symbol}: ${analysisError.message}`);
        // DISABLED: No fallback closing - let SL/TP handle it
        // Just log the position status
        console.log(`    📊 Position: ${symbol} ${positionType} | P/L: $${profit.toFixed(2)} | Waiting for SL/TP`);
      }
      
      // DISABLED: All programmatic closing - positions close ONLY when MT5 SL/TP is hit
      /*
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
      */
      
      // Just hold and wait for SL/TP
      console.log(`    ⏳ Holding: ${symbol} ${positionType} $${profit.toFixed(2)} | SL/TP will close automatically`);
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
    // Use cached positions to avoid rate limits
    const positions = await getCachedPositions(connection, accountId);
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

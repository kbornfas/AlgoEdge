/**
 * AlgoEdge Intelligent Trading Strategy Service
 * Prioritizes most traded & profitable pairs with smart entry/exit logic
 */

// ============================================================================
// PRIORITIZED TRADING PAIRS (Most Profitable & Liquid)
// ============================================================================

// Tier 1: Highest Priority - Most Profitable (Gold, Major Forex)
export const TIER1_PAIRS = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY'];

// Tier 2: High Priority - High Volume Pairs
export const TIER2_PAIRS = ['GBPJPY', 'EURJPY', 'AUDUSD', 'USDCHF', 'XAGUSD'];

// Tier 3: Standard Priority - Other Majors
export const TIER3_PAIRS = ['USDCAD', 'NZDUSD', 'EURGBP', 'EURAUD', 'AUDJPY'];

// Combined with priority order
export const TRADING_PAIRS = [...TIER1_PAIRS, ...TIER2_PAIRS, ...TIER3_PAIRS];

// Pair-specific configurations for optimal trading
export const PAIR_CONFIG: Record<string, {
  pipValue: number;
  minSpread: number;
  volatilityMultiplier: number;
  profitPotential: number; // 1-10 scale
  bestSession: string[];
}> = {
  'XAUUSD': { pipValue: 1, minSpread: 30, volatilityMultiplier: 2.5, profitPotential: 10, bestSession: ['London', 'NewYork'] },
  'EURUSD': { pipValue: 10, minSpread: 1, volatilityMultiplier: 1.0, profitPotential: 8, bestSession: ['London', 'NewYork'] },
  'GBPUSD': { pipValue: 10, minSpread: 2, volatilityMultiplier: 1.3, profitPotential: 9, bestSession: ['London', 'NewYork'] },
  'USDJPY': { pipValue: 7, minSpread: 1, volatilityMultiplier: 1.1, profitPotential: 8, bestSession: ['Tokyo', 'London'] },
  'GBPJPY': { pipValue: 7, minSpread: 3, volatilityMultiplier: 1.8, profitPotential: 9, bestSession: ['London', 'Tokyo'] },
  'EURJPY': { pipValue: 7, minSpread: 2, volatilityMultiplier: 1.4, profitPotential: 8, bestSession: ['London', 'Tokyo'] },
  'AUDUSD': { pipValue: 10, minSpread: 1, volatilityMultiplier: 1.2, profitPotential: 7, bestSession: ['Sydney', 'Tokyo'] },
  'USDCHF': { pipValue: 10, minSpread: 2, volatilityMultiplier: 1.0, profitPotential: 7, bestSession: ['London'] },
  'XAGUSD': { pipValue: 50, minSpread: 20, volatilityMultiplier: 2.0, profitPotential: 8, bestSession: ['London', 'NewYork'] },
  'USDCAD': { pipValue: 10, minSpread: 2, volatilityMultiplier: 1.1, profitPotential: 7, bestSession: ['NewYork'] },
  'NZDUSD': { pipValue: 10, minSpread: 2, volatilityMultiplier: 1.2, profitPotential: 6, bestSession: ['Sydney', 'Tokyo'] },
  'EURGBP': { pipValue: 10, minSpread: 2, volatilityMultiplier: 0.8, profitPotential: 6, bestSession: ['London'] },
  'EURAUD': { pipValue: 10, minSpread: 3, volatilityMultiplier: 1.4, profitPotential: 7, bestSession: ['Sydney', 'London'] },
  'AUDJPY': { pipValue: 7, minSpread: 2, volatilityMultiplier: 1.3, profitPotential: 7, bestSession: ['Sydney', 'Tokyo'] },
};

// ============================================================================
// INTERFACES
// ============================================================================

export interface TradingSignal {
  symbol: string;
  type: 'BUY' | 'SELL';
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  takeProfit2?: number; // Secondary TP for scaling out
  takeProfit3?: number; // Third TP for runners
  trailingStop?: number;
  reason: string;
  priority: number; // Higher = more important
  expectedProfit: number;
  riskRewardRatio: number;
  indicators: {
    rsi: number;
    macd: { value: number; signal: number; histogram: number };
    ema20: number;
    ema50: number;
    ema200: number;
    atr: number;
    adx: number;
    bollingerBands: { upper: number; middle: number; lower: number };
    support: number;
    resistance: number;
    trendStrength: number;
  };
}

export interface CandleData {
  time: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketCondition {
  trend: 'STRONG_UP' | 'UP' | 'SIDEWAYS' | 'DOWN' | 'STRONG_DOWN';
  volatility: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  momentum: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
  session: 'ASIAN' | 'LONDON' | 'NEWYORK' | 'OVERLAP';
}

// ============================================================================
// TECHNICAL INDICATORS
// ============================================================================

/**
 * Calculate RSI with smoothing
 */
export function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;

  let avgGain = 0;
  let avgLoss = 0;

  // Initial averages
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) avgGain += change;
    else avgLoss -= change;
  }
  avgGain /= period;
  avgLoss /= period;

  // Smoothed RSI calculation
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) - change) / period;
    }
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/**
 * Calculate EMA (Exponential Moving Average)
 */
export function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];

  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }

  return ema;
}

/**
 * Calculate SMA (Simple Moving Average)
 */
export function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

/**
 * Calculate MACD with signal line
 */
export function calculateMACD(prices: number[]): { value: number; signal: number; histogram: number } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12 - ema26;

  // Calculate signal line (9-period EMA of MACD)
  const macdHistory: number[] = [];
  for (let i = 26; i < prices.length; i++) {
    const tempEma12 = calculateEMA(prices.slice(0, i + 1), 12);
    const tempEma26 = calculateEMA(prices.slice(0, i + 1), 26);
    macdHistory.push(tempEma12 - tempEma26);
  }

  const signalLine = macdHistory.length >= 9 ? calculateEMA(macdHistory, 9) : macdLine;
  const histogram = macdLine - signalLine;

  return { value: macdLine, signal: signalLine, histogram };
}

/**
 * Calculate ATR (Average True Range)
 */
export function calculateATR(candles: CandleData[], period: number = 14): number {
  if (candles.length < period + 1) return 0;

  const trueRanges: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }

  // EMA-based ATR for smoother values
  return calculateEMA(trueRanges, period);
}

/**
 * Calculate ADX (Average Directional Index) - Trend Strength
 */
export function calculateADX(candles: CandleData[], period: number = 14): number {
  if (candles.length < period * 2) return 25;

  const plusDM: number[] = [];
  const minusDM: number[] = [];
  const trueRanges: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const highDiff = candles[i].high - candles[i - 1].high;
    const lowDiff = candles[i - 1].low - candles[i].low;

    plusDM.push(highDiff > lowDiff && highDiff > 0 ? highDiff : 0);
    minusDM.push(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0);

    const tr = Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close)
    );
    trueRanges.push(tr);
  }

  const smoothedPlusDM = calculateEMA(plusDM, period);
  const smoothedMinusDM = calculateEMA(minusDM, period);
  const smoothedTR = calculateEMA(trueRanges, period);

  const plusDI = (smoothedPlusDM / smoothedTR) * 100;
  const minusDI = (smoothedMinusDM / smoothedTR) * 100;

  const dx = Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100;

  return dx;
}

/**
 * Calculate Bollinger Bands
 */
export function calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): { upper: number; middle: number; lower: number } {
  if (prices.length < period) {
    const middle = prices[prices.length - 1];
    return { upper: middle, middle, lower: middle };
  }

  const slice = prices.slice(-period);
  const middle = slice.reduce((a, b) => a + b, 0) / period;

  const variance = slice.reduce((sum, price) => sum + Math.pow(price - middle, 2), 0) / period;
  const standardDeviation = Math.sqrt(variance);

  return {
    upper: middle + (stdDev * standardDeviation),
    middle,
    lower: middle - (stdDev * standardDeviation),
  };
}

/**
 * Find Support and Resistance levels
 */
export function findSupportResistance(candles: CandleData[], lookback: number = 50): { support: number; resistance: number } {
  const recentCandles = candles.slice(-lookback);

  const highs = recentCandles.map(c => c.high);
  const lows = recentCandles.map(c => c.low);

  // Find swing highs and lows
  const swingHighs: number[] = [];
  const swingLows: number[] = [];

  for (let i = 2; i < recentCandles.length - 2; i++) {
    const high = recentCandles[i].high;
    const low = recentCandles[i].low;

    if (high > recentCandles[i - 1].high && high > recentCandles[i - 2].high &&
        high > recentCandles[i + 1].high && high > recentCandles[i + 2].high) {
      swingHighs.push(high);
    }

    if (low < recentCandles[i - 1].low && low < recentCandles[i - 2].low &&
        low < recentCandles[i + 1].low && low < recentCandles[i + 2].low) {
      swingLows.push(low);
    }
  }

  const resistance = swingHighs.length > 0 ? Math.max(...swingHighs) : Math.max(...highs);
  const support = swingLows.length > 0 ? Math.min(...swingLows) : Math.min(...lows);

  return { support, resistance };
}

/**
 * Determine current market condition
 */
export function getMarketCondition(candles: CandleData[], indicators: any): MarketCondition {
  const { ema20, ema50, ema200, atr, adx, rsi } = indicators;
  const currentPrice = candles[candles.length - 1].close;

  // Trend determination
  let trend: MarketCondition['trend'];
  if (ema20 > ema50 && ema50 > ema200 && currentPrice > ema20) {
    trend = adx > 40 ? 'STRONG_UP' : 'UP';
  } else if (ema20 < ema50 && ema50 < ema200 && currentPrice < ema20) {
    trend = adx > 40 ? 'STRONG_DOWN' : 'DOWN';
  } else {
    trend = 'SIDEWAYS';
  }

  // Volatility determination based on ATR
  const avgPrice = candles.slice(-20).reduce((sum, c) => sum + c.close, 0) / 20;
  const atrPercent = (atr / avgPrice) * 100;

  let volatility: MarketCondition['volatility'];
  if (atrPercent > 2) volatility = 'EXTREME';
  else if (atrPercent > 1) volatility = 'HIGH';
  else if (atrPercent > 0.5) volatility = 'MEDIUM';
  else volatility = 'LOW';

  // Momentum
  let momentum: MarketCondition['momentum'];
  if (rsi > 60) momentum = 'BULLISH';
  else if (rsi < 40) momentum = 'BEARISH';
  else momentum = 'NEUTRAL';

  // Trading session (UTC-based)
  const hour = new Date().getUTCHours();
  let session: MarketCondition['session'];
  if (hour >= 0 && hour < 8) session = 'ASIAN';
  else if (hour >= 8 && hour < 13) session = 'LONDON';
  else if (hour >= 13 && hour < 17) session = 'OVERLAP';
  else session = 'NEWYORK';

  return { trend, volatility, momentum, session };
}

// ============================================================================
// AGGRESSIVE SCALPER MODE - For M1/M5 timeframes
// ============================================================================

/**
 * AGGRESSIVE SCALPER - Designed for M1 timeframe
 * Lower confidence threshold, faster entries, tighter stops
 */
export function analyzeMarketScalper(symbol: string, candles: CandleData[]): TradingSignal | null {
  if (candles.length < 30) return null; // Minimal data needed for fast scalping

  const closePrices = candles.map(c => c.close);
  const currentPrice = closePrices[closePrices.length - 1];
  const pairConfig = PAIR_CONFIG[symbol] || { pipValue: 10, minSpread: 2, volatilityMultiplier: 1, profitPotential: 5, bestSession: ['London'] };

  // Calculate indicators with shorter periods for scalping
  const rsi = calculateRSI(closePrices, 7); // Faster RSI
  const macd = calculateMACD(closePrices);
  const ema8 = calculateEMA(closePrices, 8);
  const ema20 = calculateEMA(closePrices, 20);
  const ema50 = closePrices.length >= 50 ? calculateEMA(closePrices, 50) : ema20;
  const atr = calculateATR(candles, 7); // Faster ATR
  const bollingerBands = calculateBollingerBands(closePrices, 14, 2);

  // Quick momentum check from last 5 candles
  const recentCandles = candles.slice(-5);
  const bullishCandles = recentCandles.filter(c => c.close > c.open).length;
  const bearishCandles = recentCandles.filter(c => c.close < c.open).length;

  let buyScore = 0;
  let sellScore = 0;
  const buyReasons: string[] = [];
  const sellReasons: string[] = [];

  // SCALPER SCORING - Quick Entry Signals

  // 1. MOMENTUM (Max 35 points) - Most important for scalping
  if (bullishCandles >= 4) {
    buyScore += 35;
    buyReasons.push('Strong bullish momentum');
  } else if (bullishCandles >= 3) {
    buyScore += 25;
    buyReasons.push('Bullish momentum');
  } else if (bullishCandles >= 2) {
    buyScore += 15;
    buyReasons.push('Slight bullish bias');
  }
  if (bearishCandles >= 4) {
    sellScore += 35;
    sellReasons.push('Strong bearish momentum');
  } else if (bearishCandles >= 3) {
    sellScore += 25;
    sellReasons.push('Bearish momentum');
  } else if (bearishCandles >= 2) {
    sellScore += 15;
    sellReasons.push('Slight bearish bias');
  }

  // 2. FAST EMA POSITIONING (Max 25 points)
  if (currentPrice > ema8 && ema8 > ema20) {
    buyScore += 25;
    buyReasons.push('Above fast EMAs');
  } else if (currentPrice > ema8) {
    buyScore += 15;
    buyReasons.push('Above EMA8');
  }
  if (currentPrice < ema8 && ema8 < ema20) {
    sellScore += 25;
    sellReasons.push('Below fast EMAs');
  } else if (currentPrice < ema8) {
    sellScore += 15;
    sellReasons.push('Below EMA8');
  }

  // 3. RSI - Quick Reversals (Max 25 points)
  if (rsi < 25) {
    buyScore += 25;
    buyReasons.push(`RSI very oversold (${rsi.toFixed(0)})`);
  } else if (rsi < 35) {
    buyScore += 20;
    buyReasons.push(`RSI oversold (${rsi.toFixed(0)})`);
  } else if (rsi < 45 && bullishCandles >= 2) {
    buyScore += 10;
    buyReasons.push(`RSI recovering`);
  }
  if (rsi > 75) {
    sellScore += 25;
    sellReasons.push(`RSI very overbought (${rsi.toFixed(0)})`);
  } else if (rsi > 65) {
    sellScore += 20;
    sellReasons.push(`RSI overbought (${rsi.toFixed(0)})`);
  } else if (rsi > 55 && bearishCandles >= 2) {
    sellScore += 10;
    sellReasons.push(`RSI weakening`);
  }

  // 4. BOLLINGER BAND TOUCHES (Max 20 points) - Great for scalping
  const bbRange = bollingerBands.upper - bollingerBands.lower;
  if (currentPrice <= bollingerBands.lower + (bbRange * 0.1)) {
    buyScore += 20;
    buyReasons.push('Near lower BB');
  }
  if (currentPrice >= bollingerBands.upper - (bbRange * 0.1)) {
    sellScore += 20;
    sellReasons.push('Near upper BB');
  }

  // 5. MACD Quick Cross (Max 15 points)
  if (macd.histogram > 0) {
    buyScore += 15;
    buyReasons.push('MACD+');
  } else if (macd.histogram < 0) {
    sellScore += 15;
    sellReasons.push('MACD-');
  }

  // 6. Price Action - Candle size (Max 15 points)
  const lastCandle = candles[candles.length - 1];
  const candleBody = Math.abs(lastCandle.close - lastCandle.open);
  const avgBody = candles.slice(-10).reduce((sum, c) => sum + Math.abs(c.close - c.open), 0) / 10;
  
  if (lastCandle.close > lastCandle.open && candleBody > avgBody * 1.5) {
    buyScore += 15;
    buyReasons.push('Strong bullish candle');
  }
  if (lastCandle.close < lastCandle.open && candleBody > avgBody * 1.5) {
    sellScore += 15;
    sellReasons.push('Strong bearish candle');
  }

  const buyConfidence = Math.min(buyScore, 100);
  const sellConfidence = Math.min(sellScore, 100);
  const basePriority = TIER1_PAIRS.includes(symbol) ? 100 : TIER2_PAIRS.includes(symbol) ? 75 : 50;

  // SCALPER THRESHOLD: Only 30% needed - VERY aggressive!
  const SCALPER_THRESHOLD = 30;

  const indicators = {
    rsi,
    macd,
    ema20: ema8,
    ema50: ema20,
    ema200: ema50,
    atr,
    adx: 0,
    bollingerBands,
    support: currentPrice - (atr * 2),
    resistance: currentPrice + (atr * 2),
    trendStrength: Math.max(buyConfidence, sellConfidence),
  };

  // Generate BUY signal
  if (buyConfidence >= SCALPER_THRESHOLD && buyConfidence > sellConfidence + 5) {
    // SCALPER STOPS: Tight, based on ATR
    const stopLoss = currentPrice - (atr * 1.2 * pairConfig.volatilityMultiplier);
    const riskAmount = currentPrice - stopLoss;
    const takeProfit = currentPrice + (riskAmount * 1.5); // 1.5:1 RR for quick scalps
    const takeProfit2 = currentPrice + (riskAmount * 2.5);

    console.log(`🎯 SCALPER BUY ${symbol}: ${buyConfidence}% - ${buyReasons.join(', ')}`);

    return {
      symbol,
      type: 'BUY',
      confidence: buyConfidence,
      entryPrice: currentPrice,
      stopLoss,
      takeProfit,
      takeProfit2,
      reason: `SCALP: ${buyReasons.join(' | ')}`,
      priority: basePriority + buyConfidence + 50, // Extra priority for scalper
      expectedProfit: 1.5 * (buyConfidence / 100),
      riskRewardRatio: 1.5,
      indicators,
    };
  } 
  
  // Generate SELL signal
  if (sellConfidence >= SCALPER_THRESHOLD && sellConfidence > buyConfidence + 5) {
    const stopLoss = currentPrice + (atr * 1.2 * pairConfig.volatilityMultiplier);
    const riskAmount = stopLoss - currentPrice;
    const takeProfit = currentPrice - (riskAmount * 1.5);
    const takeProfit2 = currentPrice - (riskAmount * 2.5);

    console.log(`🎯 SCALPER SELL ${symbol}: ${sellConfidence}% - ${sellReasons.join(', ')}`);

    return {
      symbol,
      type: 'SELL',
      confidence: sellConfidence,
      entryPrice: currentPrice,
      stopLoss,
      takeProfit,
      takeProfit2,
      reason: `SCALP: ${sellReasons.join(' | ')}`,
      priority: basePriority + sellConfidence + 50,
      expectedProfit: 1.5 * (sellConfidence / 100),
      riskRewardRatio: 1.5,
      indicators,
    };
  }

  return null;
}

// ============================================================================
// INTELLIGENT SIGNAL GENERATION
// ============================================================================

/**
 * Analyze market and generate intelligent trading signal
 * Uses multiple confluence factors for high-probability setups
 */
export function analyzeMarket(symbol: string, candles: CandleData[]): TradingSignal | null {
  if (candles.length < 200) return null;

  const closePrices = candles.map(c => c.close);
  const currentPrice = closePrices[closePrices.length - 1];
  const pairConfig = PAIR_CONFIG[symbol] || { pipValue: 10, minSpread: 2, volatilityMultiplier: 1, profitPotential: 5, bestSession: ['London'] };

  // Calculate all indicators
  const rsi = calculateRSI(closePrices);
  const macd = calculateMACD(closePrices);
  const ema20 = calculateEMA(closePrices, 20);
  const ema50 = calculateEMA(closePrices, 50);
  const ema200 = calculateEMA(closePrices, 200);
  const atr = calculateATR(candles);
  const adx = calculateADX(candles);
  const bollingerBands = calculateBollingerBands(closePrices);
  const { support, resistance } = findSupportResistance(candles);

  // Calculate trend strength (0-100)
  const trendStrength = Math.min(100, adx * 2);

  const indicators = {
    rsi,
    macd,
    ema20,
    ema50,
    ema200,
    atr,
    adx,
    bollingerBands,
    support,
    resistance,
    trendStrength,
  };

  // Get market condition
  const marketCondition = getMarketCondition(candles, indicators);

  // Score-based confluence system
  let buyScore = 0;
  let sellScore = 0;
  const buyReasons: string[] = [];
  const sellReasons: string[] = [];

  // ============================================================================
  // SCORING SYSTEM - Multiple Confluence Factors
  // ============================================================================

  // 1. TREND ALIGNMENT (Max 25 points)
  if (marketCondition.trend === 'STRONG_UP') {
    buyScore += 25;
    buyReasons.push('Strong uptrend');
  } else if (marketCondition.trend === 'UP') {
    buyScore += 15;
    buyReasons.push('Uptrend');
  } else if (marketCondition.trend === 'STRONG_DOWN') {
    sellScore += 25;
    sellReasons.push('Strong downtrend');
  } else if (marketCondition.trend === 'DOWN') {
    sellScore += 15;
    sellReasons.push('Downtrend');
  }

  // 2. EMA POSITIONING (Max 15 points)
  if (currentPrice > ema20 && ema20 > ema50) {
    buyScore += 15;
    buyReasons.push('Price above EMAs');
  } else if (currentPrice < ema20 && ema20 < ema50) {
    sellScore += 15;
    sellReasons.push('Price below EMAs');
  }

  // 3. RSI SIGNALS (Max 20 points)
  if (rsi < 25) {
    buyScore += 20;
    buyReasons.push(`RSI extremely oversold (${rsi.toFixed(1)})`);
  } else if (rsi < 35 && rsi > 25) {
    buyScore += 15;
    buyReasons.push(`RSI oversold (${rsi.toFixed(1)})`);
  } else if (rsi > 75) {
    sellScore += 20;
    sellReasons.push(`RSI extremely overbought (${rsi.toFixed(1)})`);
  } else if (rsi > 65 && rsi < 75) {
    sellScore += 15;
    sellReasons.push(`RSI overbought (${rsi.toFixed(1)})`);
  }

  // 4. MACD CROSSOVER (Max 15 points)
  if (macd.histogram > 0 && macd.value > macd.signal) {
    buyScore += 15;
    buyReasons.push('MACD bullish');
  } else if (macd.histogram < 0 && macd.value < macd.signal) {
    sellScore += 15;
    sellReasons.push('MACD bearish');
  }

  // 5. BOLLINGER BAND TOUCHES (Max 15 points)
  const bbRange = bollingerBands.upper - bollingerBands.lower;
  const bbLowerZone = bollingerBands.lower + bbRange * 0.1;
  const bbUpperZone = bollingerBands.upper - bbRange * 0.1;

  if (currentPrice <= bbLowerZone) {
    buyScore += 15;
    buyReasons.push('Price at lower BB');
  } else if (currentPrice >= bbUpperZone) {
    sellScore += 15;
    sellReasons.push('Price at upper BB');
  }

  // 6. SUPPORT/RESISTANCE (Max 15 points)
  const srBuffer = atr * 0.5;
  if (currentPrice <= support + srBuffer) {
    buyScore += 15;
    buyReasons.push('Near support level');
  } else if (currentPrice >= resistance - srBuffer) {
    sellScore += 15;
    sellReasons.push('Near resistance level');
  }

  // 7. MOMENTUM CONFIRMATION (Max 10 points)
  if (marketCondition.momentum === 'BULLISH' && buyScore > sellScore) {
    buyScore += 10;
    buyReasons.push('Momentum confirmed');
  } else if (marketCondition.momentum === 'BEARISH' && sellScore > buyScore) {
    sellScore += 10;
    sellReasons.push('Momentum confirmed');
  }

  // 8. VOLUME SPIKE (Max 5 points)
  const recentVolume = candles.slice(-5).reduce((sum, c) => sum + c.volume, 0) / 5;
  const avgVolume = candles.slice(-20).reduce((sum, c) => sum + c.volume, 0) / 20;
  if (recentVolume > avgVolume * 1.5) {
    buyScore += 5;
    sellScore += 5;
  }

  // ============================================================================
  // SIGNAL GENERATION
  // ============================================================================

  const buyConfidence = Math.min(buyScore, 100);
  const sellConfidence = Math.min(sellScore, 100);

  // Priority based on pair profitability
  const basePriority = TIER1_PAIRS.includes(symbol) ? 100 : TIER2_PAIRS.includes(symbol) ? 75 : 50;

  // CAPITAL PROTECTION: Minimum 50% confidence required
  // This ensures we only trade when multiple indicators align
  const CONFIDENCE_THRESHOLD = 50;

  if (buyConfidence >= CONFIDENCE_THRESHOLD && buyConfidence > sellConfidence) {
    // INTELLIGENT STOP LOSS & TAKE PROFIT
    const volatilityAdjustedATR = atr * pairConfig.volatilityMultiplier;

    // Dynamic SL based on support and ATR
    const slFromSupport = support - (atr * 0.5);
    const slFromATR = currentPrice - (volatilityAdjustedATR * 1.5);
    const stopLoss = Math.max(slFromSupport, slFromATR);

    // Multiple take profit levels (1.5:1, 2:1, 3:1 RR)
    const riskAmount = currentPrice - stopLoss;
    const takeProfit = currentPrice + (riskAmount * 1.5);
    const takeProfit2 = currentPrice + (riskAmount * 2);
    const takeProfit3 = currentPrice + (riskAmount * 3);

    // Trailing stop (starts at 1:1 profit)
    const trailingStop = riskAmount;

    const riskRewardRatio = (takeProfit - currentPrice) / (currentPrice - stopLoss);
    const expectedProfit = riskRewardRatio * (buyConfidence / 100);

    return {
      symbol,
      type: 'BUY',
      confidence: buyConfidence,
      entryPrice: currentPrice,
      stopLoss,
      takeProfit,
      takeProfit2,
      takeProfit3,
      trailingStop,
      reason: buyReasons.join(' | '),
      priority: basePriority + buyConfidence,
      expectedProfit,
      riskRewardRatio,
      indicators,
    };
  } else if (sellConfidence >= 70 && sellConfidence > buyConfidence) {
    const volatilityAdjustedATR = atr * pairConfig.volatilityMultiplier;

    // Dynamic SL based on resistance and ATR
    const slFromResistance = resistance + (atr * 0.5);
    const slFromATR = currentPrice + (volatilityAdjustedATR * 1.5);
    const stopLoss = Math.min(slFromResistance, slFromATR);

    // Multiple take profit levels
    const riskAmount = stopLoss - currentPrice;
    const takeProfit = currentPrice - (riskAmount * 1.5);
    const takeProfit2 = currentPrice - (riskAmount * 2);
    const takeProfit3 = currentPrice - (riskAmount * 3);

    const trailingStop = riskAmount;

    const riskRewardRatio = (currentPrice - takeProfit) / (stopLoss - currentPrice);
    const expectedProfit = riskRewardRatio * (sellConfidence / 100);

    return {
      symbol,
      type: 'SELL',
      confidence: sellConfidence,
      entryPrice: currentPrice,
      stopLoss,
      takeProfit,
      takeProfit2,
      takeProfit3,
      trailingStop,
      reason: sellReasons.join(' | '),
      priority: basePriority + sellConfidence,
      expectedProfit,
      riskRewardRatio,
      indicators,
    };
  }

  // Generate signal at lower confidence (35%+) for deep analysis mode
  // But require clear directional bias - don't trade sideways markets
  const minScore = Math.max(buyConfidence, sellConfidence);
  const scoreDifference = Math.abs(buyConfidence - sellConfidence);
  
  // Only generate if:
  // 1. Minimum 35% confidence
  // 2. Clear directional bias (10+ point difference between buy/sell)
  // 3. Not in extreme volatility (ADX < 50)
  if (minScore >= 35 && scoreDifference >= 10 && adx < 50) {
    const isBuy = buyConfidence > sellConfidence;
    const confidence = isBuy ? buyConfidence : sellConfidence;
    const reasons = isBuy ? buyReasons : sellReasons;
    const volatilityAdjustedATR = atr * pairConfig.volatilityMultiplier;
    
    if (isBuy) {
      // CAPITAL PROTECTION: Use wider stops based on ATR
      const slFromSupport = support - (atr * 0.5);
      const slFromATR = currentPrice - (volatilityAdjustedATR * 2); // 2x ATR for safety
      const stopLoss = Math.max(slFromSupport, slFromATR);
      const riskAmount = currentPrice - stopLoss;
      
      // Ensure minimum 1.5:1 risk/reward
      const takeProfit = currentPrice + (riskAmount * 1.5);
      const takeProfit2 = currentPrice + (riskAmount * 2);
      const takeProfit3 = currentPrice + (riskAmount * 3);
      const trailingStop = riskAmount;
      const riskRewardRatio = riskAmount > 0 ? (takeProfit - currentPrice) / riskAmount : 0;
      
      // Only proceed if risk/reward is acceptable
      if (riskRewardRatio < 1.2) {
        console.log(`📊 ${symbol}: Risk/reward too low (${riskRewardRatio.toFixed(2)}), skipping`);
        return null;
      }
      
      const expectedProfit = riskRewardRatio * (confidence / 100);
      
      console.log(`📊 ${symbol}: BUY signal at ${confidence}% confidence, RR ${riskRewardRatio.toFixed(2)}`);
      return {
        symbol,
        type: 'BUY',
        confidence,
        entryPrice: currentPrice,
        stopLoss,
        takeProfit,
        takeProfit2,
        takeProfit3,
        trailingStop,
        reason: reasons.length > 0 ? reasons.join(' | ') : 'Technical analysis',
        priority: basePriority + confidence,
        expectedProfit,
        riskRewardRatio,
        indicators,
      };
    } else {
      const slFromResistance = resistance + (atr * 0.5);
      const slFromATR = currentPrice + (volatilityAdjustedATR * 2);
      const stopLoss = Math.min(slFromResistance, slFromATR);
      const riskAmount = stopLoss - currentPrice;
      
      const takeProfit = currentPrice - (riskAmount * 1.5);
      const takeProfit2 = currentPrice - (riskAmount * 2);
      const takeProfit3 = currentPrice - (riskAmount * 3);
      const trailingStop = riskAmount;
      const riskRewardRatio = riskAmount > 0 ? (currentPrice - takeProfit) / riskAmount : 0;
      
      if (riskRewardRatio < 1.2) {
        console.log(`📊 ${symbol}: Risk/reward too low (${riskRewardRatio.toFixed(2)}), skipping`);
        return null;
      }
      
      const expectedProfit = riskRewardRatio * (confidence / 100);
      
      console.log(`📊 ${symbol}: SELL signal at ${confidence}% confidence, RR ${riskRewardRatio.toFixed(2)}`);
      return {
        symbol,
        type: 'SELL',
        confidence,
        entryPrice: currentPrice,
        stopLoss,
        takeProfit,
        takeProfit2,
        takeProfit3,
        trailingStop,
        reason: reasons.length > 0 ? reasons.join(' | ') : 'Technical analysis',
        priority: basePriority + confidence,
        expectedProfit,
        riskRewardRatio,
        indicators,
      };
    }
  }
  
  console.log(`📊 ${symbol}: No valid setup - Buy ${buyConfidence}%, Sell ${sellConfidence}%, Diff ${scoreDifference}`);
  return null;
}

/**
 * Analyze multiple pairs and return sorted by priority/profitability
 */
export function analyzeAllPairs(
  pairCandles: Map<string, CandleData[]>
): TradingSignal[] {
  const signals: TradingSignal[] = [];

  // Analyze Tier 1 pairs first (most profitable)
  for (const symbol of TIER1_PAIRS) {
    const candles = pairCandles.get(symbol);
    if (candles) {
      const signal = analyzeMarket(symbol, candles);
      if (signal) signals.push(signal);
    }
  }

  // Then Tier 2
  for (const symbol of TIER2_PAIRS) {
    const candles = pairCandles.get(symbol);
    if (candles) {
      const signal = analyzeMarket(symbol, candles);
      if (signal) signals.push(signal);
    }
  }

  // Then Tier 3
  for (const symbol of TIER3_PAIRS) {
    const candles = pairCandles.get(symbol);
    if (candles) {
      const signal = analyzeMarket(symbol, candles);
      if (signal) signals.push(signal);
    }
  }

  // Sort by priority (highest first), then by expected profit
  return signals.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return b.expectedProfit - a.expectedProfit;
  });
}

// ============================================================================
// POSITION MANAGEMENT - Intelligent Close Logic
// ============================================================================

export interface PositionCloseSignal {
  action: 'CLOSE' | 'PARTIAL_CLOSE' | 'MOVE_SL' | 'HOLD';
  reason: string;
  newStopLoss?: number;
  closePercent?: number; // For partial close
}

/**
 * Analyze whether to close or modify an existing position
 */
export function analyzePositionClose(
  position: {
    symbol: string;
    type: 'BUY' | 'SELL';
    openPrice: number;
    currentPrice: number;
    stopLoss: number;
    takeProfit: number;
    profit: number;
    volume: number;
  },
  candles: CandleData[]
): PositionCloseSignal {
  if (candles.length < 50) {
    return { action: 'HOLD', reason: 'Insufficient data' };
  }

  const closePrices = candles.map(c => c.close);
  const currentPrice = position.currentPrice;
  const atr = calculateATR(candles);
  const rsi = calculateRSI(closePrices);
  const macd = calculateMACD(closePrices);

  const pips = position.type === 'BUY'
    ? currentPrice - position.openPrice
    : position.openPrice - currentPrice;

  const riskAmount = Math.abs(position.openPrice - position.stopLoss);
  const profitInR = pips / riskAmount; // Profit in terms of Risk units

  // ============================================================================
  // INTELLIGENT EXIT RULES
  // ============================================================================

  // 1. TAKE PROFIT at 1.5R - Close 50%
  if (profitInR >= 1.5 && profitInR < 2) {
    return {
      action: 'PARTIAL_CLOSE',
      reason: `TP1 reached (${profitInR.toFixed(2)}R) - Closing 50%`,
      closePercent: 50,
      newStopLoss: position.openPrice, // Move SL to breakeven
    };
  }

  // 2. TAKE PROFIT at 2R - Close another 25%
  if (profitInR >= 2 && profitInR < 3) {
    return {
      action: 'PARTIAL_CLOSE',
      reason: `TP2 reached (${profitInR.toFixed(2)}R) - Closing 25%`,
      closePercent: 25,
      newStopLoss: position.openPrice + (riskAmount * 0.5), // Lock in profit
    };
  }

  // 3. TAKE PROFIT at 3R - Close remaining
  if (profitInR >= 3) {
    return {
      action: 'CLOSE',
      reason: `TP3 reached (${profitInR.toFixed(2)}R) - Full close`,
    };
  }

  // 4. RSI REVERSAL WARNING
  if (position.type === 'BUY' && rsi > 80 && profitInR > 1) {
    return {
      action: 'CLOSE',
      reason: `RSI overbought reversal (${rsi.toFixed(1)}) - Protecting profit`,
    };
  }
  if (position.type === 'SELL' && rsi < 20 && profitInR > 1) {
    return {
      action: 'CLOSE',
      reason: `RSI oversold reversal (${rsi.toFixed(1)}) - Protecting profit`,
    };
  }

  // 5. MACD DIVERGENCE - Exit signal
  if (position.type === 'BUY' && macd.histogram < 0 && macd.value < macd.signal && profitInR > 0.5) {
    return {
      action: 'CLOSE',
      reason: 'MACD bearish divergence - Exiting long',
    };
  }
  if (position.type === 'SELL' && macd.histogram > 0 && macd.value > macd.signal && profitInR > 0.5) {
    return {
      action: 'CLOSE',
      reason: 'MACD bullish divergence - Exiting short',
    };
  }

  // 6. TRAILING STOP - Move SL when in profit
  if (profitInR >= 1) {
    const trailDistance = atr * 1.5;
    let newSL: number;

    if (position.type === 'BUY') {
      newSL = currentPrice - trailDistance;
      if (newSL > position.stopLoss) {
        return {
          action: 'MOVE_SL',
          reason: `Trailing stop to ${newSL.toFixed(5)}`,
          newStopLoss: newSL,
        };
      }
    } else {
      newSL = currentPrice + trailDistance;
      if (newSL < position.stopLoss) {
        return {
          action: 'MOVE_SL',
          reason: `Trailing stop to ${newSL.toFixed(5)}`,
          newStopLoss: newSL,
        };
      }
    }
  }

  // 7. BREAKEVEN - Move SL to entry when in 0.5R profit
  if (profitInR >= 0.5 && profitInR < 1) {
    if (position.type === 'BUY' && position.stopLoss < position.openPrice) {
      return {
        action: 'MOVE_SL',
        reason: 'Moving SL to breakeven',
        newStopLoss: position.openPrice + (atr * 0.1), // Small buffer above entry
      };
    }
    if (position.type === 'SELL' && position.stopLoss > position.openPrice) {
      return {
        action: 'MOVE_SL',
        reason: 'Moving SL to breakeven',
        newStopLoss: position.openPrice - (atr * 0.1),
      };
    }
  }

  return { action: 'HOLD', reason: 'No exit condition met' };
}

// ============================================================================
// POSITION SIZING
// ============================================================================

/**
 * Calculate intelligent position size based on risk management
 */
export function calculatePositionSize(
  balance: number,
  riskPercent: number,
  entryPrice: number,
  stopLoss: number,
  symbol: string = 'EURUSD'
): number {
  const config = PAIR_CONFIG[symbol] || { pipValue: 10 };

  const riskAmount = balance * (riskPercent / 100);
  const stopLossPips = Math.abs(entryPrice - stopLoss);

  // Adjust for different pip values (XAUUSD, JPY pairs, etc.)
  let pipMultiplier = 10000; // Standard forex
  if (symbol.includes('JPY')) pipMultiplier = 100;
  if (symbol === 'XAUUSD') pipMultiplier = 10;
  if (symbol === 'XAGUSD') pipMultiplier = 100;

  const pips = stopLossPips * pipMultiplier;

  if (pips === 0) return 0.01;

  // Calculate lot size
  const lotSize = riskAmount / (pips * config.pipValue);

  // Round to 2 decimal places and ensure within bounds
  const roundedLotSize = Math.round(lotSize * 100) / 100;

  return Math.max(0.01, Math.min(roundedLotSize, 5)); // Min 0.01, Max 5 lots
}

/**
 * Get optimal number of trades based on account size
 */
export function getMaxConcurrentTrades(balance: number): number {
  if (balance < 1000) return 2;
  if (balance < 5000) return 3;
  if (balance < 10000) return 5;
  if (balance < 50000) return 8;
  return 10;
}

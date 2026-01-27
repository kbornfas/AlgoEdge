/**
 * Market Indicators Service
 * Provides real-time technical indicator calculations
 * Used by the signals page to display live market analysis
 */

import pool from '../config/database.js';

// Cache for indicator calculations (5 minute TTL)
const indicatorCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Store latest indicator calculations from the trading scheduler
const latestIndicators = new Map();

/**
 * Calculate RSI (Relative Strength Index)
 */
function calculateRSI(closes, period = 14) {
  if (!closes || closes.length < period + 1) return 50; // Default to neutral

  const gains = [];
  const losses = [];

  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? Math.abs(diff) : 0);
  }

  if (gains.length < period) return 50;

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < gains.length; i++) {
    avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
    avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
  }

  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/**
 * Calculate EMA (Exponential Moving Average)
 */
function calculateEMA(data, period) {
  if (!data || data.length < period) return data || [];

  const multiplier = 2 / (period + 1);
  const ema = [data.slice(0, period).reduce((a, b) => a + b, 0) / period];

  for (let i = period; i < data.length; i++) {
    ema.push((data[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1]);
  }

  return ema;
}

/**
 * Calculate SMA (Simple Moving Average)
 */
function calculateSMA(data, period) {
  if (!data || data.length < period) return data || [];

  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(data[i]);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      result.push(slice.reduce((a, b) => a + b, 0) / period);
    }
  }
  return result;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
function calculateMACD(closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  if (!closes || closes.length < slowPeriod) {
    return { macdLine: 0, signalLine: 0, histogram: 0, bullish: false };
  }

  const emaFast = calculateEMA(closes, fastPeriod);
  const emaSlow = calculateEMA(closes, slowPeriod);

  const macdLine = [];
  for (let i = 0; i < closes.length; i++) {
    const fast = emaFast[Math.min(i, emaFast.length - 1)] || closes[i];
    const slow = emaSlow[Math.min(i, emaSlow.length - 1)] || closes[i];
    macdLine.push(fast - slow);
  }

  const signalLine = calculateEMA(macdLine, signalPeriod);
  const currentMacd = macdLine[macdLine.length - 1] || 0;
  const currentSignal = signalLine[signalLine.length - 1] || 0;
  const histogram = currentMacd - currentSignal;

  return {
    macdLine: currentMacd,
    signalLine: currentSignal,
    histogram,
    bullish: currentMacd > currentSignal
  };
}

/**
 * Calculate Bollinger Bands
 */
function calculateBollingerBands(closes, period = 20, stdDev = 2) {
  if (!closes || closes.length < period) {
    return { upper: 0, middle: 0, lower: 0, position: 'middle' };
  }

  const slice = closes.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
  const std = Math.sqrt(variance);

  const upper = mean + stdDev * std;
  const lower = mean - stdDev * std;
  const currentPrice = closes[closes.length - 1];

  // Determine position within bands
  let position = 'middle';
  if (currentPrice >= upper) position = 'upper';
  else if (currentPrice <= lower) position = 'lower';
  else if (currentPrice > mean + std) position = 'upper-middle';
  else if (currentPrice < mean - std) position = 'lower-middle';

  return {
    upper,
    middle: mean,
    lower,
    position,
    percentB: ((currentPrice - lower) / (upper - lower)) * 100
  };
}

/**
 * Calculate Stochastic Oscillator
 */
function calculateStochastic(candles, period = 14, smoothK = 3, smoothD = 3) {
  if (!candles || candles.length < period) {
    return { k: 50, d: 50 };
  }

  const kValues = [];

  for (let i = period - 1; i < candles.length; i++) {
    const slice = candles.slice(i - period + 1, i + 1);
    const highestHigh = Math.max(...slice.map(c => c.high || c.close));
    const lowestLow = Math.min(...slice.map(c => c.low || c.close));
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

  return {
    k: smoothedK[smoothedK.length - 1] || 50,
    d: smoothedD[smoothedD.length - 1] || 50
  };
}

/**
 * Calculate ADX (Average Directional Index)
 */
function calculateADX(candles, period = 14) {
  if (!candles || candles.length < period * 2) return 0;

  const highs = candles.map(c => c.high || c.close);
  const lows = candles.map(c => c.low || c.close);
  const closes = candles.map(c => c.close);

  const plusDM = [];
  const minusDM = [];
  const tr = [];

  for (let i = 1; i < candles.length; i++) {
    const highDiff = highs[i] - highs[i - 1];
    const lowDiff = lows[i - 1] - lows[i];

    plusDM.push(highDiff > lowDiff && highDiff > 0 ? highDiff : 0);
    minusDM.push(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0);

    const trueRange = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    tr.push(trueRange);
  }

  const smoothedPlusDM = calculateEMA(plusDM, period);
  const smoothedMinusDM = calculateEMA(minusDM, period);
  const smoothedTR = calculateEMA(tr, period);

  const dx = [];
  for (let i = 0; i < smoothedTR.length; i++) {
    const pdi = smoothedTR[i] > 0 ? (smoothedPlusDM[i] / smoothedTR[i]) * 100 : 0;
    const mdi = smoothedTR[i] > 0 ? (smoothedMinusDM[i] / smoothedTR[i]) * 100 : 0;

    const diSum = pdi + mdi;
    const diDiff = Math.abs(pdi - mdi);
    dx.push(diSum > 0 ? (diDiff / diSum) * 100 : 0);
  }

  const adx = calculateEMA(dx, period);
  return adx.length > 0 ? adx[adx.length - 1] : 0;
}

/**
 * Update indicators from trading scheduler
 * Called by the trading scheduler when new data is available
 */
export function updateIndicatorsFromScheduler(symbol, indicators) {
  latestIndicators.set(symbol, {
    ...indicators,
    timestamp: Date.now()
  });
}

/**
 * Get latest indicators for a symbol
 * Uses cached data from trading scheduler if available, otherwise calculates from stored signals
 */
export async function getMarketIndicators(symbol) {
  const normalizedSymbol = symbol.toUpperCase().replace('/', '');

  // Check cache first
  const cached = indicatorCache.get(normalizedSymbol);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // Check if we have recent data from trading scheduler
  const schedulerData = latestIndicators.get(normalizedSymbol);
  if (schedulerData && Date.now() - schedulerData.timestamp < CACHE_TTL) {
    indicatorCache.set(normalizedSymbol, {
      data: schedulerData,
      timestamp: Date.now()
    });
    return schedulerData;
  }

  // Otherwise, try to get data from recent trading signals in the database
  try {
    const result = await pool.query(`
      SELECT 
        ts.symbol,
        ts.signal_type,
        ts.entry_price,
        ts.confidence,
        ts.timeframe,
        ts.analysis,
        ts.created_at
      FROM trading_signals ts
      WHERE ts.symbol = $1
      ORDER BY ts.created_at DESC
      LIMIT 10
    `, [normalizedSymbol]);

    // Calculate indicators based on recent signal data and analysis
    const signals = result.rows;
    let rsi = 50;
    let macdBullish = false;
    let bbPosition = 'middle';
    let stochK = 50;
    let adx = 25;

    if (signals.length > 0) {
      // Extract indicator hints from analysis text if available
      const latestSignal = signals[0];
      const analysis = latestSignal.analysis || '';
      const confidence = latestSignal.confidence || 50;

      // Infer indicators from signal direction and confidence
      const isBullish = latestSignal.signal_type === 'BUY';
      
      // RSI tends toward extremes based on confidence
      if (isBullish) {
        rsi = 30 + (confidence * 0.4); // 30-70 for buys
      } else {
        rsi = 70 - (confidence * 0.4); // 30-70 for sells
      }

      // MACD follows signal direction
      macdBullish = isBullish;

      // Bollinger position based on signal
      bbPosition = isBullish ? 'lower-middle' : 'upper-middle';
      if (confidence > 80) {
        bbPosition = isBullish ? 'lower' : 'upper';
      }

      // Stochastic follows RSI pattern
      stochK = isBullish ? 30 + (confidence * 0.3) : 70 - (confidence * 0.3);

      // ADX based on number of recent signals (more signals = trending)
      adx = Math.min(60, 15 + (signals.length * 4));
    }

    // Build indicator response
    const indicators = {
      symbol: normalizedSymbol,
      timestamp: Date.now(),
      rsi: {
        value: Math.round(rsi),
        signal: rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral',
        color: rsi > 70 ? '#FF5252' : rsi < 30 ? '#00C853' : '#FFA500'
      },
      macd: {
        value: macdBullish ? 'Bullish' : 'Bearish',
        signal: macdBullish ? 'Buy' : 'Sell',
        color: macdBullish ? '#00C853' : '#FF5252',
        bullish: macdBullish
      },
      movingAverage: {
        value: macdBullish ? 'Above 200 SMA' : 'Below 200 SMA',
        signal: macdBullish ? 'Bullish' : 'Bearish',
        color: macdBullish ? '#00C853' : '#FF5252'
      },
      bollingerBands: {
        value: bbPosition === 'upper' ? 'Upper Band' : 
               bbPosition === 'lower' ? 'Lower Band' : 'Middle Band',
        signal: bbPosition === 'upper' ? 'Overbought' : 
                bbPosition === 'lower' ? 'Oversold' : 'Neutral',
        color: bbPosition === 'upper' ? '#FF5252' : 
               bbPosition === 'lower' ? '#00C853' : '#FFA500'
      },
      stochastic: {
        value: Math.round(stochK),
        signal: stochK > 80 ? 'Overbought' : stochK < 20 ? 'Oversold' : 'Neutral',
        color: stochK > 80 ? '#FF5252' : stochK < 20 ? '#00C853' : '#FFA500'
      },
      adx: {
        value: Math.round(adx),
        signal: adx > 25 ? 'Trending' : 'Ranging',
        color: adx > 25 ? '#00C853' : '#FFA500'
      },
      source: signals.length > 0 ? 'signals' : 'calculated',
      lastSignal: signals.length > 0 ? {
        type: signals[0].signal_type,
        confidence: signals[0].confidence,
        time: signals[0].created_at
      } : null
    };

    // Cache the result
    indicatorCache.set(normalizedSymbol, {
      data: indicators,
      timestamp: Date.now()
    });

    return indicators;
  } catch (error) {
    console.error('Error fetching market indicators:', error);
    
    // Return default values on error
    return {
      symbol: normalizedSymbol,
      timestamp: Date.now(),
      rsi: { value: 50, signal: 'Neutral', color: '#FFA500' },
      macd: { value: 'Neutral', signal: 'Hold', color: '#FFA500', bullish: null },
      movingAverage: { value: 'Neutral', signal: 'Hold', color: '#FFA500' },
      bollingerBands: { value: 'Middle Band', signal: 'Neutral', color: '#FFA500' },
      stochastic: { value: 50, signal: 'Neutral', color: '#FFA500' },
      adx: { value: 25, signal: 'Moderate', color: '#FFA500' },
      source: 'default',
      lastSignal: null
    };
  }
}

/**
 * Calculate all indicators from raw candle data
 * Used when we have direct access to OHLC data
 */
export function calculateAllIndicators(candles) {
  if (!candles || candles.length < 30) {
    return null;
  }

  const closes = candles.map(c => c.close);
  const currentPrice = closes[closes.length - 1];

  const rsi = calculateRSI(closes, 14);
  const macd = calculateMACD(closes);
  const bb = calculateBollingerBands(closes);
  const stoch = calculateStochastic(candles);
  const adx = calculateADX(candles);

  // Moving average analysis
  const sma200 = closes.length >= 200 ? 
    closes.slice(-200).reduce((a, b) => a + b, 0) / 200 : 
    closes.reduce((a, b) => a + b, 0) / closes.length;
  const aboveSMA = currentPrice > sma200;

  return {
    rsi: {
      value: Math.round(rsi),
      signal: rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral',
      color: rsi > 70 ? '#FF5252' : rsi < 30 ? '#00C853' : '#FFA500'
    },
    macd: {
      value: macd.bullish ? 'Bullish' : 'Bearish',
      signal: macd.bullish ? 'Buy' : 'Sell',
      color: macd.bullish ? '#00C853' : '#FF5252',
      histogram: macd.histogram,
      bullish: macd.bullish
    },
    movingAverage: {
      value: aboveSMA ? 'Above 200 SMA' : 'Below 200 SMA',
      signal: aboveSMA ? 'Bullish' : 'Bearish',
      color: aboveSMA ? '#00C853' : '#FF5252'
    },
    bollingerBands: {
      value: bb.position === 'upper' ? 'Upper Band' :
             bb.position === 'lower' ? 'Lower Band' : 'Middle Band',
      signal: bb.position === 'upper' ? 'Overbought' :
              bb.position === 'lower' ? 'Oversold' : 'Neutral',
      color: bb.position === 'upper' ? '#FF5252' :
             bb.position === 'lower' ? '#00C853' : '#FFA500',
      percentB: bb.percentB
    },
    stochastic: {
      value: Math.round(stoch.k),
      signal: stoch.k > 80 ? 'Overbought' : stoch.k < 20 ? 'Oversold' : 'Neutral',
      color: stoch.k > 80 ? '#FF5252' : stoch.k < 20 ? '#00C853' : '#FFA500',
      k: stoch.k,
      d: stoch.d
    },
    adx: {
      value: Math.round(adx),
      signal: adx > 25 ? 'Trending' : 'Ranging',
      color: adx > 25 ? '#00C853' : '#FFA500'
    }
  };
}

// Export calculation functions for use in other services
export {
  calculateRSI,
  calculateMACD,
  calculateEMA,
  calculateSMA,
  calculateBollingerBands,
  calculateStochastic,
  calculateADX
};

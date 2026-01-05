/**
 * AlgoEdge Trading Strategy Service
 * Implements technical analysis and trading signals with 75%+ confidence
 */

// Trading pairs to monitor
export const TRADING_PAIRS = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD',
  'EURGBP', 'EURJPY', 'GBPJPY', 'AUDJPY', 'EURAUD', 'EURCHF', 'GBPCHF',
  'XAUUSD', 'XAGUSD', // Gold and Silver
];

export interface TradingSignal {
  symbol: string;
  type: 'BUY' | 'SELL';
  confidence: number; // 0-100
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  reason: string;
  indicators: {
    rsi: number;
    macd: { value: number; signal: number; histogram: number };
    ema20: number;
    ema50: number;
    ema200: number;
    atr: number;
    bollingerBands: { upper: number; middle: number; lower: number };
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

/**
 * Calculate RSI (Relative Strength Index)
 */
export function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

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
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(prices: number[]): { value: number; signal: number; histogram: number } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12 - ema26;
  
  // For simplicity, using a rough signal line calculation
  const signalLine = calculateEMA([...prices.slice(-9), macdLine], 9);
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

  return trueRanges.slice(-period).reduce((a, b) => a + b, 0) / period;
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
 * Analyze market and generate trading signal
 * Returns signal only if confidence >= 75%
 */
export function analyzeMarket(symbol: string, candles: CandleData[]): TradingSignal | null {
  if (candles.length < 200) return null;

  const closePrices = candles.map(c => c.close);
  const currentPrice = closePrices[closePrices.length - 1];

  // Calculate indicators
  const rsi = calculateRSI(closePrices);
  const macd = calculateMACD(closePrices);
  const ema20 = calculateEMA(closePrices, 20);
  const ema50 = calculateEMA(closePrices, 50);
  const ema200 = calculateEMA(closePrices, 200);
  const atr = calculateATR(candles);
  const bollingerBands = calculateBollingerBands(closePrices);

  const indicators = { rsi, macd, ema20, ema50, ema200, atr, bollingerBands };

  // Score-based confidence calculation
  let buyScore = 0;
  let sellScore = 0;
  const reasons: string[] = [];

  // Trend Analysis (EMA alignment)
  if (ema20 > ema50 && ema50 > ema200) {
    buyScore += 20;
    reasons.push('Strong uptrend (EMA alignment)');
  } else if (ema20 < ema50 && ema50 < ema200) {
    sellScore += 20;
    reasons.push('Strong downtrend (EMA alignment)');
  }

  // Price position relative to EMAs
  if (currentPrice > ema20 && currentPrice > ema50) {
    buyScore += 10;
  } else if (currentPrice < ema20 && currentPrice < ema50) {
    sellScore += 10;
  }

  // RSI Analysis
  if (rsi < 30) {
    buyScore += 25; // Oversold
    reasons.push(`RSI oversold (${rsi.toFixed(1)})`);
  } else if (rsi > 70) {
    sellScore += 25; // Overbought
    reasons.push(`RSI overbought (${rsi.toFixed(1)})`);
  } else if (rsi < 40 && rsi > 30) {
    buyScore += 10;
  } else if (rsi > 60 && rsi < 70) {
    sellScore += 10;
  }

  // MACD Analysis
  if (macd.histogram > 0 && macd.value > macd.signal) {
    buyScore += 15;
    reasons.push('MACD bullish crossover');
  } else if (macd.histogram < 0 && macd.value < macd.signal) {
    sellScore += 15;
    reasons.push('MACD bearish crossover');
  }

  // Bollinger Bands Analysis
  if (currentPrice <= bollingerBands.lower) {
    buyScore += 20; // Price at lower band - potential reversal
    reasons.push('Price at lower Bollinger Band');
  } else if (currentPrice >= bollingerBands.upper) {
    sellScore += 20; // Price at upper band - potential reversal
    reasons.push('Price at upper Bollinger Band');
  }

  // Volume confirmation (using recent candles)
  const recentVolumes = candles.slice(-5).map(c => c.volume);
  const avgVolume = candles.slice(-20).map(c => c.volume).reduce((a, b) => a + b, 0) / 20;
  const currentVolume = recentVolumes[recentVolumes.length - 1];
  
  if (currentVolume > avgVolume * 1.5) {
    // High volume confirms the move
    buyScore += 10;
    sellScore += 10;
    reasons.push('High volume confirmation');
  }

  // Determine signal type and confidence
  const buyConfidence = Math.min(buyScore, 100);
  const sellConfidence = Math.min(sellScore, 100);

  // Only return signal if confidence >= 75%
  if (buyConfidence >= 75 && buyConfidence > sellConfidence) {
    const stopLossDistance = atr * 2;
    const takeProfitDistance = atr * 3; // 1.5:1 risk-reward ratio

    return {
      symbol,
      type: 'BUY',
      confidence: buyConfidence,
      entryPrice: currentPrice,
      stopLoss: currentPrice - stopLossDistance,
      takeProfit: currentPrice + takeProfitDistance,
      reason: reasons.join(', '),
      indicators,
    };
  } else if (sellConfidence >= 75 && sellConfidence > buyConfidence) {
    const stopLossDistance = atr * 2;
    const takeProfitDistance = atr * 3;

    return {
      symbol,
      type: 'SELL',
      confidence: sellConfidence,
      entryPrice: currentPrice,
      stopLoss: currentPrice + stopLossDistance,
      takeProfit: currentPrice - takeProfitDistance,
      reason: reasons.join(', '),
      indicators,
    };
  }

  return null; // No high-confidence signal
}

/**
 * Calculate position size based on risk management
 */
export function calculatePositionSize(
  balance: number,
  riskPercent: number,
  entryPrice: number,
  stopLoss: number,
  pipValue: number = 10 // Default pip value for standard lot
): number {
  const riskAmount = balance * (riskPercent / 100);
  const stopLossPips = Math.abs(entryPrice - stopLoss) * 10000; // Convert to pips
  
  if (stopLossPips === 0) return 0.01; // Minimum lot size
  
  const lotSize = riskAmount / (stopLossPips * pipValue);
  
  // Ensure lot size is within bounds
  return Math.max(0.01, Math.min(lotSize, 10)); // Min 0.01, Max 10 lots
}

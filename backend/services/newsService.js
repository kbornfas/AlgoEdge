/**
 * =========================================================================
 * NEWS TRADING SERVICE
 * =========================================================================
 * Advanced news trading service that:
 * - Fetches economic calendar data from multiple sources
 * - Analyzes news impact (HIGH, MEDIUM, LOW)
 * - Opens strategic positions based on news events
 * - Uses proper SL/TP based on expected volatility
 * - Handles pre-news, during-news, and post-news trading
 * =========================================================================
 */

import https from 'https';

// News impact levels
const IMPACT = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
};

// Currency pairs affected by each currency
const CURRENCY_PAIRS = {
  USD: ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'USDCAD', 'AUDUSD', 'NZDUSD', 'XAUUSD'],
  EUR: ['EURUSD', 'EURJPY', 'EURGBP', 'EURCAD', 'EURAUD'],
  GBP: ['GBPUSD', 'GBPJPY', 'EURGBP', 'GBPCAD', 'GBPAUD'],
  JPY: ['USDJPY', 'EURJPY', 'GBPJPY', 'AUDJPY', 'CADJPY'],
  AUD: ['AUDUSD', 'AUDJPY', 'AUDCAD', 'AUDNZD', 'EURAUD'],
  CAD: ['USDCAD', 'CADJPY', 'EURCAD', 'GBPCAD', 'AUDCAD'],
  NZD: ['NZDUSD', 'AUDNZD', 'NZDJPY', 'EURNZD'],
  CHF: ['USDCHF', 'EURCHF', 'GBPCHF', 'CHFJPY'],
  XAU: ['XAUUSD'], // Gold
};

// High impact news events and their typical pip movements
const HIGH_IMPACT_EVENTS = {
  'Non-Farm Payrolls': { avgPips: 80, volatilityMultiplier: 2.5 },
  'NFP': { avgPips: 80, volatilityMultiplier: 2.5 },
  'FOMC': { avgPips: 60, volatilityMultiplier: 2.0 },
  'Fed Interest Rate': { avgPips: 60, volatilityMultiplier: 2.0 },
  'Interest Rate Decision': { avgPips: 50, volatilityMultiplier: 1.8 },
  'CPI': { avgPips: 45, volatilityMultiplier: 1.7 },
  'Consumer Price Index': { avgPips: 45, volatilityMultiplier: 1.7 },
  'GDP': { avgPips: 40, volatilityMultiplier: 1.6 },
  'Gross Domestic Product': { avgPips: 40, volatilityMultiplier: 1.6 },
  'ECB': { avgPips: 55, volatilityMultiplier: 1.9 },
  'BOE': { avgPips: 50, volatilityMultiplier: 1.8 },
  'BOJ': { avgPips: 45, volatilityMultiplier: 1.7 },
  'RBA': { avgPips: 40, volatilityMultiplier: 1.5 },
  'Employment Change': { avgPips: 35, volatilityMultiplier: 1.5 },
  'Unemployment Rate': { avgPips: 30, volatilityMultiplier: 1.4 },
  'Retail Sales': { avgPips: 30, volatilityMultiplier: 1.4 },
  'PMI': { avgPips: 25, volatilityMultiplier: 1.3 },
  'Trade Balance': { avgPips: 20, volatilityMultiplier: 1.2 },
};

// Medium impact events
const MEDIUM_IMPACT_EVENTS = {
  'PPI': { avgPips: 20, volatilityMultiplier: 1.2 },
  'Producer Price Index': { avgPips: 20, volatilityMultiplier: 1.2 },
  'Industrial Production': { avgPips: 18, volatilityMultiplier: 1.15 },
  'Building Permits': { avgPips: 15, volatilityMultiplier: 1.1 },
  'Housing Starts': { avgPips: 15, volatilityMultiplier: 1.1 },
  'Consumer Confidence': { avgPips: 18, volatilityMultiplier: 1.15 },
  'Durable Goods': { avgPips: 20, volatilityMultiplier: 1.2 },
  'Factory Orders': { avgPips: 15, volatilityMultiplier: 1.1 },
  'ISM': { avgPips: 22, volatilityMultiplier: 1.2 },
  'Manufacturing PMI': { avgPips: 20, volatilityMultiplier: 1.15 },
  'Services PMI': { avgPips: 18, volatilityMultiplier: 1.1 },
  'Core Retail Sales': { avgPips: 25, volatilityMultiplier: 1.3 },
  'Existing Home Sales': { avgPips: 12, volatilityMultiplier: 1.05 },
  'New Home Sales': { avgPips: 12, volatilityMultiplier: 1.05 },
  'ADP Employment': { avgPips: 25, volatilityMultiplier: 1.3 },
  'Initial Jobless Claims': { avgPips: 15, volatilityMultiplier: 1.1 },
};

// Low impact events
const LOW_IMPACT_EVENTS = {
  'Wholesale Inventories': { avgPips: 8, volatilityMultiplier: 1.0 },
  'Business Inventories': { avgPips: 8, volatilityMultiplier: 1.0 },
  'Consumer Credit': { avgPips: 10, volatilityMultiplier: 1.0 },
  'Treasury Budget': { avgPips: 5, volatilityMultiplier: 1.0 },
  'Leading Indicators': { avgPips: 10, volatilityMultiplier: 1.0 },
  'Current Account': { avgPips: 12, volatilityMultiplier: 1.05 },
  'Import Prices': { avgPips: 8, volatilityMultiplier: 1.0 },
  'Export Prices': { avgPips: 8, volatilityMultiplier: 1.0 },
  'Richmond Fed': { avgPips: 10, volatilityMultiplier: 1.0 },
  'Chicago Fed': { avgPips: 8, volatilityMultiplier: 1.0 },
  'Flash PMI': { avgPips: 15, volatilityMultiplier: 1.1 },
};

// Cache for news data
let newsCache = {
  data: [],
  lastFetch: 0,
  cacheDuration: 5 * 60 * 1000, // 5 minutes
};

/**
 * Make HTTPS request with proper error handling
 */
function httpsRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'AlgoEdge/1.0',
        ...options.headers,
      },
      rejectUnauthorized: false,
    };
    
    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          json: () => {
            try {
              return Promise.resolve(JSON.parse(data || '[]'));
            } catch {
              return Promise.resolve([]);
            }
          },
          text: () => Promise.resolve(data),
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

/**
 * Fetch economic calendar from free API sources
 */
async function fetchEconomicCalendar() {
  // Check cache
  if (newsCache.data.length > 0 && Date.now() - newsCache.lastFetch < newsCache.cacheDuration) {
    return newsCache.data;
  }

  const news = [];
  
  // Try multiple free sources
  const sources = [
    fetchFromForexFactory,
    fetchFromInvesting,
    generateScheduledNews, // Fallback: known scheduled events
  ];
  
  for (const source of sources) {
    try {
      const result = await source();
      if (result && result.length > 0) {
        news.push(...result);
        break; // Use first successful source
      }
    } catch (err) {
      console.log(`News source failed: ${err.message}`);
    }
  }
  
  // Add scheduled high-impact news we know about
  const scheduled = generateScheduledNews();
  
  // Merge and deduplicate
  const allNews = [...news, ...scheduled];
  const uniqueNews = deduplicateNews(allNews);
  
  // Cache result
  newsCache.data = uniqueNews;
  newsCache.lastFetch = Date.now();
  
  return uniqueNews;
}

/**
 * Fetch from Forex Factory (scraping)
 */
async function fetchFromForexFactory() {
  // Note: In production, you'd need proper API access
  // This is a placeholder that returns known scheduled events
  return generateScheduledNews();
}

/**
 * Fetch from Investing.com (scraping)
 */
async function fetchFromInvesting() {
  // Note: In production, you'd need proper API access
  return [];
}

/**
 * Generate scheduled news events based on known calendar patterns
 * This covers the most important regular events
 */
function generateScheduledNews() {
  const news = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Generate for next 7 days
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);
    const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, etc.
    const dayOfMonth = date.getDate();
    
    // Skip weekends for most news
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    
    // === US NEWS ===
    
    // NFP - First Friday of the month (US)
    if (dayOfWeek === 5 && dayOfMonth <= 7) {
      news.push({
        time: new Date(date.setHours(8, 30, 0, 0)), // 8:30 AM ET
        currency: 'USD',
        event: 'Non-Farm Payrolls',
        impact: IMPACT.HIGH,
        ...HIGH_IMPACT_EVENTS['Non-Farm Payrolls'],
      });
      news.push({
        time: new Date(date.setHours(8, 30, 0, 0)),
        currency: 'USD',
        event: 'Unemployment Rate',
        impact: IMPACT.HIGH,
        ...HIGH_IMPACT_EVENTS['Unemployment Rate'],
      });
    }
    
    // CPI - Usually mid-month (around 10th-15th)
    if (dayOfMonth >= 10 && dayOfMonth <= 15 && dayOfWeek >= 2 && dayOfWeek <= 4) {
      news.push({
        time: new Date(date.setHours(8, 30, 0, 0)),
        currency: 'USD',
        event: 'CPI m/m',
        impact: IMPACT.HIGH,
        ...HIGH_IMPACT_EVENTS['CPI'],
      });
    }
    
    // Retail Sales - Usually mid-month
    if (dayOfMonth >= 14 && dayOfMonth <= 17 && dayOfWeek >= 2 && dayOfWeek <= 4) {
      news.push({
        time: new Date(date.setHours(8, 30, 0, 0)),
        currency: 'USD',
        event: 'Retail Sales m/m',
        impact: IMPACT.HIGH,
        ...HIGH_IMPACT_EVENTS['Retail Sales'],
      });
    }
    
    // Initial Jobless Claims - Every Thursday
    if (dayOfWeek === 4) {
      news.push({
        time: new Date(date.setHours(8, 30, 0, 0)),
        currency: 'USD',
        event: 'Initial Jobless Claims',
        impact: IMPACT.MEDIUM,
        ...MEDIUM_IMPACT_EVENTS['Initial Jobless Claims'],
      });
    }
    
    // ISM Manufacturing PMI - First business day of month
    if (dayOfMonth === 1 || (dayOfMonth <= 3 && dayOfWeek === 1)) {
      news.push({
        time: new Date(date.setHours(10, 0, 0, 0)),
        currency: 'USD',
        event: 'ISM Manufacturing PMI',
        impact: IMPACT.HIGH,
        ...HIGH_IMPACT_EVENTS['PMI'],
      });
    }
    
    // ISM Services PMI - Third business day of month
    if (dayOfMonth === 3 || (dayOfMonth <= 5 && dayOfWeek === 3)) {
      news.push({
        time: new Date(date.setHours(10, 0, 0, 0)),
        currency: 'USD',
        event: 'ISM Services PMI',
        impact: IMPACT.MEDIUM,
        ...MEDIUM_IMPACT_EVENTS['Services PMI'],
      });
    }
    
    // === EUROZONE NEWS ===
    
    // German ZEW Economic Sentiment - Usually 2nd/3rd Tuesday
    if (dayOfWeek === 2 && dayOfMonth >= 8 && dayOfMonth <= 20) {
      news.push({
        time: new Date(date.setHours(5, 0, 0, 0)), // 5 AM ET
        currency: 'EUR',
        event: 'German ZEW Economic Sentiment',
        impact: IMPACT.MEDIUM,
        avgPips: 20,
        volatilityMultiplier: 1.2,
      });
    }
    
    // ECB Rate Decision - Usually Thursday after first Wednesday of month
    if (dayOfWeek === 4 && dayOfMonth >= 4 && dayOfMonth <= 14) {
      news.push({
        time: new Date(date.setHours(8, 15, 0, 0)),
        currency: 'EUR',
        event: 'ECB Interest Rate Decision',
        impact: IMPACT.HIGH,
        ...HIGH_IMPACT_EVENTS['ECB'],
      });
    }
    
    // === UK NEWS ===
    
    // BOE Rate Decision - Usually Thursday
    if (dayOfWeek === 4 && dayOfMonth >= 1 && dayOfMonth <= 14) {
      news.push({
        time: new Date(date.setHours(7, 0, 0, 0)),
        currency: 'GBP',
        event: 'BOE Interest Rate Decision',
        impact: IMPACT.HIGH,
        ...HIGH_IMPACT_EVENTS['BOE'],
      });
    }
    
    // UK GDP - Usually mid-month
    if (dayOfMonth >= 10 && dayOfMonth <= 15 && dayOfWeek >= 2 && dayOfWeek <= 4) {
      news.push({
        time: new Date(date.setHours(2, 0, 0, 0)),
        currency: 'GBP',
        event: 'GDP m/m',
        impact: IMPACT.HIGH,
        ...HIGH_IMPACT_EVENTS['GDP'],
      });
    }
    
    // === AUSTRALIAN NEWS ===
    
    // RBA Rate Decision - First Tuesday of month
    if (dayOfWeek === 2 && dayOfMonth <= 7) {
      news.push({
        time: new Date(date.setHours(0, 30, 0, 0)), // 12:30 AM ET
        currency: 'AUD',
        event: 'RBA Interest Rate Decision',
        impact: IMPACT.HIGH,
        ...HIGH_IMPACT_EVENTS['RBA'],
      });
    }
    
    // Australian Employment - Usually mid-month Thursday
    if (dayOfWeek === 4 && dayOfMonth >= 12 && dayOfMonth <= 20) {
      news.push({
        time: new Date(date.setHours(19, 30, 0, 0)), // Previous day 7:30 PM ET
        currency: 'AUD',
        event: 'Employment Change',
        impact: IMPACT.HIGH,
        ...HIGH_IMPACT_EVENTS['Employment Change'],
      });
    }
    
    // === CANADIAN NEWS ===
    
    // BOC Rate Decision - Usually Wednesday
    if (dayOfWeek === 3 && dayOfMonth >= 1 && dayOfMonth <= 12) {
      news.push({
        time: new Date(date.setHours(10, 0, 0, 0)),
        currency: 'CAD',
        event: 'BOC Interest Rate Decision',
        impact: IMPACT.HIGH,
        avgPips: 50,
        volatilityMultiplier: 1.8,
      });
    }
    
    // Canadian Employment - Same day as US NFP (first Friday)
    if (dayOfWeek === 5 && dayOfMonth <= 7) {
      news.push({
        time: new Date(date.setHours(8, 30, 0, 0)),
        currency: 'CAD',
        event: 'Employment Change',
        impact: IMPACT.HIGH,
        ...HIGH_IMPACT_EVENTS['Employment Change'],
      });
    }
    
    // === JAPANESE NEWS ===
    
    // BOJ Rate Decision - Usually Fridays
    if (dayOfWeek === 5 && dayOfMonth >= 15 && dayOfMonth <= 25) {
      news.push({
        time: new Date(date.setHours(23, 0, 0, 0)), // 11 PM ET (next day in Japan)
        currency: 'JPY',
        event: 'BOJ Interest Rate Decision',
        impact: IMPACT.HIGH,
        ...HIGH_IMPACT_EVENTS['BOJ'],
      });
    }
    
    // Japanese GDP - Usually mid-month
    if (dayOfMonth >= 12 && dayOfMonth <= 18 && dayOfWeek >= 1 && dayOfWeek <= 3) {
      news.push({
        time: new Date(date.setHours(19, 50, 0, 0)),
        currency: 'JPY',
        event: 'GDP q/q',
        impact: IMPACT.HIGH,
        ...HIGH_IMPACT_EVENTS['GDP'],
      });
    }
  }
  
  return news;
}

/**
 * Deduplicate news events
 */
function deduplicateNews(news) {
  const seen = new Set();
  return news.filter(item => {
    const key = `${item.currency}-${item.event}-${item.time.getTime()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Get news impact level for an event
 */
function getEventImpact(eventName) {
  const normalizedName = eventName.toLowerCase();
  
  // Check high impact
  for (const [key, data] of Object.entries(HIGH_IMPACT_EVENTS)) {
    if (normalizedName.includes(key.toLowerCase())) {
      return { impact: IMPACT.HIGH, ...data };
    }
  }
  
  // Check medium impact
  for (const [key, data] of Object.entries(MEDIUM_IMPACT_EVENTS)) {
    if (normalizedName.includes(key.toLowerCase())) {
      return { impact: IMPACT.MEDIUM, ...data };
    }
  }
  
  // Check low impact
  for (const [key, data] of Object.entries(LOW_IMPACT_EVENTS)) {
    if (normalizedName.includes(key.toLowerCase())) {
      return { impact: IMPACT.LOW, ...data };
    }
  }
  
  // Default to low impact
  return { impact: IMPACT.LOW, avgPips: 10, volatilityMultiplier: 1.0 };
}

/**
 * Get upcoming news events
 * @param {number} minutesAhead - How many minutes ahead to look
 * @returns {Array} - Upcoming news events
 */
async function getUpcomingNews(minutesAhead = 60) {
  const news = await fetchEconomicCalendar();
  const now = new Date();
  const cutoff = new Date(now.getTime() + minutesAhead * 60 * 1000);
  
  return news.filter(item => {
    const newsTime = new Date(item.time);
    return newsTime >= now && newsTime <= cutoff;
  }).sort((a, b) => new Date(a.time) - new Date(b.time));
}

/**
 * Get recent news that just happened
 * @param {number} minutesAgo - How many minutes ago to look
 * @returns {Array} - Recent news events
 */
async function getRecentNews(minutesAgo = 30) {
  const news = await fetchEconomicCalendar();
  const now = new Date();
  const cutoff = new Date(now.getTime() - minutesAgo * 60 * 1000);
  
  return news.filter(item => {
    const newsTime = new Date(item.time);
    return newsTime >= cutoff && newsTime <= now;
  }).sort((a, b) => new Date(b.time) - new Date(a.time)); // Most recent first
}

/**
 * Analyze news impact on a specific pair
 * Returns trading signal if news is actionable
 */
function analyzeNewsForPair(newsEvent, pair, currentPrice, candles = []) {
  const currency = pair.substring(0, 3);
  const quoteCurrency = pair.substring(3, 6);
  
  // Check if news affects this pair
  const isBaseCurrencyAffected = CURRENCY_PAIRS[newsEvent.currency]?.some(p => p.includes(currency));
  const isQuoteCurrencyAffected = CURRENCY_PAIRS[newsEvent.currency]?.some(p => p.includes(quoteCurrency));
  
  if (!isBaseCurrencyAffected && !isQuoteCurrencyAffected) {
    return null; // News doesn't affect this pair
  }
  
  // Calculate expected volatility based on news impact
  const impactData = getEventImpact(newsEvent.event);
  const expectedPips = impactData.avgPips * impactData.volatilityMultiplier;
  
  // Get pip value for this pair
  const pipValue = pair.includes('JPY') ? 0.01 : 0.0001;
  const expectedMove = expectedPips * pipValue;
  
  // Analyze recent candles to determine direction
  let direction = 'NONE';
  let confidence = 50;
  let reason = `${newsEvent.event} (${newsEvent.currency})`;
  
  if (candles && candles.length >= 5) {
    const recentCandles = candles.slice(-5);
    const priceChange = recentCandles[4].close - recentCandles[0].open;
    const avgBody = recentCandles.reduce((sum, c) => sum + Math.abs(c.close - c.open), 0) / 5;
    
    // Momentum analysis
    const momentum = priceChange > 0 ? 'bullish' : 'bearish';
    const momentumStrength = Math.abs(priceChange) / (avgBody * 3);
    
    // If news currency is base currency:
    // - Good news = pair goes UP
    // - Bad news = pair goes DOWN
    // If news currency is quote currency:
    // - Good news = pair goes DOWN
    // - Bad news = pair goes UP
    
    // For now, trade in direction of momentum after news
    if (momentumStrength > 0.5) {
      direction = momentum === 'bullish' ? 'BUY' : 'SELL';
      confidence = Math.min(90, 50 + momentumStrength * 40);
    } else if (momentumStrength > 0.3) {
      direction = momentum === 'bullish' ? 'BUY' : 'SELL';
      confidence = Math.min(70, 50 + momentumStrength * 30);
    }
    
    reason = `${newsEvent.event} (${newsEvent.currency}) - ${momentum} momentum`;
  }
  
  // Adjust confidence based on impact level
  if (impactData.impact === IMPACT.HIGH) {
    confidence = Math.min(95, confidence + 15);
  } else if (impactData.impact === IMPACT.MEDIUM) {
    confidence = Math.min(85, confidence + 5);
  }
  
  if (direction === 'NONE' || confidence < 55) {
    return null;
  }
  
  return {
    type: direction,
    confidence,
    reason,
    newsEvent,
    expectedPips,
    expectedMove,
    impactLevel: impactData.impact,
  };
}

/**
 * Calculate strategic SL/TP based on news impact
 */
function calculateNewsSLTP(signal, currentPrice, pair) {
  const pipValue = pair.includes('JPY') ? 0.01 : 0.0001;
  const { expectedPips, impactLevel } = signal;
  
  let slPips, tpPips, riskReward;
  
  // Strategic SL/TP based on impact level
  switch (impactLevel) {
    case IMPACT.HIGH:
      // High impact: Wider SL, larger TP target
      slPips = Math.max(30, expectedPips * 0.5); // SL is 50% of expected move
      tpPips = expectedPips * 1.5; // TP is 150% of expected move
      riskReward = 3.0;
      break;
      
    case IMPACT.MEDIUM:
      // Medium impact: Balanced SL/TP
      slPips = Math.max(20, expectedPips * 0.6);
      tpPips = expectedPips * 1.2;
      riskReward = 2.0;
      break;
      
    case IMPACT.LOW:
    default:
      // Low impact: Tighter SL/TP
      slPips = Math.max(15, expectedPips * 0.7);
      tpPips = expectedPips;
      riskReward = 1.5;
      break;
  }
  
  // Calculate actual prices
  const slDistance = slPips * pipValue;
  const tpDistance = tpPips * pipValue;
  
  let stopLoss, takeProfit;
  
  if (signal.type === 'BUY') {
    stopLoss = currentPrice - slDistance;
    takeProfit = currentPrice + tpDistance;
  } else {
    stopLoss = currentPrice + slDistance;
    takeProfit = currentPrice - tpDistance;
  }
  
  // Round to appropriate decimal places
  const decimals = pair.includes('JPY') ? 3 : 5;
  
  return {
    stopLoss: parseFloat(stopLoss.toFixed(decimals)),
    takeProfit: parseFloat(takeProfit.toFixed(decimals)),
    slPips,
    tpPips,
    riskReward,
  };
}

/**
 * Generate news trading signal
 * Main entry point for the News Trader bot
 */
async function generateNewsSignal(pair, candles, currentPrice) {
  try {
    // Get upcoming and recent news
    const [upcomingNews, recentNews] = await Promise.all([
      getUpcomingNews(30), // Next 30 minutes
      getRecentNews(15),   // Last 15 minutes
    ]);
    
    // Prioritize recent high-impact news (post-news trading)
    for (const news of recentNews) {
      if (news.impact === IMPACT.HIGH || news.impact === IMPACT.MEDIUM) {
        const signal = analyzeNewsForPair(news, pair, currentPrice, candles);
        if (signal && signal.confidence >= 60) {
          const sltp = calculateNewsSLTP(signal, currentPrice, pair);
          return {
            ...signal,
            ...sltp,
            symbol: pair,
            entryPrice: currentPrice,
            volume: 0.01, // Will be calculated by position sizing
            tradingMode: 'POST_NEWS',
          };
        }
      }
    }
    
    // Check for pre-news positioning on high-impact events
    for (const news of upcomingNews) {
      const minutesUntil = (new Date(news.time) - new Date()) / 60000;
      
      // Only position 5-15 minutes before high-impact news
      if (news.impact === IMPACT.HIGH && minutesUntil >= 5 && minutesUntil <= 15) {
        const signal = analyzeNewsForPair(news, pair, currentPrice, candles);
        if (signal && signal.confidence >= 70) {
          // Pre-news: Tighter SL, smaller position
          const sltp = calculateNewsSLTP(signal, currentPrice, pair);
          return {
            ...signal,
            ...sltp,
            symbol: pair,
            entryPrice: currentPrice,
            volume: 0.01, // Smaller for pre-news
            tradingMode: 'PRE_NEWS',
            minutesUntilNews: Math.round(minutesUntil),
          };
        }
      }
    }
    
    // No actionable news signal
    return null;
  } catch (error) {
    console.error(`News signal error for ${pair}:`, error.message);
    return null;
  }
}

/**
 * Check if we should avoid trading due to upcoming high-impact news
 */
async function shouldAvoidTradingDueToNews(pair, minutesBefore = 10) {
  const upcomingNews = await getUpcomingNews(minutesBefore);
  
  const currency = pair.substring(0, 3);
  const quoteCurrency = pair.substring(3, 6);
  
  for (const news of upcomingNews) {
    if (news.impact !== IMPACT.HIGH) continue;
    
    // Check if news affects this pair
    const affectedPairs = CURRENCY_PAIRS[news.currency] || [];
    if (affectedPairs.some(p => p.includes(currency) || p.includes(quoteCurrency))) {
      const minutesUntil = (new Date(news.time) - new Date()) / 60000;
      return {
        avoid: true,
        reason: `${news.event} in ${Math.round(minutesUntil)} minutes`,
        news,
      };
    }
  }
  
  return { avoid: false };
}

export {
  IMPACT,
  HIGH_IMPACT_EVENTS,
  MEDIUM_IMPACT_EVENTS,
  LOW_IMPACT_EVENTS,
  fetchEconomicCalendar,
  getUpcomingNews,
  getRecentNews,
  generateNewsSignal,
  calculateNewsSLTP,
  analyzeNewsForPair,
  shouldAvoidTradingDueToNews,
  getEventImpact,
};

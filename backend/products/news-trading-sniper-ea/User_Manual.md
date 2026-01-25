# NEWS TRADING SNIPER EA
## Automated High-Impact News Event Trading

---

## USER MANUAL v2.0

---

## TABLE OF CONTENTS

1. Introduction
2. How News Trading Works
3. System Requirements
4. Installation Guide
5. Input Parameters
6. Trading Strategies
7. News Calendar Integration
8. Risk Management
9. Best Practices
10. FAQ

---

## 1. INTRODUCTION

### What is News Trading Sniper?

News Trading Sniper is an Expert Advisor designed to capitalize on the high volatility that occurs during major economic news releases. It automatically:

- Monitors the economic calendar
- Places strategic orders before news
- Manages positions during news events
- Captures explosive moves safely

### Key Features

- **Built-in News Calendar**: Auto-fetches news events
- **Multiple Strategies**: Straddle, fade, momentum
- **Spread Protection**: Avoids trading during spread spikes
- **Automatic Timing**: Places orders at precise times
- **Risk Controls**: Prevents excessive losses

### Why Trade News?

**Opportunity**:
- 100-500 pip moves in minutes
- Predictable timing (scheduled events)
- Clear cause-and-effect relationship

**Challenge**:
- Extremely fast moves
- Wide spreads
- Whipsaws common

**Solution**: This EA handles the speed and timing automatically.

---

## 2. HOW NEWS TRADING WORKS

### The News Cycle

1. **Pre-News** (30-60 min before)
   - Market consolidates
   - Traders position for news
   - Volatility drops

2. **News Release** (0-5 min)
   - Data released
   - Massive volatility spike
   - Spread widens dramatically
   - Price moves 50-200+ pips

3. **Post-News** (5-30 min after)
   - Spread normalizes
   - Trend may continue or reverse
   - "Fade" opportunities appear

### Major News Events (Gold/Forex)

| Event | Impact | Typical Move |
|-------|--------|--------------|
| FOMC Decision | EXTREME | 200-500 pips |
| NFP | EXTREME | 150-400 pips |
| CPI | HIGH | 100-300 pips |
| Fed Chair Speech | HIGH | 100-250 pips |
| GDP | MEDIUM | 50-150 pips |
| Retail Sales | MEDIUM | 50-150 pips |

---

## 3. SYSTEM REQUIREMENTS

### Requirements

- MetaTrader 5 (Build 3000+)
- Stable internet connection
- ECN/STP broker preferred
- Low latency connection

### Broker Considerations

**Critical**:
- Fast execution (< 100ms)
- Reasonable spread spikes
- No restrictions on news trading
- Allow pending orders

**Check with broker**:
- Some brokers restrict news trading
- Some freeze execution during news
- Ask before using this EA

---

## 4. INSTALLATION GUIDE

### Step 1: Install EA

1. Open MetaTrader 5
2. File → Open Data Folder
3. Navigate to MQL5 → Experts
4. Copy `NewsTradingSniper.ex5`
5. Restart MT5

### Step 2: Add to Chart

1. Open XAUUSD or desired pair
2. Timeframe: M5 recommended
3. Drag EA onto chart
4. Enable "Allow Algo Trading"
5. Configure settings
6. Click OK

### Step 3: Verify News Feed

Check Experts tab for:
"News Calendar loaded: X events this week"

---

## 5. INPUT PARAMETERS

### News Filter Settings

| Parameter | Default | Description |
|-----------|---------|-------------|
| TradeHighImpact | true | Trade red news events |
| TradeMediumImpact | false | Trade orange events |
| TradeLowImpact | false | Trade yellow events |
| NewsCountries | "USD" | Countries to trade |
| SpecificEvents | "" | Only these events |
| ExcludeEvents | "" | Never trade these |

### Strategy Settings

| Parameter | Default | Description |
|-----------|---------|-------------|
| Strategy | Straddle | Straddle, Fade, or Momentum |
| MinutesBeforeNews | 2 | Place orders X min before |
| RemoveOrdersAfter | 10 | Cancel unfilled after X min |
| OrderDistance | 20 | Distance from price (pips) |

### Straddle Strategy

| Parameter | Default | Description |
|-----------|---------|-------------|
| BuyStopDistance | 15 | Buy stop above price |
| SellStopDistance | 15 | Sell stop below price |
| StopLoss | 30 | SL for both orders |
| TakeProfit | 60 | TP for both orders |
| OCO_Mode | true | Cancel other if one fills |

### Fade Strategy

| Parameter | Default | Description |
|-----------|---------|-------------|
| FadeAfterMinutes | 5 | Minutes after news to fade |
| FadeMinMove | 30 | Minimum move to fade |
| FadeSL | 25 | Stop loss for fade |
| FadeTP | 50 | Take profit for fade |

### Risk Management

| Parameter | Default | Description |
|-----------|---------|-------------|
| RiskPercent | 1.0 | Risk per news event |
| MaxSpread | 50 | Max spread to execute |
| MaxSlippage | 30 | Max slippage allowed |
| MaxDailyRisk | 3.0 | Max daily risk % |
| MaxEventsPerDay | 2 | Max events to trade |

### Timing Controls

| Parameter | Default | Description |
|-----------|---------|-------------|
| UseServerTime | true | Use broker time |
| TimeOffset | 0 | Adjust time if needed |

---

## 6. TRADING STRATEGIES

### Strategy 1: Straddle

**Concept**: Place orders BOTH directions, let market choose

**Setup**:
```
2 minutes before NFP:
- Buy Stop at Current Price + 15 pips
- Sell Stop at Current Price - 15 pips
- SL: 30 pips
- TP: 60 pips
- OCO: If one fills, cancel other
```

**How It Works**:
1. Orders placed before news
2. News releases
3. Price spikes one direction
4. One order triggers
5. Other order cancelled (OCO)
6. Trade rides the momentum

**Pros**: Don't need to predict direction
**Cons**: Can get whipsawed if price spikes both ways

### Strategy 2: Fade

**Concept**: Trade AGAINST the initial move after it exhausts

**Setup**:
```
Wait 5 minutes after news
If price moved +50 pips:
- Sell limit at current price
- SL: 25 pips above
- TP: 50 pips below (back to pre-news)
```

**How It Works**:
1. Initial spike happens
2. Wait for exhaustion
3. Enter opposite direction
4. Target: Return to mean

**Pros**: High win rate when timed correctly
**Cons**: Can get crushed if trend continues

### Strategy 3: Momentum

**Concept**: Trade WITH the move after confirmation

**Setup**:
```
Wait for clear breakout direction
Enter in direction of break
Trail stop aggressively
```

**How It Works**:
1. News releases
2. Wait for spread to normalize
3. Identify clear direction
4. Enter with the trend
5. Trail stop to lock profits

**Pros**: Catches extended moves
**Cons**: Late entry reduces profit potential

---

## 7. NEWS CALENDAR INTEGRATION

### Automatic News Feed

The EA fetches news automatically from:
- Built-in economic calendar
- Major news providers

### Manual News Entry

You can also specify news times manually:

```
ManualNewsTime1 = "2026-01-15 13:30"
ManualNewsTime2 = "2026-01-16 19:00"
```

### Event Filtering

**Trade Only Specific Events**:
```
SpecificEvents = "FOMC,NFP,CPI"
```

**Exclude Certain Events**:
```
ExcludeEvents = "Unemployment Claims,ISM"
```

---

## 8. RISK MANAGEMENT

### News Trading Risks

1. **Spread Explosion**: 30-100+ point spreads
2. **Slippage**: Filled far from requested price
3. **Whipsaws**: Price spikes both directions
4. **Broker Issues**: Freeze, requotes, disconnects

### How EA Protects You

**Spread Filter**:
- Won't execute if spread > MaxSpread
- Waits for spread to normalize

**Slippage Control**:
- Maximum slippage parameter
- Rejects fills beyond limit

**Position Sizing**:
- Risk-based sizing
- Never risks more than specified %

**Daily Limits**:
- Max events per day
- Max daily risk

### Recommended Risk Settings

**Conservative**:
```
RiskPercent = 0.5%
MaxEventsPerDay = 1
Strategy = Fade
```

**Moderate**:
```
RiskPercent = 1.0%
MaxEventsPerDay = 2
Strategy = Straddle
```

**Aggressive** (Experienced only):
```
RiskPercent = 2.0%
MaxEventsPerDay = 3
Strategy = Momentum
```

---

## 9. BEST PRACTICES

### Do's

✅ **Test on demo first**
News trading is risky - practice first

✅ **Start with one event type**
Master FOMC before trying others

✅ **Use conservative sizing**
News can be unpredictable

✅ **Check broker compatibility**
Not all brokers allow news trading

✅ **Monitor first few trades**
Make sure EA behaves as expected

### Don'ts

❌ **Don't trade every event**
Focus on highest impact only

❌ **Don't use on regular brokers**
Need ECN/STP for execution

❌ **Don't risk too much**
One bad news event shouldn't hurt you

❌ **Don't leave unattended initially**
Monitor until confident in EA

---

## 10. FAQ

### Q: Can I use this on any pair?

A: Optimized for XAUUSD and major USD pairs. Works best on high-liquidity instruments.

### Q: What if my broker freezes during news?

A: This is a broker issue, not EA issue. Consider changing brokers.

### Q: Why didn't the EA trade the last news?

A: Check: Was spread too wide? Was it filtered out? Check Experts tab for reason.

### Q: Can I run this with other EAs?

A: Yes, but be mindful of total risk exposure.

### Q: What's the expected win rate?

A: Straddle: 40-50% (but winners are larger)
Fade: 55-65%
Momentum: 45-55%

### Q: Does this work on prop firm accounts?

A: Check your prop firm's rules - some restrict news trading.

---

## INCLUDED FILES

- NewsTradingSniper.ex5 - The EA
- Settings_Straddle.set
- Settings_Fade.set
- Settings_Momentum.set
- NewsCalendar_Major.txt - Major events reference

---

## SUPPORT

For technical support:
- WhatsApp: +254 704 618 663
- Telegram: @market_masterrer
- Email: kbonface03@gmail.com

---

© 2026 AlgoEdge. All Rights Reserved.

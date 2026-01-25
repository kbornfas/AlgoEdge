# SILVER TREND RIDER EA
## Complete User Manual v2.0

### Automated Trend Trading for XAGUSD

---

## TABLE OF CONTENTS

1. Introduction
2. System Requirements
3. Installation Guide
4. Input Parameters
5. Trading Strategy Explained
6. Risk Management
7. Best Practices
8. Optimization Guide
9. Troubleshooting
10. FAQ

---

## 1. INTRODUCTION

### What is Silver Trend Rider EA?

Silver Trend Rider is an Expert Advisor designed specifically for XAGUSD (Silver) trading. Unlike gold, silver has unique volatility patterns and market behavior that require specialized algorithms.

### Key Features

- **Trend Detection**: Advanced multi-timeframe trend analysis
- **Volatility Adaptation**: Adjusts to silver's high volatility
- **Session Filtering**: Trades only during optimal hours
- **Auto Money Management**: Risk-based lot sizing
- **Partial Closes**: Lock in profits progressively
- **News Filter**: Avoid trading during high-impact events
- **Spread Protection**: Skip trades when spreads are too wide

### Performance Characteristics

- **Expected Monthly Return**: 5-15% (depending on settings)
- **Maximum Drawdown**: <20% (with recommended settings)
- **Win Rate**: 58-65%
- **Average Trade Duration**: 2-12 hours
- **Trading Frequency**: 3-8 trades per week

---

## 2. SYSTEM REQUIREMENTS

### Minimum Requirements

- **Platform**: MetaTrader 5 (Build 3000+)
- **Broker**: Any broker with XAGUSD
- **Spread**: Maximum 30 points recommended
- **Minimum Balance**: $500 (micro lots)
- **Leverage**: 1:100 minimum recommended

### Recommended Requirements

- **Balance**: $2,000+ for optimal lot sizes
- **Spread**: Under 20 points
- **VPS**: For 24/5 operation
- **Internet**: Stable connection

### Broker Requirements

| Feature | Requirement |
|---------|-------------|
| Execution | ECN/STP preferred |
| Spread | Under 30 points |
| Commission | Under $7 per lot RT |
| XAGUSD Available | Yes |
| Hedging | Not required |

---

## 3. INSTALLATION GUIDE

### Step 1: Download Files

Ensure you have:
- SilverTrendRider.ex5
- Settings files (.set)
- This manual (PDF)

### Step 2: Install EA

1. Open MetaTrader 5
2. Go to File → Open Data Folder
3. Navigate to MQL5 → Experts
4. Copy `SilverTrendRider.ex5` to this folder
5. Restart MetaTrader 5

### Step 3: Add to Chart

1. Open XAGUSD chart
2. Set timeframe to H1
3. Go to Navigator → Expert Advisors
4. Drag "SilverTrendRider" onto chart
5. Check "Allow Algo Trading"
6. Click OK

### Step 4: Load Settings

1. Right-click EA in chart corner
2. Select "Properties"
3. Click "Load" button
4. Choose appropriate .set file
5. Click OK

### Step 5: Verify Operation

- AutoTrading button should be GREEN
- EA smiley face should appear on chart
- Check "Experts" tab for initialization message

---

## 4. INPUT PARAMETERS

### Core Settings

| Parameter | Default | Description |
|-----------|---------|-------------|
| TradingMode | Auto | Auto, Manual_Signal, Disabled |
| MagicNumber | 354789 | Unique identifier for EA trades |
| TradeComment | "SilverTrend" | Comment for trades |

### Trend Analysis

| Parameter | Default | Description |
|-----------|---------|-------------|
| TrendPeriod | 50 | EMA period for trend detection |
| TrendFilter | 100 | Higher TF EMA for confirmation |
| MinTrendStrength | 0.002 | Minimum trend slope required |
| UseHTFFilter | true | Require higher TF confirmation |

### Entry Settings

| Parameter | Default | Description |
|-----------|---------|-------------|
| EntryMode | Pullback | Pullback or Breakout |
| PullbackPercent | 38.2 | Fibonacci retracement level |
| RSI_Period | 14 | RSI period for entry |
| RSI_OB | 70 | RSI overbought level |
| RSI_OS | 30 | RSI oversold level |

### Risk Management

| Parameter | Default | Description |
|-----------|---------|-------------|
| RiskMode | Percent | Fixed, Percent, or Martingale |
| RiskPercent | 1.5 | Risk per trade (% of balance) |
| FixedLots | 0.1 | Fixed lot size if RiskMode=Fixed |
| MaxLots | 2.0 | Maximum lot size allowed |
| MaxDailyTrades | 5 | Max trades per day |
| MaxDailyDrawdown | 5.0 | Max daily loss (% of balance) |

### Stop Loss & Take Profit

| Parameter | Default | Description |
|-----------|---------|-------------|
| SL_Mode | ATR | Fixed, ATR, or Structure |
| SL_Points | 500 | Fixed SL in points |
| ATR_Multiplier | 2.0 | ATR multiplier for SL |
| TP_Mode | RiskReward | Fixed, ATR, or RiskReward |
| RiskRewardRatio | 2.0 | TP as multiple of SL |
| UseTrailing | true | Enable trailing stop |
| TrailingStart | 300 | Points in profit to start trail |
| TrailingStep | 100 | Trailing step in points |

### Partial Close

| Parameter | Default | Description |
|-----------|---------|-------------|
| UsePartialClose | true | Enable partial profit taking |
| PartialClose1_Pct | 50 | % to close at first target |
| PartialClose1_RR | 1.0 | First target (R multiple) |
| PartialClose2_Pct | 25 | % to close at second target |
| PartialClose2_RR | 1.5 | Second target (R multiple) |

### Session Filter

| Parameter | Default | Description |
|-----------|---------|-------------|
| UseSessionFilter | true | Trade only during set hours |
| TradingStartHour | 8 | Start hour (server time) |
| TradingEndHour | 20 | End hour (server time) |
| TradeMonday | true | Allow Monday trading |
| TradeFriday | true | Allow Friday trading |
| FridayCloseHour | 18 | Close all trades by this hour |

### Spread & Slippage

| Parameter | Default | Description |
|-----------|---------|-------------|
| MaxSpread | 30 | Maximum spread in points |
| MaxSlippage | 20 | Maximum slippage in points |
| UseNewsFilter | true | Avoid trading during news |
| NewsMinutesBefore | 60 | Minutes before news to stop |
| NewsMinutesAfter | 30 | Minutes after news to resume |

---

## 5. TRADING STRATEGY EXPLAINED

### Overview

Silver Trend Rider uses a trend-following approach optimized for silver's unique characteristics:

1. **Trend Identification**: Multi-timeframe EMA analysis
2. **Entry Timing**: Pullback to dynamic support/resistance
3. **Confirmation**: RSI and price action filters
4. **Exit Strategy**: Trailing stop with partial closes

### Step-by-Step Logic

#### Step 1: Identify Trend

```
If Price > EMA(50) AND EMA(50) > EMA(100):
    Trend = BULLISH
If Price < EMA(50) AND EMA(50) < EMA(100):
    Trend = BEARISH
Otherwise:
    Trend = NEUTRAL (no trading)
```

#### Step 2: Wait for Pullback

```
BULLISH PULLBACK:
    Price retraces to EMA(50) or 38.2% Fibonacci

BEARISH PULLBACK:
    Price rallies to EMA(50) or 38.2% Fibonacci
```

#### Step 3: Entry Confirmation

```
BUY Conditions:
    - Trend is BULLISH
    - Price touched/near EMA(50)
    - RSI was below 40, now turning up
    - Spread < MaxSpread
    - Within trading hours

SELL Conditions:
    - Trend is BEARISH
    - Price touched/near EMA(50)
    - RSI was above 60, now turning down
    - Spread < MaxSpread
    - Within trading hours
```

#### Step 4: Trade Management

```
ON ENTRY:
    - Set SL based on ATR or structure
    - Set TP based on Risk/Reward ratio

ON PARTIAL TARGET 1:
    - Close 50% of position
    - Move SL to breakeven

ON PARTIAL TARGET 2:
    - Close 25% of position
    - Enable trailing stop

ON FINAL TARGET:
    - Close remaining 25%
    - Or let trailing stop close
```

### Why This Works on Silver

Silver has characteristics that make this strategy effective:

1. **Strong Trends**: Silver makes longer trending moves than most forex pairs
2. **Deep Pullbacks**: Silver often retraces 38-50% before continuing
3. **Technical Respect**: Silver follows EMAs and Fibonacci levels well
4. **Volatility**: Higher ATR means better risk/reward opportunities

---

## 6. RISK MANAGEMENT

### Position Sizing

The EA calculates position size based on:

```
Lot Size = (Balance × Risk%) / (SL in Points × Point Value)
```

### Example Calculation

- Balance: $5,000
- Risk: 1.5% = $75
- Stop Loss: 400 points
- Point Value: $0.50 per point (mini lot)

```
Lot Size = $75 / (400 × $0.50) = $75 / $200 = 0.375
Rounded to: 0.37 lots
```

### Risk Guidelines by Account Size

| Account | Recommended Risk | Expected Monthly P/L |
|---------|------------------|----------------------|
| $500-$1,000 | 1.0% | $25-$100 |
| $1,000-$5,000 | 1.5% | $75-$500 |
| $5,000-$10,000 | 1.5-2.0% | $250-$1,500 |
| $10,000+ | 1.0-1.5% | $500-$1,500 |

### Daily Loss Limits

The EA enforces:
- Maximum 5 trades per day (default)
- Maximum 5% daily loss (default)
- No new trades after hitting limits

---

## 7. BEST PRACTICES

### Do's

✅ **Do use recommended timeframe (H1)**
✅ **Do run on VPS for consistent execution**
✅ **Do monitor trades during first 2 weeks**
✅ **Do keep risk at 1-2% per trade**
✅ **Do use ECN broker with tight spreads**
✅ **Do update EA when new versions released**
✅ **Do check logs weekly for errors**

### Don'ts

❌ **Don't use on other symbols without testing**
❌ **Don't increase risk after losses**
❌ **Don't run multiple instances on same pair**
❌ **Don't turn off during open trades**
❌ **Don't trade during extreme news events**
❌ **Don't expect profits every single week**

### Recommended Weekly Checks

1. Review trade journal in history
2. Check maximum spread encountered
3. Verify no unexpected errors in log
4. Confirm VPS uptime was 99%+
5. Review any losing trades for patterns

---

## 8. OPTIMIZATION GUIDE

### Backtesting Setup

1. Symbol: XAGUSD
2. Timeframe: H1
3. Date Range: Minimum 2 years
4. Modeling: Every tick based on real ticks
5. Initial Deposit: Match your live account

### Key Parameters to Optimize

1. **TrendPeriod**: Test 40-60 in steps of 5
2. **ATR_Multiplier**: Test 1.5-2.5 in steps of 0.25
3. **RiskRewardRatio**: Test 1.5-2.5 in steps of 0.25
4. **PullbackPercent**: Test 30-50 in steps of 5

### Optimization Tips

- Start with 2-3 parameters maximum
- Use genetic algorithm for speed
- Verify results with forward test
- Avoid over-optimization (curve fitting)
- Use Out-of-Sample validation

### Performance Metrics to Watch

| Metric | Minimum Target |
|--------|----------------|
| Profit Factor | > 1.5 |
| Win Rate | > 55% |
| Max Drawdown | < 25% |
| Recovery Factor | > 2.0 |
| Sharpe Ratio | > 1.0 |

---

## 9. TROUBLESHOOTING

### EA Not Trading

**Symptoms**: EA is on chart but no trades

**Checks**:
1. Is AutoTrading enabled? (Green button)
2. Is it within trading hours?
3. Is spread too wide?
4. Has daily limit been hit?
5. Is there a valid trend?

**Solutions**:
- Enable AutoTrading
- Check TradingStartHour/TradingEndHour
- Use broker with tighter spreads
- Reset by removing and re-adding EA

### Unexpected Losses

**Possible Causes**:
- Slippage during news
- Spread widening
- VPS disconnection
- Incorrect settings

**Solutions**:
- Enable news filter
- Increase MaxSpread
- Use reliable VPS
- Load default settings

### High Drawdown

**Possible Causes**:
- Risk too high
- Recent market conditions unfavorable
- Wrong optimization period

**Solutions**:
- Reduce RiskPercent to 1%
- Pause EA during unusual markets
- Re-optimize with recent data

### Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| 10004 | Requote | Increase slippage |
| 10006 | Rejected | Check account permissions |
| 10014 | Invalid volume | Check MinLot/MaxLot |
| 10015 | Invalid price | Restart EA |
| 10018 | Market closed | Wait for market open |

---

## 10. FAQ

### Q: Can I use this on XAUUSD?

A: No, this EA is optimized specifically for XAGUSD. Use our Gold Scalper Pro EA for gold trading.

### Q: What's the best timeframe?

A: H1 is the recommended and tested timeframe. Other timeframes require re-optimization.

### Q: How much capital do I need?

A: Minimum $500 for micro lots, recommended $2,000+ for better lot sizing flexibility.

### Q: Can I run this alongside other EAs?

A: Yes, as long as they use different Magic Numbers and don't trade XAGUSD.

### Q: How do I update the EA?

A: Replace the .ex5 file in MQL5/Experts folder and restart MT5. Settings are preserved.

### Q: What's the expected monthly return?

A: Conservative settings: 3-5%. Moderate: 5-10%. Aggressive: 10-20% (higher risk).

### Q: Should I use a VPS?

A: Highly recommended for consistent execution, especially if your internet is unstable.

### Q: How do I know if the EA is working correctly?

A: Check the Experts tab for "Silver Trend Rider initialized successfully" message. Also verify trades match the entry criteria described in this manual.

---

## SUPPORT

For technical support:
- WhatsApp: +254 704 618 663
- Telegram: @market_masterrer
- Email: kbonface03@gmail.com

---

## RISK DISCLAIMER

Trading foreign exchange on margin carries a high level of risk and may not be suitable for all investors. Past performance is not indicative of future results. Only trade with money you can afford to lose.

---

© 2026 AlgoEdge. All Rights Reserved.

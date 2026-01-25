# Gold Scalper Pro EA - Complete User Manual

## Table of Contents
1. Introduction
2. Installation Guide
3. Settings Explained
4. Trading Strategy Logic
5. Risk Management
6. Optimization Tips
7. Troubleshooting
8. FAQs

---

## 1. Introduction

Gold Scalper Pro EA is a professional automated trading system designed specifically for trading XAUUSD (Gold) on the MetaTrader 5 platform. The EA uses a combination of technical indicators and price action to identify high-probability scalping opportunities during the most active trading sessions.

### Key Features:
- Optimized for M5 and M15 timeframes
- Smart spread filter to avoid high-spread periods
- Dynamic lot sizing based on account balance
- Built-in news filter
- Trailing stop and break-even functionality
- Maximum daily loss protection

### Performance Expectations:
- Win Rate: 68-75%
- Average Trade Duration: 15-45 minutes
- Risk per Trade: 1-2% of account balance
- Monthly Return Target: 8-15%

---

## 2. Installation Guide

### Step 1: Download the EA File
Download `Gold_Scalper_Pro.ex5` from your purchase dashboard.

### Step 2: Locate MT5 Data Folder
1. Open MetaTrader 5
2. Click File → Open Data Folder
3. Navigate to: MQL5 → Experts

### Step 3: Copy the EA
Copy `Gold_Scalper_Pro.ex5` to the Experts folder.

### Step 4: Restart MT5
Close and reopen MetaTrader 5.

### Step 5: Attach to Chart
1. Open XAUUSD chart (M5 or M15 timeframe)
2. Go to Navigator panel (Ctrl+N)
3. Find Gold Scalper Pro under Expert Advisors
4. Drag and drop onto chart
5. Enable "Allow Algo Trading"

### Step 6: Verify Installation
- Green smiley face in top-right corner = EA is active
- Red icon = Check AutoTrading button

---

## 3. Settings Explained

### Risk Management Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Risk_Percent | 2.0 | Risk per trade as % of balance |
| Max_Daily_Loss_Percent | 5.0 | Stop trading if daily loss exceeds this |
| Max_Spread | 30 | Maximum spread in points to open trade |
| Max_Slippage | 10 | Maximum slippage allowed |

### Trading Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Magic_Number | 123456 | Unique ID for EA's trades |
| Trade_Comment | "GSP_EA" | Comment on trades |
| Trade_London | true | Trade during London session |
| Trade_NewYork | true | Trade during New York session |
| Trade_Asian | false | Trade during Asian session |

### Entry Settings

| Setting | Default | Description |
|---------|---------|-------------|
| RSI_Period | 14 | RSI indicator period |
| RSI_Oversold | 30 | RSI oversold level for buy |
| RSI_Overbought | 70 | RSI overbought level for sell |
| BB_Period | 20 | Bollinger Bands period |
| BB_Deviation | 2.0 | Bollinger Bands deviation |

### Exit Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Take_Profit_Pips | 50 | Fixed take profit in pips |
| Stop_Loss_Pips | 25 | Fixed stop loss in pips |
| Use_Trailing_Stop | true | Enable trailing stop |
| Trailing_Start | 20 | Pips in profit before trailing starts |
| Trailing_Step | 10 | Trailing step in pips |
| Use_Break_Even | true | Move SL to breakeven |
| Break_Even_Pips | 15 | Pips in profit for breakeven |

---

## 4. Trading Strategy Logic

### Entry Conditions (BUY)
1. Price touches or breaks below lower Bollinger Band
2. RSI below 30 (oversold)
3. Price shows bullish rejection candle
4. Spread is below maximum allowed
5. Within active trading session

### Entry Conditions (SELL)
1. Price touches or breaks above upper Bollinger Band
2. RSI above 70 (overbought)
3. Price shows bearish rejection candle
4. Spread is below maximum allowed
5. Within active trading session

### Exit Logic
1. Fixed Take Profit hit
2. Fixed Stop Loss hit
3. Trailing Stop triggered
4. Daily loss limit reached
5. End of trading session (optional)

### Confluence Scoring
The EA uses a scoring system:
- BB touch: +2 points
- RSI extreme: +2 points
- Rejection candle: +1 point
- Session timing: +1 point

Minimum 4 points required to enter trade.

---

## 5. Risk Management

### Position Sizing Formula
```
Lot Size = (Account Balance × Risk%) / (Stop Loss Pips × Pip Value)
```

### Example:
- Account: $10,000
- Risk: 2%
- Stop Loss: 25 pips
- Pip Value for XAUUSD: ~$1 per 0.01 lot

```
Lot Size = ($10,000 × 0.02) / (25 × $10) = $200 / $250 = 0.08 lots
```

### Daily Loss Protection
When daily loss reaches the set percentage:
1. All open trades are closed
2. No new trades opened until next day
3. Reset happens at 00:00 server time

### Recommended Account Sizes

| Account Size | Max Lot | Risk/Trade |
|--------------|---------|------------|
| $500 | 0.02 | 2% |
| $1,000 | 0.05 | 2% |
| $5,000 | 0.25 | 2% |
| $10,000 | 0.50 | 2% |

---

## 6. Optimization Tips

### Best Practices
1. **Use VPS**: 24/7 connection is crucial for scalping
2. **ECN Broker**: Low spreads on Gold are essential
3. **Sufficient Balance**: Minimum $500 recommended
4. **Don't Over-Optimize**: Stick to default settings initially

### Timeframe Selection
- **M5**: More trades, slightly lower win rate
- **M15**: Fewer trades, higher quality setups

### Session Optimization
- **London Session**: Best for trend-following moves
- **New York Session**: Good for breakouts
- **Overlap (13:00-17:00 GMT)**: Highest volatility

### Avoiding Over-Trading
Set `Max_Trades_Per_Day` to limit daily trades:
- Conservative: 3 trades
- Moderate: 5 trades
- Aggressive: 10 trades

---

## 7. Troubleshooting

### EA Not Trading
1. ✅ Check AutoTrading is enabled (Ctrl+E)
2. ✅ Verify smiley face is green
3. ✅ Check spread is below maximum
4. ✅ Confirm trading session is active
5. ✅ Check if daily loss limit reached

### Trades Not Closing
1. ✅ Verify TP/SL are set correctly
2. ✅ Check if trailing stop is enabled
3. ✅ Ensure broker allows modifications

### High Drawdown
1. ✅ Reduce Risk_Percent setting
2. ✅ Increase Stop_Loss_Pips
3. ✅ Disable aggressive sessions

### No Smiley Face
1. ✅ Enable "Allow Algo Trading" in EA properties
2. ✅ Enable AutoTrading in platform
3. ✅ Check if EA is allowed by broker

---

## 8. FAQs

**Q: Can I use this on multiple charts?**
A: Yes, but use different Magic Numbers for each instance.

**Q: Does it work on other pairs?**
A: It's optimized for XAUUSD only. Other pairs may work but aren't tested.

**Q: How often should I check on it?**
A: Daily review is recommended. Check drawdown and performance weekly.

**Q: Can I use it during news?**
A: The EA has a news filter. Keep it enabled to avoid volatility spikes.

**Q: What if my broker has high spreads?**
A: Increase `Max_Spread` setting or find a better broker for Gold trading.

**Q: Is past performance guaranteed?**
A: No. Past results don't guarantee future performance. Trade responsibly.

---

## Support

For technical support, contact us via:
- WhatsApp: +254 704 618 663
- Telegram: @market_masterrer
- Email: kbonface03@gmail.com

---

**RISK DISCLAIMER**: Trading forex and CFDs carries significant risk. Past performance is not indicative of future results. Only trade with money you can afford to lose.

© 2026 AlgoEdge. All rights reserved.

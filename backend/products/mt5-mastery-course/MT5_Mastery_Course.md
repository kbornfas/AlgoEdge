# MT5 MASTERY COURSE
## Complete Guide to MetaTrader 5 Platform

---

## COURSE OVERVIEW

Welcome to the MT5 Mastery Course! This comprehensive course takes you from complete beginner to advanced MT5 user. By the end, you'll be able to:

- Navigate MT5 like a pro
- Customize charts for optimal analysis
- Use all order types effectively
- Install and configure Expert Advisors
- Set up proper risk management tools
- Backtest strategies efficiently
- Troubleshoot common issues

---

## MODULE 1: MT5 FUNDAMENTALS

### Lesson 1.1: Introduction to MetaTrader 5

**What is MetaTrader 5?**

MetaTrader 5 (MT5) is the most popular trading platform for forex and CFD trading. It's used by millions of traders worldwide for:

- Forex trading
- Stock trading
- Commodity trading (Gold, Silver, Oil)
- Index trading
- Cryptocurrency trading

**MT5 vs MT4**

| Feature | MT4 | MT5 |
|---------|-----|-----|
| Timeframes | 9 | 21 |
| Pending Orders | 4 types | 6 types |
| Economic Calendar | No | Built-in |
| Market Depth | No | Yes |
| Netting/Hedging | Hedging only | Both |
| Strategy Tester | Single | Multi-threaded |

**Key Advantages of MT5**:
- More timeframes for analysis
- Better backtesting speed
- Built-in economic calendar
- Market depth (DOM)
- More technical indicators

### Lesson 1.2: Installing MT5

**Step 1: Download**
1. Go to your broker's website
2. Look for "Platforms" or "Download MT5"
3. Download the installer

**Step 2: Install**
1. Run the installer
2. Accept terms and conditions
3. Choose installation folder
4. Click Install

**Step 3: First Launch**
1. Open MT5
2. Enter your account credentials
3. Select server
4. Click Login

**Troubleshooting Login Issues**:
- Wrong server? Check broker email for correct server
- Connection failed? Check internet/firewall
- Invalid password? Use the investor password for read-only

### Lesson 1.3: Platform Overview

**The MT5 Interface**

```
┌─────────────────────────────────────────────────────────────┐
│  File  View  Insert  Charts  Tools  Window  Help            │ <- Menu Bar
├─────────────────────────────────────────────────────────────┤
│  [Icons for common functions]                               │ <- Toolbar
├──────────┬──────────────────────────────────────────────────┤
│          │                                                  │
│  Market  │                                                  │
│  Watch   │              CHART AREA                          │
│          │                                                  │
├──────────┤                                                  │
│          │                                                  │
│Navigator │                                                  │
│          │                                                  │
├──────────┴──────────────────────────────────────────────────┤
│  Trade | Exposure | History | News | Mailbox | Alerts |     │ <- Terminal
└─────────────────────────────────────────────────────────────┘
```

**Key Windows**:
1. **Market Watch**: List of available instruments
2. **Navigator**: Access indicators, EAs, scripts
3. **Chart Window**: Where you analyze price
4. **Terminal**: Orders, history, alerts, news

---

## MODULE 2: CHART MASTERY

### Lesson 2.1: Opening and Managing Charts

**Opening a New Chart**:
1. Market Watch → Right-click symbol → Chart Window
2. Or: File → New Chart → Select symbol

**Chart Types**:
- **Bar Chart**: Shows OHLC with vertical bars
- **Candlestick**: Most popular, visual OHLC
- **Line Chart**: Closes only, simplified view

**Changing Chart Type**:
- Right-click chart → Properties → Common → Chart type
- Or use toolbar icons

### Lesson 2.2: Timeframes

**Available MT5 Timeframes**:

| Symbol | Period | Use Case |
|--------|--------|----------|
| M1 | 1 minute | Scalping, precise entries |
| M5 | 5 minutes | Short-term trading |
| M15 | 15 minutes | Intraday trading |
| M30 | 30 minutes | Intraday trading |
| H1 | 1 hour | Day trading, swing setup |
| H4 | 4 hours | Swing trading |
| D1 | Daily | Position trading, trend analysis |
| W1 | Weekly | Long-term analysis |
| MN | Monthly | Big picture view |

**Multi-Timeframe Analysis Approach**:
1. Higher timeframe: Identify trend
2. Middle timeframe: Find setup
3. Lower timeframe: Time entry

**Example**:
- D1: Uptrend confirmed
- H4: Pullback to support
- H1: Entry signal (bullish candle)

### Lesson 2.3: Chart Customization

**Changing Colors**:
1. Right-click chart → Properties
2. Colors tab
3. Customize:
   - Background
   - Foreground
   - Grid
   - Bull/Bear candles
   - Volumes

**Recommended Color Schemes**:

**Dark Theme (Easy on eyes)**:
- Background: Black (#000000)
- Foreground: White (#FFFFFF)
- Bull candles: Green (#00FF00)
- Bear candles: Red (#FF0000)

**Light Theme (Printing)**:
- Background: White (#FFFFFF)
- Foreground: Black (#000000)
- Bull candles: Green (#228B22)
- Bear candles: Red (#DC143C)

**Saving Templates**:
1. Set up your perfect chart
2. Right-click → Templates → Save Template
3. Name it (e.g., "MyGoldSetup")
4. Apply to other charts: Templates → Load Template

### Lesson 2.4: Drawing Tools

**Accessing Drawing Tools**:
- Insert menu → Objects
- Or use toolbar icons

**Essential Drawing Tools**:

**1. Horizontal Line**
- Mark support/resistance levels
- Shortcut: Click icon, click on price

**2. Trend Line**
- Connect swing highs or swing lows
- Click start point, drag to end point

**3. Rectangle**
- Mark zones (supply/demand, consolidation)
- Click top-left, drag to bottom-right

**4. Fibonacci Retracement**
- Click swing low, drag to swing high (uptrend)
- Click swing high, drag to swing low (downtrend)

**Professional Tip**: 
- Right-click any drawing → Properties
- Customize color, style, and ray options
- Enable "Ray Right" for lines to extend

---

## MODULE 3: TECHNICAL INDICATORS

### Lesson 3.1: Built-in Indicators

**Adding Indicators**:
1. Insert → Indicators → Category → Indicator
2. Or: Navigator → Indicators → Drag to chart

**Indicator Categories**:

**Trend Indicators**:
- Moving Averages (MA, EMA, SMA)
- MACD
- Parabolic SAR
- ADX
- Ichimoku

**Oscillators**:
- RSI
- Stochastic
- CCI
- Williams %R
- Momentum

**Volume Indicators**:
- Volumes
- OBV
- Accumulation/Distribution

**Bill Williams**:
- Alligator
- Fractals
- Awesome Oscillator

### Lesson 3.2: Essential Indicator Setup

**Moving Average (EMA 50)**:
1. Insert → Indicators → Trend → Moving Average
2. Period: 50
3. Method: Exponential
4. Apply to: Close
5. Color: Yellow

**RSI (14 Period)**:
1. Insert → Indicators → Oscillators → RSI
2. Period: 14
3. Levels: 30, 70
4. Color: Purple

**MACD Standard**:
1. Insert → Indicators → Oscillators → MACD
2. Fast EMA: 12
3. Slow EMA: 26
4. Signal SMA: 9

### Lesson 3.3: Custom Indicators

**Installing Custom Indicators**:
1. Download .ex5 or .mq5 file
2. File → Open Data Folder
3. Navigate to MQL5 → Indicators
4. Paste the file
5. Restart MT5 or refresh Navigator

**Finding the Indicator**:
- Navigator → Indicators → (look for your indicator name)
- Drag to chart and configure

---

## MODULE 4: ORDER MANAGEMENT

### Lesson 4.1: Order Types

**Market Orders**:
Execute immediately at current price

- **Buy**: Enter long position
- **Sell**: Enter short position

**Pending Orders**:
Execute when price reaches specified level

| Order Type | Description |
|------------|-------------|
| Buy Limit | Buy below current price |
| Sell Limit | Sell above current price |
| Buy Stop | Buy above current price |
| Sell Stop | Sell below current price |
| Buy Stop Limit | Combines stop and limit |
| Sell Stop Limit | Combines stop and limit |

### Lesson 4.2: Placing Orders

**Market Order (One-Click)**:
1. Enable one-click trading: Tools → Options → Trade → One Click Trading
2. Click chart area → Show "One-Click Trading" panel
3. Enter lot size
4. Click SELL or BUY

**Market Order (New Order Dialog)**:
1. Right-click chart → Trading → New Order
2. Or press F9
3. Select symbol
4. Choose volume (lot size)
5. Set SL and TP (optional but recommended)
6. Click Buy or Sell

**Pending Order**:
1. New Order (F9)
2. Type: Select pending order type
3. Price: Enter trigger price
4. Volume: Lot size
5. SL/TP: Stop loss and take profit
6. Expiration: When order expires (optional)
7. Click Place

### Lesson 4.3: Modifying and Closing Orders

**Modifying Open Orders**:
1. Terminal → Trade tab
2. Right-click on order → Modify or Delete
3. Change SL, TP, or other parameters
4. Click Modify

**Closing Orders**:
- Double-click order in Trade tab → Close
- Or right-click → Close Position

**Partial Close**:
1. Double-click order
2. Change volume to portion you want to close
3. Click Close

---

## MODULE 5: EXPERT ADVISORS

### Lesson 5.1: What Are Expert Advisors?

**Definition**:
Expert Advisors (EAs) are automated trading programs that:
- Execute trades automatically
- Follow programmed rules
- Run 24/5 without human intervention

**Benefits**:
- No emotional decisions
- Precise entry/exit
- Can monitor multiple markets
- Never sleeps

**Risks**:
- Technical failures
- Broker execution issues
- Market condition changes

### Lesson 5.2: Installing EAs

**Step 1: Locate the File**
- EA files end in .ex5 (compiled) or .mq5 (source)

**Step 2: Install**
1. File → Open Data Folder
2. Navigate to MQL5 → Experts
3. Paste the .ex5 file
4. Close folder

**Step 3: Refresh**
- Right-click Navigator → Refresh
- Or restart MT5

**Step 4: Attach to Chart**
1. Open chart of the pair EA should trade
2. Navigator → Expert Advisors
3. Drag EA to chart
4. Configure settings
5. Check "Allow Algo Trading"
6. Click OK

### Lesson 5.3: EA Configuration

**Common Settings Panel**:

**Common Tab**:
- Allow Algo Trading: MUST be enabled
- Allow DLL imports: Only if EA requires
- Allow external experts requests: For news/data

**Inputs Tab**:
- EA-specific parameters
- Lot size, risk %, indicators, etc.

**Loading Preset Settings (.set files)**:
1. In Inputs tab, click "Load"
2. Navigate to .set file
3. Select and click Open
4. Settings automatically populated

### Lesson 5.4: Enabling Auto Trading

**Global Enable**:
- Click "Algo Trading" button in toolbar
- Or: Tools → Options → Expert Advisors → Allow Algo Trading

**Per-EA Enable**:
- Must also enable in EA properties

**Visual Confirmation**:
- Smiley face on chart = EA active
- Unhappy face = Something disabled

---

## MODULE 6: BACKTESTING & OPTIMIZATION

### Lesson 6.1: Strategy Tester Overview

**Opening Strategy Tester**:
- View → Strategy Tester
- Or Ctrl+R

**Tester Interface**:
- Settings: Choose EA, symbol, timeframe
- Results: View completed tests
- Backtest: Historical simulation
- Optimization: Find best parameters

### Lesson 6.2: Running a Backtest

**Step-by-Step**:

1. **Select EA**: Choose from dropdown
2. **Symbol**: Select trading pair
3. **Timeframe**: Chart timeframe
4. **Date Range**: Start and end dates
5. **Modeling**: 
   - "Every tick" for accuracy
   - "Open prices only" for speed
6. **Deposit**: Starting balance
7. **Leverage**: Account leverage
8. **Click Start**

**Reading Results**:

| Metric | What It Means |
|--------|---------------|
| Net Profit | Total profit/loss |
| Profit Factor | Gross Profit / Gross Loss |
| Expected Payoff | Average profit per trade |
| Drawdown | Largest peak-to-trough decline |
| Trades | Total number of trades |
| Win Rate | % of winning trades |

**Good Backtest Indicators**:
- Profit Factor > 1.5
- Drawdown < 20%
- Win Rate > 40% with good R:R

### Lesson 6.3: Optimization

**What is Optimization?**:
Testing many parameter combinations to find the best settings.

**Setting Up Optimization**:
1. In Inputs tab, check parameters to optimize
2. Set Start, Step, and Stop values
3. Enable "Optimization" checkbox
4. Select optimization criterion
5. Click Start

**Optimization Criteria**:
- Maximum Profit
- Maximum Profit Factor
- Maximum Expected Payoff
- Minimum Drawdown
- Custom

**Warning**: Over-optimization (curve fitting) leads to poor real performance. Use walk-forward analysis.

---

## MODULE 7: RISK MANAGEMENT TOOLS

### Lesson 7.1: Position Sizing

**Calculating Lot Size**:

Formula:
```
Lot Size = (Account × Risk%) / (Stop Loss in Pips × Pip Value)
```

**Example**:
- Account: $10,000
- Risk: 1% = $100
- Stop Loss: 50 pips
- Pip Value: $10/pip (standard lot)

Lot Size = $100 / (50 × $10) = 0.20 lots

### Lesson 7.2: Setting Stop Loss and Take Profit

**On New Orders**:
1. Enter SL in points/pips or price
2. Enter TP in points/pips or price
3. Red line = SL, Green line = TP on chart

**Drag and Drop**:
1. Click on the position line on chart
2. Drag up/down to set SL/TP visually
3. Release to confirm

**Always Use Stop Loss**:
- Never trade without a stop loss
- Protects against catastrophic losses
- Defines your risk

---

## MODULE 8: ADVANCED FEATURES

### Lesson 8.1: Economic Calendar

**Accessing Calendar**:
- View → Toolbox → Calendar tab
- Or click Calendar in Terminal window

**Using Calendar**:
- Filter by country (USD, EUR, etc.)
- Filter by importance (High, Medium, Low)
- See actual vs forecast values
- Plan trades around news

### Lesson 8.2: Market Depth (DOM)

**Opening Market Depth**:
- View → Market Depth
- Or right-click Market Watch → Depth of Market

**Understanding DOM**:
- Shows bid/ask levels
- Volume at each price
- One-click trading from DOM

### Lesson 8.3: Alerts

**Creating Alerts**:
1. Right-click on chart at desired price
2. Trading → Alert
3. Configure:
   - Condition (price hits, crosses, etc.)
   - Action (sound, email, push)
4. Click OK

**Alert Types**:
- Price touches level
- Price crosses level
- Time-based alerts

---

## MODULE 9: TROUBLESHOOTING

### Common Issues and Solutions

**Issue: "Invalid Account"**
- Solution: Check username, password, and server

**Issue: "Trade Context Busy"**
- Solution: Wait and retry; only one operation at a time

**Issue: "Off Quotes"**
- Solution: Market may be closed or price moved too fast

**Issue: "Not Enough Money"**
- Solution: Reduce lot size or deposit more funds

**Issue: EA Not Trading**
- Check Algo Trading is enabled (button on toolbar)
- Check EA is attached (smiley face on chart)
- Check broker allows the trade (spread, timing)
- Check EA settings (is it within trading hours?)

---

## MODULE 10: BEST PRACTICES

### 10.1: Chart Setup Checklist

✅ Use dark theme (easier on eyes)
✅ Save templates for each instrument
✅ Use consistent indicator colors
✅ Keep charts uncluttered
✅ Use multiple timeframes

### 10.2: Trading Checklist

✅ Check economic calendar before trading
✅ Always set stop loss BEFORE entering
✅ Use proper position sizing
✅ Don't overtrade
✅ Keep a trading journal

### 10.3: EA Checklist

✅ Test on demo first (minimum 1 month)
✅ Start with small lot sizes
✅ Monitor regularly
✅ Have a backup internet connection
✅ Consider VPS for 24/5 operation

---

## BONUS: KEYBOARD SHORTCUTS

| Shortcut | Action |
|----------|--------|
| F9 | New Order |
| Ctrl+T | Show/Hide Terminal |
| Ctrl+N | Show/Hide Navigator |
| Ctrl+M | Show/Hide Market Watch |
| Ctrl+R | Open Strategy Tester |
| + / - | Zoom In / Out |
| ← → | Scroll Chart |
| F5 | Change to next profile |
| F7 | EA Properties |

---

## COURSE COMPLETION

Congratulations on completing the MT5 Mastery Course!

You now have the skills to:
- Navigate MT5 confidently
- Analyze charts effectively
- Execute trades properly
- Use Expert Advisors safely
- Backtest strategies
- Manage risk appropriately

**Next Steps**:
1. Practice on demo account
2. Develop your trading strategy
3. Keep learning and improving

---

## SUPPORT

For course support:
- WhatsApp: +254 704 618 663
- Telegram: @market_masterrer
- Email: kbonface03@gmail.com

---

© 2026 AlgoEdge. All Rights Reserved.

# TREND STRENGTH DASHBOARD
## Complete User Manual v2.0

---

## TABLE OF CONTENTS

1. Introduction
2. Installation Guide
3. Dashboard Components
4. Input Parameters
5. Reading the Dashboard
6. Trading with the Dashboard
7. Best Practices
8. FAQ

---

## 1. INTRODUCTION

### What is Trend Strength Dashboard?

The Trend Strength Dashboard is a comprehensive MT5 indicator that displays the strength and direction of trends across multiple timeframes and currency pairs in a single, easy-to-read panel.

### Key Features

- **Multi-Timeframe Analysis**: M15, H1, H4, D1, W1 in one view
- **Multi-Pair Monitoring**: Track up to 28 pairs simultaneously  
- **Trend Direction**: Clear UP/DOWN arrows
- **Strength Meter**: Visual strength indicator (0-100%)
- **Alerts**: Notification when trends align
- **Color Coded**: Instant visual recognition

### Why Use This Indicator?

**Saves Time**: Check 28 pairs across 5 timeframes in seconds
**Spot Opportunities**: Find the strongest trending pairs
**Confirm Trades**: Verify multi-timeframe alignment
**Stay Informed**: Real-time trend updates

---

## 2. INSTALLATION GUIDE

### Step 1: Download Files

Ensure you have:
- TrendStrengthDashboard.ex5

### Step 2: Install Indicator

1. Open MetaTrader 5
2. File → Open Data Folder
3. Navigate to: MQL5 → Indicators
4. Copy the .ex5 file here
5. Restart MetaTrader 5

### Step 3: Add to Chart

1. Open any chart (indicator will show all pairs)
2. Navigator → Indicators → Trend Strength Dashboard
3. Drag onto chart
4. Adjust settings if needed
5. Click OK

### Step 4: Position Dashboard

- Drag the dashboard panel to your preferred location
- Resize if needed

---

## 3. DASHBOARD COMPONENTS

### The Panel Layout

```
+------------------------------------------+
|        TREND STRENGTH DASHBOARD          |
+------------------------------------------+
| PAIR    | M15 | H1  | H4  | D1  | W1    |
+------------------------------------------+
| EURUSD  | ↑80 | ↑75 | ↑60 | ↑55 | ↑50   |
| GBPUSD  | ↓70 | ↓65 | ↓60 | ↓55 | ↓50   |
| USDJPY  | →   | ↑40 | ↑45 | ↑50 | ↑55   |
| XAUUSD  | ↑90 | ↑85 | ↑80 | ↑70 | ↑65   |
| ...     | ... | ... | ... | ... | ...   |
+------------------------------------------+
```

### Component Explanation

**Arrow Direction**:
- ↑ (Green): Uptrend
- ↓ (Red): Downtrend
- → (Gray): Ranging/No trend

**Strength Number (0-100)**:
- 0-30: Weak trend
- 30-60: Moderate trend
- 60-80: Strong trend
- 80-100: Very strong trend

**Color Coding**:
- Dark Green: Strong uptrend (80+)
- Light Green: Moderate uptrend (50-79)
- Gray: No clear trend (<50)
- Light Red: Moderate downtrend (50-79)
- Dark Red: Strong downtrend (80+)

---

## 4. INPUT PARAMETERS

### Symbol Selection

| Parameter | Default | Description |
|-----------|---------|-------------|
| ShowMajors | true | EUR, GBP, USD, JPY, CHF, CAD, AUD, NZD pairs |
| ShowGold | true | XAUUSD |
| ShowSilver | true | XAGUSD |
| ShowIndices | false | US30, NAS100, etc. |
| CustomSymbols | "" | Add custom symbols |

### Timeframes

| Parameter | Default | Description |
|-----------|---------|-------------|
| ShowM15 | true | 15-minute trend |
| ShowH1 | true | 1-hour trend |
| ShowH4 | true | 4-hour trend |
| ShowD1 | true | Daily trend |
| ShowW1 | true | Weekly trend |

### Trend Calculation

| Parameter | Default | Description |
|-----------|---------|-------------|
| TrendMethod | EMA | EMA, SMA, ADX, or Combined |
| FastPeriod | 20 | Fast moving average period |
| SlowPeriod | 50 | Slow moving average period |
| ADX_Period | 14 | ADX period (if used) |
| TrendThreshold | 30 | Min strength to show arrow |

### Display Settings

| Parameter | Default | Description |
|-----------|---------|-------------|
| PanelX | 20 | Panel X position |
| PanelY | 20 | Panel Y position |
| CellWidth | 50 | Width of each cell |
| FontSize | 10 | Text size |
| ShowStrengthNumber | true | Show % next to arrow |

### Alerts

| Parameter | Default | Description |
|-----------|---------|-------------|
| AlertOnAlignment | true | Alert when all TFs align |
| MinAlignedTFs | 4 | Minimum TFs to trigger alert |
| MinStrengthForAlert | 60 | Minimum strength for alert |

---

## 5. READING THE DASHBOARD

### Strong Trend Identification

**Very Strong Uptrend** (Best for Longs):
- All timeframes showing ↑
- Strength 70+ on most TFs
- Dark green cells

**Very Strong Downtrend** (Best for Shorts):
- All timeframes showing ↓
- Strength 70+ on most TFs
- Dark red cells

### Trend Alignment

**Perfect Alignment**:
All 5 timeframes same direction = Very high probability trade

**Partial Alignment**:
3-4 timeframes same direction = Good probability

**Mixed Signals**:
Timeframes disagree = Avoid or wait for clarity

### Trend Starting/Ending

**Trend Starting**:
- Lower TFs show trend (M15, H1)
- Higher TFs still ranging
- Early entry opportunity

**Trend Maturing**:
- All TFs aligned
- High strength numbers
- Trend well established

**Trend Ending**:
- Lower TFs reversing
- Higher TFs still trending
- Time to exit or reverse

---

## 6. TRADING WITH THE DASHBOARD

### Strategy 1: Trend Continuation

**Setup**:
1. Find pair with ALL timeframes aligned
2. Wait for pullback on lowest TF (M15)
3. Enter in direction of trend
4. Stop below pullback low/high
5. Target based on higher TF structure

**Example**:
- EURUSD shows all green arrows
- M15 pulls back while H1+ stay bullish
- Enter long on M15 bullish signal
- Ride the trend continuation

### Strategy 2: Trend Reversal Watch

**Setup**:
1. Higher TFs show strong trend
2. Lower TFs starting to reverse
3. Wait for H1 to confirm reversal
4. Enter new direction
5. Stop beyond recent swing

**Example**:
- D1 and H4 show ↑ but strength dropping
- H1 turns ↓
- M15 confirms with lower low
- Consider short entry

### Strategy 3: Best Pair Selection

**Process**:
1. Scan dashboard for strongest trends
2. Compare similar pairs (e.g., EURUSD vs GBPUSD)
3. Choose pair with:
   - Most TFs aligned
   - Highest strength numbers
   - Cleanest chart structure
4. Focus on that pair

---

## 7. BEST PRACTICES

### Do's

✅ **Check dashboard before any trade**
Trade with the trend, not against it

✅ **Wait for alignment**
More aligned TFs = Higher probability

✅ **Use as a filter**
Dashboard tells WHAT, chart tells WHEN

✅ **Monitor regularly**
Trends can change - stay updated

✅ **Combine with price action**
Dashboard for direction, PA for entry

### Don'ts

❌ **Trade mixed signals**
If TFs disagree, wait for clarity

❌ **Ignore higher TFs**
D1 and W1 trump lower timeframes

❌ **Chase very strong trends**
80+ strength might be near exhaustion

❌ **Use as sole decision maker**
Always check the chart

---

## 8. FAQ

### Q: Why is a pair showing "---" ?

A: The symbol may not be available on your broker. Check symbol name.

### Q: Can I add crypto pairs?

A: Yes, add them to CustomSymbols (e.g., "BTCUSD,ETHUSD").

### Q: The dashboard is slow to load?

A: Reduce number of pairs or timeframes shown.

### Q: How often does it update?

A: Every new candle on the smallest active timeframe.

### Q: Can I save my settings?

A: Yes, right-click → Save Template.

### Q: What's the best method (EMA, SMA, ADX)?

A: "Combined" uses all three for most reliable signals.

---

## SUPPORT

For technical support:
- WhatsApp: +254 704 618 663
- Telegram: @market_masterrer
- Email: kbonface03@gmail.com

---

© 2026 AlgoEdge. All Rights Reserved.

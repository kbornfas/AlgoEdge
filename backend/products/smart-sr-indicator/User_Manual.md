# SMART SUPPORT RESISTANCE INDICATOR
## Complete User Manual v2.0

---

## TABLE OF CONTENTS

1. Introduction
2. Installation Guide
3. How It Works
4. Input Parameters
5. Using the Indicator
6. Trading Strategies
7. Best Practices
8. FAQ

---

## 1. INTRODUCTION

### What is Smart Support Resistance?

Smart Support Resistance is a MetaTrader 5 indicator that automatically identifies and displays key support and resistance levels on your charts.

### Key Features

- **Automatic Detection**: Identifies S/R levels automatically
- **Multi-Timeframe**: Shows levels from higher timeframes
- **Strength Rating**: Rates each level's strength
- **Clean Display**: Adjustable zones with labels
- **Alert System**: Notifies when price approaches levels
- **Zone Projection**: Extends levels into the future

### Why Use This Indicator?

**Without this indicator**:
- Manually drawing levels takes time
- Subjective - different traders draw differently
- Easy to miss important levels
- Need to check multiple timeframes

**With this indicator**:
- Levels drawn instantly
- Objective criteria applied
- All significant levels captured
- Multi-timeframe in one view

---

## 2. INSTALLATION GUIDE

### Step 1: Download Files

Ensure you have:
- SmartSupportResistance.ex5

### Step 2: Install Indicator

1. Open MetaTrader 5
2. File → Open Data Folder
3. Navigate to: MQL5 → Indicators
4. Copy the .ex5 file here
5. Restart MetaTrader 5

### Step 3: Add to Chart

1. Open any chart
2. Navigator → Indicators → Smart Support Resistance
3. Drag onto chart
4. Adjust settings if needed
5. Click OK

### Step 4: Verify

You should see:
- Horizontal zones on your chart
- Labels showing level type (Support/Resistance)
- Strength indicators

---

## 3. HOW IT WORKS

### Level Detection Algorithm

The indicator identifies levels by:

1. **Swing Point Detection**
   - Finds significant highs and lows
   - Filters out minor swings (noise)
   - Identifies pivot points

2. **Touch Counting**
   - Counts how many times price touched each level
   - More touches = stronger level
   - Recent touches weighted more

3. **Rejection Analysis**
   - Measures how strongly price rejected from levels
   - Fast rejections = strong levels
   - Weak reactions = weaker levels

4. **Zone Calculation**
   - Creates zones around exact levels
   - Zone width based on ATR
   - Accounts for market volatility

### Strength Rating System

Each level receives a strength score:

| Score | Rating | Visual |
|-------|--------|--------|
| 1-2 | Weak | Thin line |
| 3-4 | Moderate | Medium line |
| 5+ | Strong | Thick line |

---

## 4. INPUT PARAMETERS

### Detection Settings

| Parameter | Default | Description |
|-----------|---------|-------------|
| LookbackPeriod | 500 | Bars to analyze for levels |
| MinTouches | 2 | Minimum touches to qualify |
| SwingSensitivity | 5 | Higher = fewer levels detected |
| ZoneWidth | ATR | Zone size method (ATR or Fixed) |
| FixedZonePips | 20 | Fixed zone width (if selected) |

### Display Settings

| Parameter | Default | Description |
|-----------|---------|-------------|
| ShowSupport | true | Display support levels |
| ShowResistance | true | Display resistance levels |
| SupportColor | Green | Color for support zones |
| ResistanceColor | Red | Color for resistance zones |
| ZoneTransparency | 80 | Zone transparency (0-100) |
| ShowLabels | true | Show S/R labels |
| ShowStrength | true | Show strength rating |

### Multi-Timeframe Settings

| Parameter | Default | Description |
|-----------|---------|-------------|
| UseHTF | true | Show higher TF levels |
| HTF_1 | H4 | First higher timeframe |
| HTF_2 | D1 | Second higher timeframe |
| HTF_Color_1 | Blue | HTF1 zone color |
| HTF_Color_2 | Purple | HTF2 zone color |

### Alert Settings

| Parameter | Default | Description |
|-----------|---------|-------------|
| EnableAlerts | true | Turn alerts on/off |
| AlertDistance | 20 | Pips from level to alert |
| PopupAlert | true | Show popup window |
| SoundAlert | true | Play sound |
| PushNotification | false | Mobile notification |

---

## 5. USING THE INDICATOR

### Reading the Display

**Support Zones (Green by default)**
- Price has previously bounced UP from these levels
- Look for BUY opportunities here

**Resistance Zones (Red by default)**
- Price has previously bounced DOWN from these levels
- Look for SELL opportunities here

**Zone Width**
- Wider zones = more significant levels
- Price may reverse anywhere within zone

**Labels**
- "S" = Support
- "R" = Resistance
- Number = Touch count

### Multi-Timeframe View

**Current Timeframe Levels**: Standard colors (green/red)
**Higher Timeframe Levels**: Blue/Purple (more significant)

**Rule**: Higher timeframe levels are more important.

### Alert System

When price approaches a level:
1. Popup alert appears
2. Sound plays (if enabled)
3. You can then analyze for entry

---

## 6. TRADING STRATEGIES

### Strategy 1: Bounce Trading

**Setup**:
1. Price approaches support/resistance
2. Wait for rejection candle (pin bar, engulfing)
3. Enter in bounce direction
4. Stop beyond the zone
5. Target next opposite level

**Example - Support Bounce**:
- Price drops to support zone
- Bullish pin bar forms
- BUY with stop below zone
- Target: Next resistance

### Strategy 2: Break and Retest

**Setup**:
1. Price breaks through a level
2. Price returns to retest the level
3. Level "flips" (support becomes resistance or vice versa)
4. Enter on rejection of retest
5. Target next level in break direction

### Strategy 3: Range Trading

**Setup**:
1. Identify clear support and resistance
2. Price bouncing between them
3. Buy at support, sell at resistance
4. Stop beyond the zones
5. Target opposite side of range

### Strategy 4: Breakout Confirmation

**Setup**:
1. Watch price approaching level
2. Strong candle closes beyond level
3. Enter in breakout direction
4. Stop inside the broken zone
5. Target next level

---

## 7. BEST PRACTICES

### Do's

✅ **Use with trend direction**
- At support in uptrend → Strong buy zone
- At resistance in downtrend → Strong sell zone

✅ **Wait for confirmation**
- Don't blindly trade every level
- Wait for price action signal

✅ **Combine with other analysis**
- Candlestick patterns
- Trend analysis
- Volume (if available)

✅ **Focus on strongest levels**
- Higher touch count
- Higher timeframe levels
- Round numbers nearby

### Don'ts

❌ **Trade every level**
- Be selective
- Quality over quantity

❌ **Ignore the trend**
- Counter-trend levels are weaker
- Trade with the flow

❌ **Use alone**
- This is a TOOL, not a system
- Combine with your strategy

❌ **Trust blindly**
- No indicator is 100% accurate
- Always manage risk

---

## 8. FAQ

### Q: Why are some levels not showing?

A: The indicator filters weak levels. Adjust MinTouches lower to see more levels.

### Q: Can I use this on any timeframe?

A: Yes, but higher timeframes (H1+) produce more reliable levels.

### Q: Why do levels change as I scroll?

A: The indicator recalculates based on visible data. This is normal.

### Q: Can I customize colors for each level?

A: Currently, colors are set by level type (support/resistance) and timeframe.

### Q: Does this work on crypto/stocks?

A: Yes, support/resistance concepts work on any tradeable asset.

### Q: How do I turn off higher timeframe levels?

A: Set UseHTF to false in settings.

---

## SUPPORT

For technical support:
- WhatsApp: +254 704 618 663
- Telegram: @market_masterrer
- Email: kbonface03@gmail.com

---

© 2026 AlgoEdge. All Rights Reserved.

# SUPPLY DEMAND ZONE INDICATOR
## Complete User Manual v2.0

---

## TABLE OF CONTENTS

1. Introduction
2. Installation Guide
3. Understanding Supply & Demand
4. How the Indicator Works
5. Input Parameters
6. Using the Indicator
7. Trading Strategies
8. Best Practices
9. FAQ

---

## 1. INTRODUCTION

### What is the Supply Demand Zone Indicator?

This indicator automatically identifies and draws supply and demand zones on your charts - the areas where institutional traders placed large orders that caused significant price moves.

### Key Features

- **Automatic Zone Detection**: Finds S/D zones automatically
- **Fresh/Tested Status**: Shows whether zone has been tested
- **Strength Rating**: Rates zone quality (weak to strong)
- **Multi-Timeframe**: Display zones from higher TFs
- **Zone History**: Shows where zones were respected/broken
- **Alert System**: Notifies when price approaches zones

### Supply vs. Support/Resistance

**Support/Resistance**: Any level where price reversed
**Supply/Demand**: Specific zones where IMBALANCE occurred (unfilled orders)

Supply/Demand is more precise because it identifies the ORIGIN of moves, not just any reversal point.

---

## 2. INSTALLATION GUIDE

### Step 1: Download Files

Ensure you have:
- SupplyDemandZones.ex5

### Step 2: Install Indicator

1. Open MetaTrader 5
2. File → Open Data Folder
3. Navigate to: MQL5 → Indicators
4. Copy the .ex5 file here
5. Restart MetaTrader 5

### Step 3: Add to Chart

1. Open any chart
2. Navigator → Indicators → Supply Demand Zones
3. Drag onto chart
4. Click OK

### Step 4: Verify Display

You should see:
- Red/Orange zones above price (Supply)
- Green/Blue zones below price (Demand)
- Labels showing zone status

---

## 3. UNDERSTANDING SUPPLY & DEMAND

### What Creates Supply Zones?

Supply zones form when:
1. Large sell orders enter the market
2. Price drops sharply from the zone
3. Not all orders could be filled
4. Remaining orders wait for price return

**Visual**: Price consolidates or bases, then DROPS sharply.

### What Creates Demand Zones?

Demand zones form when:
1. Large buy orders enter the market
2. Price rises sharply from the zone
3. Not all orders could be filled
4. Remaining orders wait for price return

**Visual**: Price consolidates or bases, then RISES sharply.

### Zone Types

**Drop-Base-Drop (DBD)** - Supply
```
    \
     ===  <-- Base (Supply Zone)
    \
```

**Rally-Base-Rally (RBR)** - Demand
```
    /
   ===  <-- Base (Demand Zone)
    /
```

**Drop-Base-Rally (DBR)** - Demand (Stronger)
```
    \
     ===  <-- Base (Demand Zone)
    /
```

**Rally-Base-Drop (RBD)** - Supply (Stronger)
```
    /
   ===  <-- Base (Supply Zone)
    \
```

---

## 4. HOW THE INDICATOR WORKS

### Zone Detection Process

1. **Scan for Strong Moves**
   - Identifies candles with above-average range
   - These indicate institutional activity

2. **Find the Base**
   - Looks for consolidation before the move
   - This is where orders were placed

3. **Draw the Zone**
   - Zone spans from base high to base low
   - Extends into the future

4. **Rate Zone Quality**
   - Measures move strength
   - Checks freshness
   - Assigns quality score

### Zone Quality Factors

| Factor | Impact |
|--------|--------|
| Move Strength | Stronger move = Better zone |
| Base Tightness | Tight base = Better zone |
| Freshness | Untested = Better zone |
| Time in Zone | Less time = Better zone |

---

## 5. INPUT PARAMETERS

### Detection Settings

| Parameter | Default | Description |
|-----------|---------|-------------|
| LookbackBars | 500 | Bars to analyze |
| MinMoveATR | 2.0 | Min move size (ATR multiple) |
| MaxBaseCandles | 6 | Max candles in base |
| ZoneExtension | 50 | How far to extend zone |

### Zone Display

| Parameter | Default | Description |
|-----------|---------|-------------|
| ShowSupply | true | Display supply zones |
| ShowDemand | true | Display demand zones |
| SupplyColor | Red | Supply zone color |
| DemandColor | Green | Demand zone color |
| FreshZoneAlpha | 40 | Fresh zone opacity (0-100) |
| TestedZoneAlpha | 20 | Tested zone opacity |
| ShowLabels | true | Show zone labels |

### Zone Status

| Parameter | Default | Description |
|-----------|---------|-------------|
| MarkTestedZones | true | Different color for tested |
| RemoveBrokenZones | true | Remove zones after break |
| MaxZonesDisplay | 10 | Max zones per type shown |

### Multi-Timeframe

| Parameter | Default | Description |
|-----------|---------|-------------|
| ShowHTFZones | true | Show higher TF zones |
| HTF_1 | H4 | First higher timeframe |
| HTF_2 | D1 | Second higher timeframe |

### Alerts

| Parameter | Default | Description |
|-----------|---------|-------------|
| EnableAlerts | true | Turn alerts on/off |
| AlertDistance | 15 | Pips from zone to alert |
| OnlyAlertFresh | true | Alert only for fresh zones |

---

## 6. USING THE INDICATOR

### Zone Visual Guide

**Fresh Supply Zone (Red/Orange)**
- Not yet retested
- Higher probability
- Best selling opportunities

**Tested Supply Zone (Light Red)**
- Has been touched once
- Still valid but weaker
- Use with caution

**Fresh Demand Zone (Green/Blue)**
- Not yet retested
- Higher probability
- Best buying opportunities

**Tested Demand Zone (Light Green)**
- Has been touched once
- Still valid but weaker
- Use with caution

### Zone Labels

Labels show:
- Zone type (Supply/Demand)
- Status (Fresh/Tested)
- Timeframe if HTF zone
- Quality rating (if enabled)

### Reading Zone Quality

**High Quality Zone**:
- Large move away from zone (3+ ATR)
- Tight base (1-3 candles)
- Fresh (untested)
- Price spent little time in zone

**Lower Quality Zone**:
- Smaller move (1-2 ATR)
- Wider base (4-6 candles)
- Tested once
- Price consolidated longer

---

## 7. TRADING STRATEGIES

### Strategy 1: Fresh Zone Entry

**The Setup**:
1. Identify fresh (untested) zone
2. Wait for price to approach zone
3. Look for rejection candlestick
4. Enter in zone direction
5. Stop beyond zone, target opposite zone

**For Demand (Buy)**:
- Price drops to demand zone
- Bullish candle forms
- BUY with stop below zone
- Target: Next supply zone

**For Supply (Sell)**:
- Price rises to supply zone
- Bearish candle forms
- SELL with stop above zone
- Target: Next demand zone

### Strategy 2: Zone Flip Trade

**The Setup**:
1. Zone gets broken
2. Price returns to broken zone
3. Zone has "flipped" (demand → supply or vice versa)
4. Enter on rejection from flipped zone

**Example**:
- Demand zone breaks (price closes below)
- Price rallies back to old demand
- Old demand now acts as supply
- SELL on bearish rejection

### Strategy 3: Multi-Timeframe Confluence

**The Setup**:
1. Identify HTF zone (D1)
2. Wait for price to approach
3. Look for LTF zone within HTF zone
4. Enter on LTF zone trigger
5. Better R:R due to tighter stop

**Example**:
- D1 demand zone at 1.0850-1.0900
- Price drops toward zone
- H1 shows demand at 1.0870
- Enter at H1 demand for tighter stop

---

## 8. BEST PRACTICES

### Do's

✅ **Trade fresh zones first**
They have highest probability

✅ **Use with trend direction**
Demand in uptrend, Supply in downtrend

✅ **Wait for confirmation**
Don't buy/sell blindly at zones

✅ **Prioritize HTF zones**
D1 zones > H4 zones > H1 zones

✅ **Risk from zone edge**
Stop beyond zone, not inside

### Don'ts

❌ **Trade every zone**
Be selective - quality over quantity

❌ **Trade against HTF trend**
Counter-trend zones are weaker

❌ **Hold if zone breaks**
Accept the loss and move on

❌ **Trade weak zones**
Small moves = weak zones

❌ **Forget about context**
News can override any zone

---

## 9. FAQ

### Q: How many times can a zone be used?

A: Fresh zones work best. After one test, probability decreases. After two tests, zone is weak.

### Q: Why did a zone not hold?

A: No zone holds 100%. Could be news, HTF trend against you, or zone was already weak.

### Q: Can I adjust zone size?

A: The indicator draws based on actual price structure. You can manually adjust after.

### Q: Should I trade both supply and demand?

A: Ideally trade with the trend:
- Uptrend: Focus on demand (buys)
- Downtrend: Focus on supply (sells)

### Q: What timeframe works best?

A: H1 for day trading, H4/D1 for swing trading. Higher TFs are more reliable.

### Q: Do zones work on all pairs?

A: Yes, supply/demand works on any traded market.

---

## SUPPORT

For technical support:
- WhatsApp: +254 704 618 663
- Telegram: @market_masterrer
- Email: kbonface03@gmail.com

---

© 2026 AlgoEdge. All Rights Reserved.

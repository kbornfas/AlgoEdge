# RISK MANAGER PRO EA
## Automated Risk Protection for Your Trading Account

---

## USER MANUAL v2.0

---

## TABLE OF CONTENTS

1. Introduction
2. Key Features
3. Installation
4. How It Works
5. Input Parameters
6. Using Risk Manager Pro
7. Scenarios and Examples
8. FAQ

---

## 1. INTRODUCTION

### What is Risk Manager Pro?

Risk Manager Pro is NOT a trading EA - it's a **risk protection tool** that monitors your account and other EAs/manual trades to enforce strict risk management rules.

Think of it as your personal trading guardian that:
- Closes trades when loss limits are hit
- Prevents you from breaking your own rules
- Protects your account from catastrophic losses
- Enforces daily, weekly, and total drawdown limits

### Why You Need This

**Without Risk Manager**:
- Easy to "just one more trade" yourself into big losses
- Other EAs might not have proper risk limits
- Emotional decisions override logical rules
- Account can be destroyed in hours

**With Risk Manager**:
- Hard limits that CAN'T be overridden
- Works while you sleep
- Monitors all trades (EAs and manual)
- Saves your account from worst-case scenarios

---

## 2. KEY FEATURES

### Core Features

✅ **Daily Loss Limit**: Close all trades if daily loss exceeded
✅ **Weekly Loss Limit**: No trading if weekly loss exceeded
✅ **Maximum Drawdown**: Hard cap on total drawdown
✅ **Trade Counter**: Limit number of trades per day
✅ **Position Limit**: Maximum open positions
✅ **Lot Size Guard**: Prevent oversized positions
✅ **Time-Based Rules**: Trading hours enforcement
✅ **Equity Protection**: Close all if equity drops too fast

### Alert Features

✅ **Popup Alerts**: On-screen warnings
✅ **Sound Alerts**: Audio notifications
✅ **Email Alerts**: Email when limits approached
✅ **Push Notifications**: Mobile alerts

### Logging

✅ **Trade Log**: All actions logged
✅ **Daily Reports**: Summary of activity
✅ **Rule Triggers**: When and why rules fired

---

## 3. INSTALLATION

### Step 1: Install the EA

1. Open MetaTrader 5
2. File → Open Data Folder
3. Navigate to MQL5 → Experts
4. Copy `RiskManagerPro.ex5`
5. Restart MT5

### Step 2: Add to Chart

1. Open any chart (doesn't matter which)
2. Navigator → Expert Advisors
3. Drag RiskManagerPro onto chart
4. Enable "Allow Algo Trading"
5. Click OK

### Step 3: Configure Settings

1. Right-click on EA
2. Select Properties
3. Set your risk limits
4. Click OK

**Important**: Risk Manager Pro monitors your entire account from a single chart.

---

## 4. HOW IT WORKS

### Monitoring Loop

Every second, the EA:
1. Checks current account balance/equity
2. Calculates current profit/loss
3. Compares against your limits
4. Takes action if limits exceeded

### Action Priority

When a limit is hit:
1. **Warning** (if warning threshold set)
2. **Close profitable trades first** (optional)
3. **Close all trades**
4. **Disable trading** (if configured)
5. **Log the event**
6. **Send alerts**

### What It Monitors

```
Account Level:
├── Balance changes
├── Equity changes
├── Margin level
└── Total drawdown

Daily Level:
├── Day's profit/loss
├── Number of trades today
└── Time within trading hours

Position Level:
├── Number of open positions
├── Largest position size
├── Total exposure
└── Per-symbol exposure
```

---

## 5. INPUT PARAMETERS

### Daily Limits

| Parameter | Default | Description |
|-----------|---------|-------------|
| DailyLossLimit | 3.0 | Max daily loss % |
| DailyProfitTarget | 0 | Close all if hit (0=off) |
| MaxTradesPerDay | 10 | Max trades allowed |
| ResetTime | 00:00 | When daily counters reset |

### Weekly Limits

| Parameter | Default | Description |
|-----------|---------|-------------|
| WeeklyLossLimit | 8.0 | Max weekly loss % |
| WeeklyResetDay | Monday | When weekly counter resets |

### Total Account Limits

| Parameter | Default | Description |
|-----------|---------|-------------|
| MaxDrawdown | 15.0 | Max total drawdown % |
| MaxDrawdownAction | CloseAll | Action when exceeded |
| EquityStopLevel | 20.0 | Emergency equity % level |

### Position Limits

| Parameter | Default | Description |
|-----------|---------|-------------|
| MaxOpenPositions | 5 | Max concurrent trades |
| MaxLotsPerPosition | 1.0 | Max lot size per trade |
| MaxTotalLots | 3.0 | Max total lots open |
| MaxPerSymbol | 2 | Max positions per symbol |

### Time Controls

| Parameter | Default | Description |
|-----------|---------|-------------|
| EnableTimeControl | true | Use trading hours |
| TradingStartHour | 8 | Allow trading from |
| TradingEndHour | 20 | Stop new trades after |
| CloseAllEndOfDay | false | Close all at end |
| FridayCloseHour | 18 | Friday close time |
| CloseWeekend | true | Close before weekend |

### Alert Settings

| Parameter | Default | Description |
|-----------|---------|-------------|
| EnablePopupAlert | true | Show popup windows |
| EnableSoundAlert | true | Play sounds |
| EnableEmailAlert | false | Send emails |
| EnablePushAlert | false | Mobile push |
| WarningThreshold | 80 | Warn at X% of limit |

### Advanced

| Parameter | Default | Description |
|-----------|---------|-------------|
| MonitorOtherEAs | true | Monitor non-manual trades |
| ExcludeMagics | "" | Magic numbers to ignore |
| DisableTradingOnLimit | true | Disable trading when hit |
| ReenableAfter | Never | When to re-enable |
| ProtectProfits | false | Trail profitable trades |

---

## 6. USING RISK MANAGER PRO

### Basic Setup (Recommended)

For most traders, use these settings:

```
Daily Loss Limit: 3%
Weekly Loss Limit: 8%
Max Drawdown: 15%
Max Trades Per Day: 10
Max Open Positions: 5
```

### For Prop Firm Traders

Adjust to your prop firm rules:

```
Daily Loss Limit: 4% (if firm allows 5%)
Max Drawdown: 8% (if firm allows 10%)
Max Trades Per Day: As needed
Close Before Weekend: true
```

### For Aggressive Traders

If you know you overtrade:

```
Max Trades Per Day: 3
Max Open Positions: 2
Daily Profit Target: 2% (forces you to stop)
```

### Status Panel

The EA shows a panel with:
- Current day P/L
- Distance to daily limit
- Open positions count
- Next reset time
- Status (Active/Paused)

---

## 7. SCENARIOS AND EXAMPLES

### Scenario 1: Daily Limit Hit

**Situation**:
- Daily limit: 3%
- Current loss: -2.8%
- Trade goes more negative

**What Happens**:
1. At -2.4% (80%): Warning alert
2. At -3.0%: All trades closed
3. Trading disabled for rest of day
4. Alert sent: "Daily loss limit reached"

### Scenario 2: Oversized Position

**Situation**:
- Max lots per position: 0.5
- Other EA tries to open 1.0 lot

**What Happens**:
1. Position opens (can't prevent)
2. Risk Manager detects violation
3. Position immediately closed
4. Alert: "Position exceeded max lot size"

### Scenario 3: Too Many Positions

**Situation**:
- Max open positions: 5
- Currently have 5 trades
- You try to open a 6th

**What Happens**:
1. Risk Manager monitors
2. 6th position detected
3. Newest position closed
4. Alert: "Maximum positions exceeded"

### Scenario 4: Weekend Protection

**Situation**:
- Friday 17:45
- Friday close hour: 18:00
- Open positions exist

**What Happens**:
1. At 17:45: Warning "15 min to forced close"
2. At 18:00: All positions closed
3. Trading disabled until Monday
4. Alert: "Weekend close executed"

---

## 8. FAQ

### Q: Will this prevent EAs from opening trades?

A: It can't prevent the initial open, but it will close positions that violate rules within 1 second.

### Q: Can I exclude certain trades?

A: Yes, add magic numbers to ExcludeMagics parameter.

### Q: What if I want to manually override?

A: You'd need to remove the EA. This is by design - the whole point is to enforce rules.

### Q: Does it work with manual trading?

A: Yes, it monitors ALL trades including manual ones (magic 0).

### Q: Will it conflict with my trading EA?

A: No, it only monitors and closes. It doesn't open trades.

### Q: What's the difference between this and setting SL?

A: This monitors total account risk, not just individual trades. It protects against multiple losing trades accumulating.

### Q: Can I use this on prop firm accounts?

A: Absolutely - this is IDEAL for prop firms. Set limits below your firm's limits for safety buffer.

---

## INCLUDED FILES

- RiskManagerPro.ex5 - The EA
- Settings_Standard.set - Standard settings
- Settings_PropFirm.set - Prop firm settings
- Settings_Conservative.set - Very safe settings

---

## SUPPORT

For technical support:
- WhatsApp: +254 704 618 663
- Telegram: @market_masterrer
- Email: kbonface03@gmail.com

---

© 2026 AlgoEdge. All Rights Reserved.

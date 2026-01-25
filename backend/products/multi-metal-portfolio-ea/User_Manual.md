# MULTI-METAL PORTFOLIO EA
## Automated Trading Across Gold, Silver, and Platinum

---

## USER MANUAL v2.0

---

## TABLE OF CONTENTS

1. Introduction
2. System Requirements
3. Installation Guide
4. Portfolio Concept
5. Input Parameters
6. Risk Management System
7. Trading Strategy
8. Best Practices
9. FAQ

---

## 1. INTRODUCTION

### What is Multi-Metal Portfolio EA?

Multi-Metal Portfolio EA is an Expert Advisor that trades multiple precious metal pairs (XAUUSD, XAGUSD, XPTUSD) using a coordinated portfolio approach. Instead of trading one instrument aggressively, it spreads risk across multiple metals for more stable returns.

### Key Features

- **Portfolio Trading**: Trades Gold, Silver, and Platinum
- **Correlation Management**: Prevents over-exposure
- **Dynamic Allocation**: Adjusts position sizes based on opportunity
- **Risk-Adjusted**: Total portfolio risk capped
- **Diversification**: Different strategies per metal
- **24/5 Automation**: No manual intervention needed

### Why Portfolio Approach?

**Single Instrument**:
- One bad trade = Big impact
- Concentration risk
- More volatile equity curve

**Portfolio Approach**:
- Losses on one offset by gains on another
- Reduced overall risk
- Smoother equity growth
- Still captures big moves

---

## 2. SYSTEM REQUIREMENTS

### Minimum Requirements

- MetaTrader 5 (Build 3000+)
- Broker with XAUUSD, XAGUSD minimum
- XPTUSD optional but recommended
- Minimum balance: $2,000
- Leverage: 1:100+

### Recommended

- Balance: $5,000+
- VPS for 24/5 operation
- ECN broker with tight spreads
- All three metals available

### Broker Requirements

| Metal | Symbol | Spread Requirement |
|-------|--------|-------------------|
| Gold | XAUUSD | Under 35 points |
| Silver | XAGUSD | Under 30 points |
| Platinum | XPTUSD | Under 50 points |

---

## 3. INSTALLATION GUIDE

### Step 1: Install EA

1. Open MetaTrader 5
2. File → Open Data Folder
3. Navigate to MQL5 → Experts
4. Copy `MultiMetalPortfolio.ex5`
5. Restart MT5

### Step 2: Add to Chart

1. Open XAUUSD chart (any timeframe)
2. Navigator → Expert Advisors
3. Drag MultiMetalPortfolio onto chart
4. Enable "Allow Algo Trading"
5. Click OK

**Note**: The EA manages all three metals from a single chart.

### Step 3: Verify

Check Experts tab for:
"Multi-Metal Portfolio initialized"
"XAUUSD: Active"
"XAGUSD: Active"
"XPTUSD: Active/Inactive"

---

## 4. PORTFOLIO CONCEPT

### How It Works

The EA treats your account as a portfolio manager would:

1. **Total Risk Budget**: Your account has a total risk allocation
2. **Per-Metal Allocation**: Risk is divided among metals
3. **Opportunity-Based**: More allocation to better setups
4. **Correlation Awareness**: Limits combined exposure

### Risk Allocation Example

**Account**: $10,000
**Total Risk Budget**: 3% = $300 per "round"

**Distribution**:
- Gold (XAUUSD): 40% = $120 max
- Silver (XAGUSD): 35% = $105 max
- Platinum (XPTUSD): 25% = $75 max

### Correlation Management

Precious metals are correlated. If all three have signals:
- Not all will be taken full size
- Combined position size reduced
- Prevents portfolio blow-up if all metals drop

---

## 5. INPUT PARAMETERS

### Portfolio Settings

| Parameter | Default | Description |
|-----------|---------|-------------|
| TotalPortfolioRisk | 3.0 | Total % risk for all metals |
| GoldAllocation | 40 | % of risk for Gold |
| SilverAllocation | 35 | % of risk for Silver |
| PlatinumAllocation | 25 | % of risk for Platinum |
| MaxCorrelatedRisk | 4.0 | Max risk when all aligned |
| EnableGold | true | Trade XAUUSD |
| EnableSilver | true | Trade XAGUSD |
| EnablePlatinum | true | Trade XPTUSD (if available) |

### Gold Settings (XAUUSD)

| Parameter | Default | Description |
|-----------|---------|-------------|
| Gold_Strategy | TrendPullback | Strategy type |
| Gold_Timeframe | H1 | Analysis timeframe |
| Gold_TrendPeriod | 50 | EMA period |
| Gold_SL_ATR | 2.0 | Stop loss ATR multiple |
| Gold_RiskReward | 2.0 | Target R:R ratio |
| Gold_MaxTrades | 2 | Max open gold trades |

### Silver Settings (XAGUSD)

| Parameter | Default | Description |
|-----------|---------|-------------|
| Silver_Strategy | TrendPullback | Strategy type |
| Silver_Timeframe | H1 | Analysis timeframe |
| Silver_TrendPeriod | 50 | EMA period |
| Silver_SL_ATR | 2.5 | Stop loss ATR multiple |
| Silver_RiskReward | 2.0 | Target R:R ratio |
| Silver_MaxTrades | 2 | Max open silver trades |

### Platinum Settings (XPTUSD)

| Parameter | Default | Description |
|-----------|---------|-------------|
| Platinum_Strategy | Breakout | Strategy type |
| Platinum_Timeframe | H4 | Analysis timeframe |
| Platinum_SL_ATR | 2.0 | Stop loss ATR multiple |
| Platinum_RiskReward | 2.5 | Target R:R ratio |
| Platinum_MaxTrades | 1 | Max open platinum trades |

### Global Settings

| Parameter | Default | Description |
|-----------|---------|-------------|
| MaxDailyLoss | 5.0 | Max daily loss % |
| MaxWeeklyLoss | 10.0 | Max weekly loss % |
| TradingHoursStart | 8 | Start hour (server) |
| TradingHoursEnd | 20 | End hour (server) |
| FridayCloseHour | 18 | Close all by this hour |

---

## 6. RISK MANAGEMENT SYSTEM

### Three Layers of Protection

**Layer 1: Per-Trade Risk**
Each trade risks maximum of its allocation

**Layer 2: Per-Metal Risk**
Each metal can't exceed its allocation

**Layer 3: Portfolio Risk**
Total portfolio can't exceed TotalPortfolioRisk

### Example Scenario

**Settings**:
- Account: $10,000
- Total Risk: 3%
- Gold: 40%, Silver: 35%, Platinum: 25%

**If Gold Setup Appears**:
- Max Gold risk: $10,000 × 3% × 40% = $120
- Trade sized to risk $120 maximum

**If Silver Setup Appears Too**:
- Max Silver risk: $10,000 × 3% × 35% = $105
- But check correlation limit
- If highly correlated, reduce both

### Daily/Weekly Limits

The EA tracks cumulative losses:
- If daily loss hits 5%, no new trades that day
- If weekly loss hits 10%, no new trades that week
- Prevents spiral during bad periods

---

## 7. TRADING STRATEGY

### Gold Strategy (Trend Pullback)

**Logic**:
1. Identify H1 trend using 50 EMA
2. Wait for pullback to EMA
3. Enter on bullish/bearish confirmation
4. Target 2R, trail after 1R

**Why for Gold**: Gold trends well, pullbacks provide good R:R

### Silver Strategy (Trend Pullback)

**Logic**:
1. Same as gold but with looser stops (more volatile)
2. Slightly different timing filters
3. Wider ATR multiplier accounts for volatility

**Why for Silver**: Silver follows gold but more volatile

### Platinum Strategy (Breakout)

**Logic**:
1. Identify consolidation on H4
2. Trade breakout of range
3. Target range projection

**Why for Platinum**: Platinum often consolidates then breaks

### Strategy Diversity

Using different strategies reduces correlation:
- If trend pullback fails, breakout might work
- Different timing = different risk exposure
- Portfolio benefits from diversification

---

## 8. BEST PRACTICES

### Do's

✅ **Start with demo testing**
Run for 2-4 weeks minimum

✅ **Use recommended balance**
$5,000+ for proper diversification

✅ **Run on VPS**
24/5 operation requires stable connection

✅ **Monitor weekly**
Check that allocations are being respected

✅ **Adjust allocations if needed**
If one metal consistently loses, reduce allocation

### Don'ts

❌ **Don't over-allocate**
Keep total risk at 3% or less

❌ **Don't trade all metals at max**
Correlation will bite you

❌ **Don't run multiple instances**
One EA manages all metals

❌ **Don't expect daily profits**
Portfolio approach = longer-term thinking

---

## 9. FAQ

### Q: What if my broker doesn't have XPTUSD?

A: Set EnablePlatinum to false. The EA will allocate Gold and Silver at 53% and 47% respectively.

### Q: Can I add other pairs?

A: No, this EA is specifically optimized for precious metals only.

### Q: What's the expected return?

A: Conservative: 3-5% monthly, Moderate: 5-10% monthly. Portfolio approach prioritizes stability.

### Q: Why is one metal not trading?

A: Check that metal's max trades isn't reached, or no valid setup exists on that metal.

### Q: Can I use this on prop firm accounts?

A: Yes, the risk management is prop-firm friendly. Adjust daily/weekly limits to match prop firm rules.

---

## SETTINGS FILES INCLUDED

- Settings_Conservative.set (recommended for most)
- Settings_Moderate.set
- Settings_Aggressive.set

---

## SUPPORT

For technical support:
- WhatsApp: +254 704 618 663
- Telegram: @market_masterrer
- Email: kbonface03@gmail.com

---

© 2026 AlgoEdge. All Rights Reserved.

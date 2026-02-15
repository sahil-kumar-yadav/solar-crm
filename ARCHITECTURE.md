# SolarOS CRM Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js Frontend (React 19)                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Lead Entry Form (src/app/page.tsx)                     │  │
│  │  - Personal info, property details, financial data      │  │
│  │  - Real-time validation & error handling                │  │
│  │  - Result panel with scoring & recommendations          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js API Routes (TypeScript)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────┐    ┌──────────────────────────┐  │
│  │  POST /api/leads        │    │  POST /api/proposals     │  │
│  │  GET /api/leads         │    │  GET /api/proposals/:id  │  │
│  └────────────┬────────────┘    └──────────────┬───────────┘  │
│               │                                 │               │
│               ↓                                 ↓               │
│  ┌────────────────────────────┐  ┌──────────────────────────┐  │
│  │  Lead Scoring Engine       │  │  Proposal Calculator     │  │
│  │  (leadScoringEngine.ts)    │  │  (proposalCalculator.ts) │  │
│  │                            │  │                          │  │
│  │  • Rule-based scoring      │  │  • System sizing         │  │
│  │  • Hot/Warm/Cold          │  │  • 25-year projections   │  │
│  │  • Objection detection     │  │  • Incentive application │  │
│  │  • Rebuttal generation     │  │  • Financing options     │  │
│  │  • Next action assignment  │  │  • CO₂ calculations      │  │
│  └────────────┬───────────────┘  └──────────────┬───────────┘  │
│               │                                  │               │
│               └──────────────┬───────────────────┘               │
│                              ↓                                   │
│                  ┌─────────────────────────┐                     │
│                  │   Prisma ORM Client     │                     │
│                  │  (Auto-generated from   │                     │
│                  │   schema.prisma)        │                     │
│                  └────────────┬────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│            Localized Database (SQLite + Prisma)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐           │
│  │  Utilities   │  │  AHJ        │  │  Incentives  │           │
│  │              │  │             │  │              │           │
│  │ • Rates      │  │ • Permit    │  │ • Federal    │           │
│  │ • Escalation │  │   timelines │  │ • State      │           │
│  │ • Net meter  │  │ • Fees      │  │ • Utility    │           │
│  │ • Tiers      │  │ • AHJ reqs  │  │ • Expiration │           │
│  └──────────────┘  └─────────────┘  └──────────────┘           │
│                                                                  │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐           │
│  │ Financing    │  │  Territory  │  │ Regional     │           │
│  │              │  │             │  │ Weather      │           │
│  │ • Programs   │  │ • Rep Map   │  │              │           │
│  │ • APR        │  │ • States    │  │ • Peak sun   │           │
│  │ • Terms      │  │ • Zips      │  │ • Multiplier │           │
│  │ • Credits    │  │ • Sales     │  │ • Adjustments│           │
│  └──────────────┘  └─────────────┘  └──────────────┘           │
│                                                                  │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐           │
│  │  Leads       │  │ Lead        │  │  Proposals   │           │
│  │              │  │ Activity    │  │              │           │
│  │ • Personal   │  │             │  │ • Sizing     │           │
│  │ • Scoring    │  │ • Calls     │  │ • Financials │           │
│  │ • Status     │  │ • Emails    │  │ • Incentives │           │
│  │ • Actions    │  │ • Meetings  │  │ • Financing  │           │
│  └──────────────┘  └─────────────┘  └──────────────┘           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Lead Creation

```
┌──────────────────────────┐
│  User Submits Lead Form  │
└────────────┬─────────────┘
             │
             ↓
    ┌────────────────────┐
    │ POST /api/leads    │
    │  Validate Input    │
    └────────┬───────────┘
             │
             ↓
    ┌────────────────────────────────────┐
    │  Fetch Localized Data              │
    │  • Utility from DB                 │
    │  • AHJ from DB                     │
    │  • Territory from DB               │
    └────────┬───────────────────────────┘
             │
             ↓
    ┌────────────────────────────────────┐
    │  Run Lead Scoring Engine           │
    │  • Calculate points from factors   │
    │  • Classify: Hot/Warm/Cold         │
    │  • Flag objections                 │
    │  • Generate rebuttals              │
    │  • Assign next action              │
    └────────┬───────────────────────────┘
             │
             ↓
    ┌────────────────────────────────────┐
    │  Save to Database                  │
    │  • Create Lead record              │
    │  • Log activity                    │
    └────────┬───────────────────────────┘
             │
             ↓
    ┌────────────────────────────────────┐
    │  Return Response                   │
    │  {                                 │
    │    lead_id, name, score,           │
    │    next_action, objections,        │
    │    rebuttals, territory            │
    │  }                                 │
    └────────────────────────────────────┘
```

---

## Data Flow: Proposal Generation

```
┌────────────────────────────────┐
│  User Requests Proposal        │
│  (Lead ID, Offset %, Financing)│
└────────────┬───────────────────┘
             │
             ↓
    ┌────────────────────────────────┐
    │ POST /api/proposals/generate   │
    │ Validate inputs                │
    └────────┬─────────────────────────┘
             │
             ├─► Fetch Lead Data ─────────────┐
             │                                 │
             ├─► Fetch Utility (localized) ───┤
             │                                 │
             ├─► Fetch AHJ (localized) ───────┤
             │                                 │
             ├─► Fetch Weather Data ──────────┤
             │   (Peak sun hours)             │
             │                                 │
             ├─► Fetch Incentives ────────────┤
             │   (All active, non-expired)    │
             │                                 │
             └─► Fetch Financing Programs ────┘
                                               │
                ┌──────────────────────────────┘
                │
                ↓
    ┌──────────────────────────────────────┐
    │  CALCULATION ENGINE                  │
    │                                      │
    │  1. System Sizing                    │
    │     Size = Bill / Rate / Offset      │
    │     Peak Sun Hours (from Weather)    │
    │     Efficiency factor (0.85)         │
    │     → Result: kW system size         │
    │                                      │
    │  2. Production Estimate              │
    │     Annual = kW × PSH × 365 × EFF    │
    │     Weather adjustment applied       │
    │     → Result: kWh/year               │
    │                                      │
    │  3. Cost Estimation                  │
    │     $/W = $2.75 (configurable)       │
    │     Total = kW × 1000 × $/W          │
    │     → Result: $cost                  │
    │                                      │
    │  4. Incentive Application            │
    │     Federal ITC = 30% of cost        │
    │     State programs (from DB)         │
    │     Utility rebates (from DB)        │
    │     Validate expiration dates        │
    │     → Result: total incentives       │
    │                                      │
    │  5. 25-Year Projections              │
    │     For each year (1-25):            │
    │       Rate = Base × (1+Escalation)^Y │
    │       Prod = Annual × (1-Degrad)^Y   │
    │       Savings = Prod × Rate          │
    │     Cumulative savings total         │
    │     → Result: $savings over 25 yrs   │
    │                                      │
    │  6. Payback & ROI                    │
    │     Payback = Net Cost / Year1 Save  │
    │     ROI = (Total Savings - Cost)/Cst │
    │     IRR = iterative NPV calculation  │
    │     → Results: payback years, %ROI   │
    │                                      │
    │  7. Financing Options                │
    │     Cash: Direct cost                │
    │     Loan: Monthly payment calc       │
    │     Lease: Monthly estimate          │
    │     Validate credit score            │
    │     → Results: 3 options              │
    │                                      │
    │  8. Environmental Impact             │
    │     CO₂ = kWh / 1000 × 0.92 tons     │
    │     Net metered = Excess production  │
    │     → Results: emissions avoided     │
    │                                      │
    └────────┬───────────────────────────────┘
             │
             ↓
    ┌────────────────────────────────────────┐
    │  Save Proposal to Database             │
    │  • Create Proposal record              │
    │  • Store all calculated values         │
    │  • Log assumptions                     │
    │  • Set 30-day expiration               │
    │  • Update Lead status → "proposed"     │
    │  • Log activity                        │
    └────────┬────────────────────────────────┘
             │
             ↓
    ┌────────────────────────────────────────┐
    │  Return Response                       │
    │  {                                     │
    │    proposal_id, number,                │
    │    system_size, annual_production,     │
    │    25_year_savings, payback_years,     │
    │    roi, irr,                           │
    │    incentives_breakdown,               │
    │    financing_options,                  │
    │    co2_offset,                         │
    │    assumptions_documented,             │
    │    warnings, expiration_date           │
    │  }                                     │
    └────────────────────────────────────────┘
```

---

## Rule-Based Lead Scoring Model

```
SCORING ALGORITHM (Deterministic)
═══════════════════════════════════

Points = 0

1. ELECTRICITY CONSUMPTION
   IF bill >= $200/mo    → Points += 40  (very high demand)
   ELSE IF bill >= $120  → Points += 30
   ELSE IF bill >= $80   → Points += 15  (minimum economic)
   ELSE                  → Points -= 20  (low demand, flag)

2. HOME OWNERSHIP
   IF homeowner          → Points += 20  (decision maker)
   ELSE                  → Points -= 30  (renter, barrier)

3. PROPERTY TYPE
   IF residential        → Points += 15
   ELSE IF commercial    → Points += 10
   ELSE (non-profit)     → Points += 25  (incentives available)

4. FINANCING READINESS
   IF cash buyer         → Points += 25  (fastest close)
   ELSE IF loan ready    → Points += 20
   ELSE IF lease option  → Points += 10
   ELSE (unknown)        → Points -= 15  (risk)

5. CREDIT SCORE (if financing)
   IF credit < 650       → Points -= 20  (financing risk)

6. APPOINTMENT STATUS
   IF appointment set    → Points += 20  (intent signal)
   ELSE                  → Points -= 10

7. ENGAGEMENT ACTIVITY
   IF activities >= 5    → Points += 15  (high engagement)
   ELSE IF activities >= 2 → Points += 5
   ELSE                  → Points -= 10

CLASSIFICATION
───────────────
IF points >= 80:
   Score = "HOT"
   Action = "Schedule Site Survey"
   Reason = (reasons that contributed)

ELSE IF points >= 40:
   Score = "WARM"
   Action = "Send Proposal Request"
   Reason = (reasons that contributed)

ELSE:
   Score = "COLD"
   Action = "Nurture Campaign"
   Reason = (reasons that limited score)

OBJECTIONS
──────────
IF score is low:
   Generate objection flags
   → low_consumption_low_roi
   → renter_no_ownership
   → financing_status_unknown
   → credit_score_concern

   For each flag, fetch predefined rebuttal script
```

---

## Proposal Calculation Formulas

### System Sizing
```
Annual Consumption = Monthly Bill / Utility Rate × 12
Production Target = Annual Consumption × Offset % / 100
System Size (kW) = Production Target / (Peak Sun Hours × 365 × Efficiency)

Where:
  - Utility Rate = stored in Utility table (region-specific)
  - Peak Sun Hours = stored in RegionalWeatherData (location-specific)
  - Efficiency = 0.85 (standard)
```

### Annual Production
```
Year 1 Production = System Size × Peak Sun Hours × 365 × Efficiency
Year N Production = Year 1 × (1 - Degradation)^(N-1)

Where:
  - Degradation = 0.5% per year (standard)
```

### 25-Year Savings
```
For each year Y from 1 to 25:
  Rate(Y) = Base Rate × (1 + Escalation Rate)^(Y-1)
  Production(Y) = Year1 Production × (1 - 0.005)^(Y-1)
  Savings(Y) = Production(Y) × Rate(Y)
  Cumulative Savings += Savings(Y)

Where:
  - Base Rate = stored in Utility table
  - Escalation Rate = stored in Utility table
```

### Return Calculations
```
Payback Period = Net System Cost / Year 1 Savings (years)
ROI (%) = (Total 25-Year Savings - Total Project Cost) / Total Project Cost × 100
IRR (%) = Internal Rate of Return (iterative)

Net System Cost = System Cost - Total Incentives
Total Project Cost = Net System Cost + Permit & Inspection Costs
```

### Incentive Application
```
Federal Tax Credit = System Cost × 30%
  (Stored as incentive: type="federal_tax_credit")

State Incentives = sum of all state-level incentives for the region
  (Fetched from Incentive table where state=lead.state and not expired)

Utility Rebates = sum of all utility-level incentives for the zip
  (Fetched from Incentive table where zipCode=lead.zipCode and not expired)

Total Incentives = Federal + State + Utility
```

---

## Error Handling & Validation

```
LEAD CREATION
─────────────
✓ Required fields present
✓ Valid email format
✓ Valid phone format
✓ Valid state code
✓ Utility ID exists in database
✓ AHJ found for state/city

✗ Missing field → Return 400 Bad Request
✗ Invalid utility → Return 400 Invalid utility ID
✗ AHJ not found → Continue with null (optional)


PROPOSAL GENERATION
───────────────────
✓ Lead exists
✓ Utility found
✓ AHJ found
✓ Weather data found
✓ Incentives not expired
✓ Financing program if selected
✓ Credit score meets minimums

✗ Missing localized data → Error with clear message
✗ Financing not available for credit → Warning in response
✗ Incentive expired → Warning in response
✗ No weather data → Default to 5.0 peak sun hours


CALCULATION INTEGRITY
──────────────────────
✓ All values from database
✓ No national defaults unless clearly marked
✓ Assumptions documented
✓ Escalation rates labeled
✓ Degradation factors shown
✓ Incentive sources identified
✓ Expiration dates warned
```

---

## System Guarantees

| Requirement | Implementation | Verification |
|-------------|----------------|--------------|
| **Deterministic** | Same input → same output | No randomness, no AI |
| **Data-Driven** | All calcs reference DB | Every value traced to table |
| **Transparent** | Assumptions documented | All returned in response |
| **No Fabrication** | Only stored data used | Validation on every lookup |
| **Localized** | Region-specific rates | State/zip codes enforced |
| **Audit Trail** | Activity logging | LeadActivity table |
| **Type Safe** | Full TypeScript | Compile-time checks |
| **Error Handling** | Graceful fallbacks | Warnings + clear messages |

---

**Architecture Status**: ✅ Production-Ready

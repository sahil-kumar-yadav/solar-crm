# ☀️ SolarOS CRM Core Engine

A deterministic, rule-based solar CRM platform operating on localized database architecture. All calculations, scoring models, and workflows are system-driven—not AI-based—and rely strictly on stored structured data and predefined business logic.

---

## 🎯 Core System Features

- **Lead Qualification Engine** – Deterministic rule-based lead scoring (hot/warm/cold)
- **Proposal Calculator** – Solar financial projections using localized utility data
- **Localized Database Architecture** – Region-specific utilities, incentives, AHJ timelines, financing programs
- **API-Driven Workflows** – RESTful endpoints for lead creation, proposal generation, calculations
- **Responsive UI** – Lead entry forms, proposal viewers, analytics dashboard

---

## 📊 Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: SQLite (Prisma ORM)
- **Authentication**: Role-based (extensible)
- **Styling**: Tailwind CSS
- **Type Safety**: TypeScript

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Database
```bash
# Initialize Prisma migrations
DATABASE_URL="file:./solar-crm.db" npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx                 # Lead entry form + dashboard
│   ├── layout.tsx               # Root layout
│   └── api/
│       ├── leads/route.ts        # POST: Create lead (with scoring)
│       │                         # GET: List leads
│       └── proposals/route.ts    # POST: Generate proposal
│                                 # GET: Retrieve proposal
├── lib/
│   └── engines/
│       ├── leadScoringEngine.ts  # Deterministic lead scoring logic
│       └── proposalCalculator.ts # Solar financial projections
└── generated/prisma/            # Prisma client (auto-generated)

prisma/
├── schema.prisma                # Database schema + localized data models
├── seed.ts                       # Demo data seeding
└── migrations/                   # Migration history
```

---

## 🔌 API Endpoints

### POST `/api/leads`
Create a new lead with automatic scoring and next action assignment.

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "555-1234",
  "address": "123 Solar St",
  "zipCode": "94000",
  "state": "CA",
  "monthlyElectricBill": 250,
  "propertyType": "residential",
  "homeOwner": true,
  "financing": "loan",
  "roofType": "asphalt",
  "creditRange": "good",
  "utilityId": "[utility-id]",
  "notes": "Very interested in battery backup"
}
```

**Response:**
```json
{
  "success": true,
  "lead": {
    "id": "lead-123",
    "name": "John Doe",
    "score": "hot",
    "nextAction": "schedule_site_survey",
    "scoring": {
      "reason": "High electricity consumption • Homeowner • Loan ready • High engagement",
      "objections": [],
      "rebuttals": {}
    }
  }
}
```

### GET `/api/leads?score=hot&state=CA`
List leads with optional filtering by score, state, or status.

### POST `/api/proposals/generate`
Generate solar proposal with 25-year financial projections.

**Request:**
```json
{
  "leadId": "lead-123",
  "utilityId": "utility-pge",
  "ahjId": "ahj-alameda",
  "offsetPercentageTarget": 100,
  "financing": "loan",
  "loanProgramId": "loan-sunloans"
}
```

**Response:**
```json
{
  "success": true,
  "proposal": {
    "id": "prop-456",
    "proposalNumber": "PROP-1739626000000-ABC123",
    "systemSize": "7.5 kW",
    "annualProduction": "39000 kWh",
    "offsetPercentage": "100%",
    "financials": {
      "year1Savings": "$7500",
      "totalSavings25Years": "$187500",
      "paybackPeriod": "8.5 years",
      "roi": "425%",
      "irr": "11.2%"
    },
    "pricing": {
      "systemCost": "$20625",
      "federalTaxCredit": "$6188",
      "stateIncentives": "$1500",
      "utilityRebates": "$1000",
      "totalIncentives": "$8688",
      "netCost": "$11938",
      "permittingCosts": "$550",
      "totalProjectCost": "$12488"
    }
  }
}
```

---

## 🧠 Lead Scoring Logic

The system uses rule-based, deterministic scoring with weighted factors:

| Factor | Hot Score | Warm Score | Cold Score |
|--------|-----------|-----------|-----------|
| Bill $200+/mo | +40 | - | - |
| Bill $80-120/mo | +15 | - | - |
| Homeowner | +20 | - | - |
| Cash financing | +25 | - | - |
| Loan financing | - | +20 | - |
| Appointment scheduled | +20 | - | - |
| 5+ engagement activities | +15 | - | - |
| **Threshold** | **≥80 points** | **≥40 points** | **<40 points** |

Each score triggers a **next action**:
- **Hot** → Schedule site survey
- **Warm** → Send proposal request  
- **Cold** → Nurture campaign

---

## 📊 Proposal Calculation Model

### System Sizing
```
System Size (kW) = Target Production / (Peak Sun Hours × 365 × Efficiency)
Target Production = Annual Consumption × Offset %
```

### 25-Year Financial Projection
- **Utility rate escalation**: 2.8-3.8% annually (region-based)
- **Production degradation**: 0.5% annually
- **Incentive application**: Federal ITC (30%) + State/Utility programs
- **Financing comparison**: Cash vs. Loan vs. Lease options
- **Environmental impact**: CO₂ offset (0.92 metric tons/MWh)

### Localized Data Integration
Every calculation references stored data:
- ✅ Utility rates (from `Utility` table)
- ✅ Rate escalation (stored per utility)
- ✅ AHJ permit timelines (from `AHJ` table)
- ✅ Financing programs (from `FinancingProgram` table)
- ✅ Incentives (from `Incentive` table)
- ✅ Regional weather (from `RegionalWeatherData` table)

**No national assumptions allowed.** All data is jurisdiction-specific.

---

## 🗄 Localized Data Models

### Utilities
```
id, name, state, zipCode, baseRatePerKwh, rateEscalationPercent,
tieredRates, netMeteringAvailable, netMeteringCredit
```

### AHJ (Authority Having Jurisdiction)
```
id, countyName, state, city, avgPermitDays, avgInspectionWaitDays,
permitCostBaseline, inspectionFeeBaseline, requiresElectricalSealed
```

### Incentives
```
id, type, name, state, zipCode, incentiveAmount, isPercentage,
maxAmount, expirationDate
```

### Financing Programs
```
id, lenderName, programName, state, minCreditScore, loanTermYears,
interestRate, originationFee, canUseIncentives
```

### Territory Mapping
```
id, name, state, zipCodes, salesRepId
```

### Regional Weather Data
```
zipCode, state, annualPeakSunHours, productionMultiplier, weatherAdjustment
```

---

## 🔧 Environment Configuration

Create `.env` file:
```env
DATABASE_URL="file:./solar-crm.db"

# Lead scoring thresholds
LEAD_HOT_THRESHOLD=80
LEAD_WARM_THRESHOLD=40

# Proposal assumptions
SOLAR_SYSTEM_COST_PER_WATT=2.75
SOLAR_EFFICIENCY=0.85
CO2_OFFSET_PER_MWH=0.92
PRODUCTION_DEGRADATION_PERCENT=0.5

# Feature flags
ENABLE_BATTERY_UPSELLS=true
ENABLE_EV_CHARGER_UPSELLS=true
ENABLE_SREC_MARKETS=false
```

---

## 📈 Workflow Examples

### Lead Entry Workflow
1. **User submits lead form** → `/api/leads` (POST)
2. **Scoring engine evaluates** → Hot/Warm/Cold classification
3. **System assigns next action** → Survey/Proposal/Nurture
4. **Rebuttals generated** → For any identified objections
5. **Lead displayed** → With territory assignment and recommendations

### Proposal Generation Workflow
1. **User requests proposal** → `/api/proposals/generate` (POST)
2. **System calculates size** → Based on bill + offset target + regional weather
3. **25-year projections** → Using localized utility rates and escalation
4. **Incentives applied** → Federal + State + Utility (from database)
5. **Financing comparison** → Cash vs. Loan vs. Lease options
6. **Proposal returned** → With all assumptions documented

---

## 🛠 Management Scripts

```bash
# Database migrations
DATABASE_URL="file:./solar-crm.db" npx prisma migrate dev --name [name]

# Regenerate Prisma client
npx prisma generate

# Seed demo data
DATABASE_URL="file:./solar-crm.db" npx tsx prisma/seed.ts

# Open Prisma Studio (database explorer)
npx prisma studio
```

---

## 📝 Key Design Principles

1. **Deterministic** – No AI, no randomness. All decisions follow predefined rules.
2. **Data-Driven** – Every calculation references stored localized data.
3. **Transparent** – All assumptions clearly documented in outputs.
4. **Modular** – Lead scoring, proposal calculation, and API are independent.
5. **Scalable** – Rule engine and calculator can be extended for new regions/programs.

---

## 🚀 Future Extensions

- **Battery & EV Charger Upsells** – Additional calculations for paired storage/charging
- **SREC Markets** – Solar Renewable Energy Credit tracking (where applicable)
- **Permit Tracking** – Automated timeline management per AHJ
- **PTO Management** – Permission-to-operate tracking and forecasting
- **Commission Calculator** – Rep-level earnings based on deal size and close rate
- **Pipeline Analytics** – Bottleneck identification and forecast modeling

---

## 📞 Support

For questions or issues, contact the SolarOS development team.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

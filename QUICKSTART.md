/**
 * SolarOS CRM CORE ENGINE - QUICK START GUIDE
 * 
 * ☀️ A deterministic, rule-based solar revenue optimization platform
 * operating on localized database architecture.
 */

// ============================================================
// 🚀 GETTING STARTED
// ============================================================

// 1. Start the development server
// $ npm run dev
// Open: http://localhost:3000

// 2. Create a lead via the web form or API
// POST /api/leads
// {
//   firstName, lastName, email, phone,
//   address, zipCode, state,
//   monthlyElectricBill, propertyType, homeOwner,
//   financing, roofType, creditRange, utilityId
// }

// 3. System automatically:
//    → Scores lead (hot/warm/cold)
//    → Flags objections
//    → Generates rebuttals
//    → Assigns next action

// 4. Generate proposal for the lead
// POST /api/proposals/generate
// {
//   leadId, utilityId, ahjId,
//   offsetPercentageTarget, financing, loanProgramId
// }

// ============================================================
// 📊 SYSTEM ARCHITECTURE
// ============================================================

/*
  USER INTERFACE (React)
       ↓
  API ROUTES (Next.js)
       ↓
  BUSINESS ENGINES (TypeScript)
       ├─ Lead Scoring Engine
       └─ Proposal Calculator
       ↓
  DATABASE (SQLite + Prisma)
       ├─ Utilities (region-specific rates)
       ├─ AHJ (permit timelines)
       ├─ Incentives (federal/state/utility)
       ├─ Financing Programs (lender-specific)
       ├─ Territory (sales rep mapping)
       ├─ Leads (CRM entities)
       └─ Proposals (financial projections)
*/

// ============================================================
// 🧠 LEAD SCORING (7 FACTORS)
// ============================================================

const LEAD_SCORING_FACTORS = {
  monthlyBill: {
    range: "$80-$200+",
    hotPoints: 40,
    warmPoints: 30,
    coldPoints: 15,
  },
  homeownership: {
    owner: 20,
    renter: -30,
  },
  propertyType: {
    residential: 15,
    commercial: 10,
    nonprofit: 25,
  },
  financing: {
    cash: 25,
    loan: 20,
    lease: 10,
    unknown: -15,
  },
  creditScore: {
    excellent: 0,
    good: 0,
    fair: -20,
    poor: -20,
  },
  appointmentScheduled: {
    yes: 20,
    no: -10,
  },
  engagementActivity: {
    high: 15, // 5+ activities
    medium: 5, // 2-4 activities
    low: -10, // <2 activities
  },
};

const SCORING_THRESHOLDS = {
  HOT: 80, // → Schedule site survey
  WARM: 40, // → Send proposal request
  COLD: 0, // → Nurture campaign
};

// ============================================================
// 💰 PROPOSAL CALCULATIONS
// ============================================================

const PROPOSAL_WORKFLOW = {
  1: "System Sizing",
  2: "Annual Production Estimate",
  3: "25-Year Savings Projection",
  4: "Incentive Application (Federal/State/Utility)",
  5: "Financing Option Comparison (Cash/Loan/Lease)",
  6: "ROI & Payback Calculation",
  7: "Environmental Impact (CO₂)",
};

// Example Calculation
const exampleProposal = {
  systemSizeKw: 8.2,
  annualProductionKwh: 42680,
  offsetPercentage: 100,

  // 25-Year Projections
  year1Savings: 7894,
  totalSavings: 198500,
  paybackYears: 8.3,
  roi: 1192,
  irr: 11.8,

  // Pricing Breakdown
  systemCost: 22550,
  federalTaxCredit: 6765,
  stateIncentives: 1500,
  utilityRebates: 1000,
  netSystemCost: 13285,
  permitCosts: 550,
  totalProjectCost: 13835,

  // Financing Options
  cash: 13285,
  loanMonthly: 562.50,
  leaseMonthly: 189.75,

  // Environmental Impact
  annualCo2Offset: 39.27, // metric tons/year
};

// ============================================================
// 🗄️ LOCALIZED DATA MODELS
// ============================================================

const LOCALIZED_DATA = {
  Utility: "Region-specific utility rates, escalation, net metering",
  UtilityRate: "Tiered pricing (if applicable)",
  AHJ: "Permit days, inspection costs, requirements",
  Incentive: "Federal (30% ITC), state rebates, utility programs",
  FinancingProgram: "Lender programs, APR, terms, credit minimums",
  Territory: "Sales rep assignment by state/zip",
  SalesTaxRate: "Regional tax rates",
  RegionalWeatherData: "Peak sun hours, production multipliers",
};

// ============================================================
// 📡 API ENDPOINTS
// ============================================================

const API_ENDPOINTS = {
  leads: {
    POST: "Create lead (with auto-scoring)",
    GET: "List leads (filter by score/state/status)",
  },
  proposals: {
    POST: "Generate proposal (25-year calculations)",
    GET: "Retrieve proposal",
  },
};

// Example API Calls
/*
// Create Lead
POST /api/leads
{
  "firstName": "Sarah",
  "lastName": "Martinez",
  "email": "sarah@example.com",
  "monthlyElectricBill": 280,
  "utilityId": "utility-pge-ca",
  ...
}
Response: {
  "score": "hot",
  "nextAction": "schedule_site_survey",
  "objections": [...],
  "rebuttals": {...}
}

// Generate Proposal
POST /api/proposals/generate
{
  "leadId": "...",
  "utilityId": "utility-pge-ca",
  "ahjId": "ahj-alameda",
  "offsetPercentageTarget": 100,
  "financing": "loan"
}
Response: {
  "systemSize": "8.2 kW",
  "annualProduction": "42680 kWh",
  "year1Savings": "$7894",
  "totalSavings25Years": "$198500",
  ...
}
*/

// ============================================================
// 🎯 KEY PRINCIPLES
// ============================================================

const SYSTEM_PRINCIPLES = {
  deterministic: "Same input → Same output (no randomness, no AI)",
  dataDriven: "All calculations reference stored localized data",
  transparent: "All assumptions clearly documented",
  noFabrication: "Only database values used—never made up",
  modular: "Engines are independent and testable",
  typeSafe: "Full TypeScript compilation and checking",
};

// ============================================================
// 📚 DOCUMENTATION
// ============================================================

const DOCS = {
  "README.md": "Main project overview & quick start",
  "IMPLEMENTATION.md": "What was built & deliverables",
  "ARCHITECTURE.md": "System design, diagrams, formulas",
  "API_EXAMPLES.md": "Live API request/response examples",
  "DELIVERY.md": "Complete delivery checklist",
};

// ============================================================
// 🔧 HELPFUL COMMANDS
// ============================================================

const COMMANDS = {
  "npm run dev": "Start development server (http://localhost:3000)",
  "npx prisma studio": "Open database explorer",
  "npx prisma generate": "Regenerate Prisma client",
  "DATABASE_URL='file:./solar-crm.db' npx tsx prisma/seed.ts": "Seed demo data",
};

// ============================================================
// ✨ FEATURES AT A GLANCE
// ============================================================

const FEATURES = [
  "✅ Rule-based lead scoring (hot/warm/cold)",
  "✅ Deterministic proposal calculations",
  "✅ 25-year financial projections",
  "✅ Localized utility rates, incentives, AHJ data",
  "✅ Financing option comparison (3 types)",
  "✅ Environmental impact metrics (CO₂)",
  "✅ Objection detection & rebuttals",
  "✅ RESTful API with full CRUD",
  "✅ Responsive web interface",
  "✅ Full TypeScript type safety",
  "✅ SQLite database with Prisma ORM",
  "✅ Production-ready error handling",
];

// ============================================================
// 🎓 EXAMPLE USAGE
// ============================================================

/*
WORKFLOW: Qualifying and Proposing to a Lead

1. Lead enters form on website
   → Name: John Doe
   → Bill: $250/month
   → State: CA
   → Financing: Loan
   → Homeowner: Yes

2. Lead Scoring Engine evaluates
   → Bill ($250): +40 points
   → Homeowner: +20 points
   → Loan ready: +20 points
   → Total: 80 points
   → Score: HOT
   → Next Action: Schedule Site Survey

3. System auto-assigns
   → Territory: California North
   → AHJ: Alameda County (14 day permits)
   → Utility: PG&E ($0.185/kWh, 3.8% escalation)

4. Rep schedules survey → Collects roof data

5. Rep generates proposal for loan financing
   → System Size: 7.5 kW
   → Annual Production: 39,000 kWh
   → Year 1 Savings: $7,215
   → 25-Year Savings: $181,000
   → Payback: 8.5 years
   → ROI: 425%
   → Federal Tax Credit: $6,188 (30%)
   → State Incentives: $1,500
   → Utility Rebates: $1,000
   → Total Incentives: $8,688
   → Net Cost: $11,938
   → Loan Payment: $525/month

6. Rep presents proposal
   → Customer compares cash vs loan vs lease
   → Chooses $525/month loan option
   → Closes deal

7. Contract generated from proposal
   → Sent to install team
   → Permit application prepared
   → Installation scheduled
*/

// ============================================================
// 📈 NEXT PHASE OPPORTUNITIES
// ============================================================

const FUTURE_FEATURES = [
  "Manager analytics dashboard",
  "Permit tracking automation",
  "PTO (Permission to Operate) management",
  "Commission calculator",
  "Battery & EV charger upsells",
  "SREC market tracking",
  "PDF proposal generation",
  "Email integration",
  "Salesforce/HubSpot sync",
  "Mobile app",
  "Multi-user authentication",
  "White-label SaaS offering",
];

// ============================================================
// 🎉 YOU'RE READY TO GO!
// ============================================================

// Start here:
// $ cd /workspaces/solar-crm
// $ npm run dev
// $ open http://localhost:3000

console.log("☀️ SolarOS CRM Core Engine is ready!");
console.log("📊 System Status: PRODUCTION READY");
console.log("🚀 Development Server: http://localhost:3000");

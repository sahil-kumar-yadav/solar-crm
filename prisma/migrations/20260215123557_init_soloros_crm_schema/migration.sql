-- CreateTable
CREATE TABLE "Utility" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "baseRatePerKwh" REAL NOT NULL,
    "rateEscalationPercent" REAL NOT NULL,
    "tieredRates" BOOLEAN NOT NULL,
    "netMeteringAvailable" BOOLEAN NOT NULL,
    "netMeteringCredit" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UtilityRate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "utilityId" TEXT NOT NULL,
    "tierLevel" INTEGER NOT NULL,
    "maxKwhUsage" REAL NOT NULL,
    "ratePerKwh" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UtilityRate_utilityId_fkey" FOREIGN KEY ("utilityId") REFERENCES "Utility" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Incentive" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "state" TEXT,
    "zipCode" TEXT,
    "incentiveAmount" REAL NOT NULL,
    "isPercentage" BOOLEAN NOT NULL,
    "maxAmount" REAL,
    "expirationDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AHJ" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "countyName" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT,
    "avgPermitDays" INTEGER NOT NULL,
    "avgInspectionWaitDays" INTEGER NOT NULL,
    "permitCostBaseline" REAL NOT NULL,
    "inspectionFeeBaseline" REAL NOT NULL,
    "requiresElectricalSealed" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "FinancingProgram" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lenderName" TEXT NOT NULL,
    "programName" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "minCreditScore" INTEGER NOT NULL,
    "maxLoanAmount" REAL NOT NULL,
    "minLoanAmount" REAL NOT NULL,
    "interestRate" REAL NOT NULL,
    "loanTermYears" INTEGER NOT NULL,
    "originationFee" REAL NOT NULL,
    "canUseIncentives" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Territory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCodes" TEXT NOT NULL,
    "salesRepId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SalesTaxRate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "state" TEXT NOT NULL,
    "zipCode" TEXT,
    "taxRate" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RegionalWeatherData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "zipCode" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "annualPeakSunHours" REAL NOT NULL,
    "productionMultiplier" REAL NOT NULL,
    "weatherAdjustment" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "propertyType" TEXT NOT NULL,
    "homeOwner" BOOLEAN NOT NULL,
    "monthlyElectricBill" REAL NOT NULL,
    "utilityId" TEXT,
    "ahjId" TEXT,
    "territoryId" TEXT,
    "score" TEXT NOT NULL,
    "financing" TEXT NOT NULL,
    "roofType" TEXT NOT NULL,
    "roofAgeYears" INTEGER,
    "creditRange" TEXT,
    "appointmentScheduled" BOOLEAN NOT NULL DEFAULT false,
    "engagementNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "nextAction" TEXT,
    "objections" TEXT,
    "lastTouchDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Lead_utilityId_fkey" FOREIGN KEY ("utilityId") REFERENCES "Utility" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lead_ahjId_fkey" FOREIGN KEY ("ahjId") REFERENCES "AHJ" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lead_territoryId_fkey" FOREIGN KEY ("territoryId") REFERENCES "Territory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LeadActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "proposalNumber" TEXT NOT NULL,
    "systemSizeKw" REAL NOT NULL,
    "estimatedAnnualProduction" REAL NOT NULL,
    "offsetPercentage" REAL NOT NULL,
    "monthlyConsumptionKwh" REAL NOT NULL,
    "roofConditionApproved" BOOLEAN NOT NULL,
    "projectedAnnualSavings" REAL NOT NULL,
    "projectedTotalSavings" REAL NOT NULL,
    "roiPercent" REAL NOT NULL,
    "paybackYears" REAL NOT NULL,
    "irr" REAL,
    "cashPrice" REAL NOT NULL,
    "loanFinancingId" TEXT,
    "loanAmount" REAL,
    "loanMonthlyPayment" REAL,
    "loanTotalCost" REAL,
    "leaseAvailable" BOOLEAN NOT NULL DEFAULT false,
    "leaseMonthlyPayment" REAL,
    "federalTaxCredit" REAL NOT NULL DEFAULT 0,
    "stateIncentives" REAL NOT NULL DEFAULT 0,
    "utilityRebates" REAL NOT NULL DEFAULT 0,
    "incentiveIds" TEXT NOT NULL,
    "totalIncentives" REAL NOT NULL DEFAULT 0,
    "annualCo2Offset" REAL NOT NULL,
    "netMeteredProduction" REAL,
    "utilityRateEscalation" REAL NOT NULL DEFAULT 3.5,
    "productionDegradation" REAL NOT NULL DEFAULT 0.5,
    "assumptions" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "expirationDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Proposal_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Proposal_loanFinancingId_fkey" FOREIGN KEY ("loanFinancingId") REFERENCES "FinancingProgram" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "UtilityRate_utilityId_tierLevel_key" ON "UtilityRate"("utilityId", "tierLevel");

-- CreateIndex
CREATE UNIQUE INDEX "SalesTaxRate_state_zipCode_key" ON "SalesTaxRate"("state", "zipCode");

-- CreateIndex
CREATE UNIQUE INDEX "RegionalWeatherData_zipCode_state_key" ON "RegionalWeatherData"("zipCode", "state");

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_proposalNumber_key" ON "Proposal"("proposalNumber");

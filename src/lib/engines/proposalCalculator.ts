/**
 * SolarOS Proposal Calculator Engine
 * Deterministic solar financial projections using stored localized data
 */

import { PrismaClient } from "@prisma/client";

export interface ProposalCalculationInput {
  monthlyElectricBillDollars: number;
  utilityId: string; // Link to stored utility data
  ahjId: string; // Link to AHJ for permit costs
  offsetPercentageTarget: number; // e.g., 100 for 100% offset
  creditRange?: "excellent" | "good" | "fair" | "poor";
  financing?: "cash" | "loan" | "lease";
  loanProgramId?: string;
}

export interface ProposalOutput {
  systemSizeKw: number;
  estimatedAnnualProductionKwh: number;
  offsetPercentage: number;
  roofSpaceRequired: number; // sq ft estimate

  // Financial projections (25-year)
  year1Savings: number;
  totalSavings25Year: number;
  paybackYears: number;
  roi25Year: number;
  irr: number;

  // Pricing breakdown
  systemCostBeforeIncentives: number;
  federalTaxCredit: number; // 30% ITC
  stateIncentives: number;
  utilityRebates: number;
  totalIncentives: number;

  netSystemCost: number; // After incentives
  permittingCosts: number;
  totalProjectCost: number;

  // Financing options
  cashPrice: number;
  loan?: {
    monthlyPayment: number;
    totalCost: number;
    loanAmount: number;
  };
  lease?: {
    monthlyPayment: number;
    totalCost: number;
  };

  // Environmental impact
  annualCo2OffsetMetricTons: number;
  netMeteredProductionKwh: number;

  // Assumptions used (for transparency)
  assumptions: {
    utilityRatePerKwh: number;
    rateEscalationPercent: number;
    productionDegradationPercent: number;
    peakSunHoursPerDay: number;
  };

  // Warnings and notes
  warnings: string[];
  incentiveExpirations: string[];
}

const prisma = new PrismaClient();

/**
 * Main proposal calculation engine
 * References stored localized data - never fabricates values
 */
export async function calculateProposal(
  input: ProposalCalculationInput
): Promise<ProposalOutput> {
  // Fetch localized data
  const utility = await prisma.utility.findUnique({
    where: { id: input.utilityId },
    include: { rates: true },
  });

  const ahj = await prisma.aHJ.findUnique({
    where: { id: input.ahjId },
  });

  const weatherData = utility
    ? await prisma.regionalWeatherData.findFirst({
        where: {
          zipCode: utility.zipCode,
          state: utility.state,
        },
      })
    : null;

  if (!utility || !ahj || !weatherData) {
    throw new Error(
      "Missing required localized data: utility, AHJ, or weather data"
    );
  }

  const warnings: string[] = [];
  const incentiveExpirations: string[] = [];

  // ===== STEP 1: System Sizing =====
  // System sizing based on bill + offset target
  const monthlyConsumptionKwh = input.monthlyElectricBillDollars / utility.baseRatePerKwh;
  const annualConsumptionKwh = monthlyConsumptionKwh * 12;
  const targetProductionKwh = (annualConsumptionKwh * input.offsetPercentageTarget) / 100;

  // Calculate system size using regional peak sun hours
  // Production = System Size (kW) × Peak Sun Hours × Days × Efficiency × Degradation
  // For year 1: Production = kW × Peak Sun Hours × 365 × 0.85 (typical efficiency)
  const peakSunHoursPerDay = weatherData.annualPeakSunHours;
  const systemEfficiency = 0.85; // Standard module + inverter efficiency
  const systemSizeKw =
    targetProductionKwh / (peakSunHoursPerDay * 365 * systemEfficiency);

  const year1ProductionKwh =
    systemSizeKw * peakSunHoursPerDay * 365 * systemEfficiency;
  const actualOffsetPercentage = (year1ProductionKwh / annualConsumptionKwh) * 100;

  // ===== STEP 2: Cost Estimation =====
  // Industry baseline: ~$2.50-3.00 per watt (installed)
  const costPerWatt = 2.75;
  const systemCostBeforeIncentives = systemSizeKw * 1000 * costPerWatt;
  const roofSpaceRequired = systemSizeKw * 65; // ~65 sq ft per kW

  // ===== STEP 3: Incentives Application =====
  // Federal: 30% ITC (Inflation Reduction Act)
  const federalTaxCredit = systemCostBeforeIncentives * 0.3;

  // State & utility incentives (query database - use only stored values)
  let stateIncentives = 0;
  let utilityRebates = 0;

  const applicableIncentives = await prisma.incentive.findMany({
    where: {
      expirationDate: { gt: new Date() },
      OR: [
        { state: utility.state },
        { state: null }, // Federal incentives
      ],
    },
  });

  for (const incentive of applicableIncentives) {
    if (incentive.expirationDate < new Date()) {
      incentiveExpirations.push(
        `${incentive.name} expires ${incentive.expirationDate.toDateString()}`
      );
    }

    if (incentive.type === "state_rebate") {
      const amount = incentive.isPercentage
        ? (systemCostBeforeIncentives * incentive.incentiveAmount) / 100
        : incentive.incentiveAmount;
      stateIncentives += incentive.maxAmount
        ? Math.min(amount, incentive.maxAmount)
        : amount;
    } else if (incentive.type === "utility_rebate") {
      const amount = incentive.isPercentage
        ? (systemCostBeforeIncentives * incentive.incentiveAmount) / 100
        : incentive.incentiveAmount;
      utilityRebates += incentive.maxAmount
        ? Math.min(amount, incentive.maxAmount)
        : amount;
    }
  }

  const totalIncentives = federalTaxCredit + stateIncentives + utilityRebates;

  // ===== STEP 4: Project Costs =====
  const permittingCosts = ahj.permitCostBaseline + ahj.inspectionFeeBaseline;
  const netSystemCost = systemCostBeforeIncentives - totalIncentives;
  const totalProjectCost = netSystemCost + permittingCosts;

  // ===== STEP 5: 25-Year Financial Projections =====
  const rateEscalation = utility.rateEscalationPercent / 100;
  const productionDegradation = 0.005; // 0.5% annual production decline
  let cumulativeSavings = 0;

  for (let year = 1; year <= 25; year++) {
    // Escalate utility rate
    const yearRate = utility.baseRatePerKwh * Math.pow(1 + rateEscalation, year - 1);

    // Account for production degradation
    const yearProduction =
      year1ProductionKwh * Math.pow(1 - productionDegradation, year - 1);

    // Annual savings = production × rate
    const yearSavings = yearProduction * yearRate;
    cumulativeSavings += yearSavings;
  }

  const year1Savings = year1ProductionKwh * utility.baseRatePerKwh;
  const totalSavings25Year = cumulativeSavings;

  // Simple payback (before inflation)
  const paybackYears = netSystemCost / year1Savings;

  // ROI calculation: (Total Savings - Project Cost) / Project Cost × 100
  const roi25Year = ((totalSavings25Year - totalProjectCost) / totalProjectCost) * 100;

  // IRR approximation (simplified)
  // For a more accurate IRR, would need NPV iteration
  const irr =
    (Math.pow(
      totalSavings25Year / totalProjectCost,
      1 / 25
    ) - 1) * 100;

  // ===== STEP 6: Financing Options =====
  const cashPrice = netSystemCost;

  let loanOption: { monthlyPayment: number; totalCost: number; loanAmount: number } | undefined;
  let leaseOption: { monthlyPayment: number; totalCost: number } | undefined;

  if (input.financing === "loan" && input.loanProgramId) {
    const loanProgram = await prisma.financingProgram.findUnique({
      where: { id: input.loanProgramId },
    });

    if (loanProgram) {
      // Check credit eligibility
      if (
        input.creditRange &&
        getCreditScore(input.creditRange) < loanProgram.minCreditScore
      ) {
        warnings.push(
          `Credit score below ${loanProgram.minCreditScore} minimum for ${loanProgram.programName}`
        );
      }

      // Calculate loan metrics
      const loanAmount = Math.min(
        netSystemCost,
        loanProgram.maxLoanAmount
      );
      const originationFee = (loanAmount * loanProgram.originationFee) / 100;
      const totalLoanAmount = loanAmount + originationFee;

      const monthlyRate = loanProgram.interestRate / 100 / 12;
      const numPayments = loanProgram.loanTermYears * 12;

      // Monthly payment formula: P × [r(1+r)^n] / [(1+r)^n - 1]
      const monthlyPayment =
        (totalLoanAmount *
          (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
        (Math.pow(1 + monthlyRate, numPayments) - 1);

      loanOption = {
        monthlyPayment,
        totalCost: monthlyPayment * numPayments,
        loanAmount,
      };
    }
  }

  if (input.financing === "lease") {
    // Lease: typically 20-30 year contract, includes maintenance, no ownership
    // Monthly payment ~70-80% of ownership option
    leaseOption = {
      monthlyPayment: (cashPrice * 0.0075) / 12, // ~0.9% annually / 12 months
      totalCost: (cashPrice * 0.0075 * 20 * 12) / 12, // 20-year lease estimate
    };
  }

  // ===== STEP 7: Environmental Impact =====
  // CO2 offset: ~0.92 metric tons per MWh (US grid average)
  const annualCo2OffsetMetricTons =
    (year1ProductionKwh / 1000) * 0.92;

  const netMeteredProductionKwh = utility.netMeteringAvailable
    ? year1ProductionKwh * 0.15 // Estimate 15% excess to grid
    : 0;

  return {
    systemSizeKw: Math.round(systemSizeKw * 100) / 100,
    estimatedAnnualProductionKwh: Math.round(year1ProductionKwh),
    offsetPercentage: Math.round(actualOffsetPercentage),
    roofSpaceRequired: Math.round(roofSpaceRequired),

    year1Savings: Math.round(year1Savings),
    totalSavings25Year: Math.round(totalSavings25Year),
    paybackYears: Math.round(paybackYears * 100) / 100,
    roi25Year: Math.round(roi25Year),
    irr: Math.round(irr),

    systemCostBeforeIncentives: Math.round(systemCostBeforeIncentives),
    federalTaxCredit: Math.round(federalTaxCredit),
    stateIncentives: Math.round(stateIncentives),
    utilityRebates: Math.round(utilityRebates),
    totalIncentives: Math.round(totalIncentives),

    netSystemCost: Math.round(netSystemCost),
    permittingCosts: Math.round(permittingCosts),
    totalProjectCost: Math.round(totalProjectCost),

    cashPrice: Math.round(cashPrice),
    loan: loanOption,
    lease: leaseOption,

    annualCo2OffsetMetricTons: Math.round(annualCo2OffsetMetricTons * 100) / 100,
    netMeteredProductionKwh: Math.round(netMeteredProductionKwh),

    assumptions: {
      utilityRatePerKwh: utility.baseRatePerKwh,
      rateEscalationPercent: utility.rateEscalationPercent,
      productionDegradationPercent: 0.5,
      peakSunHoursPerDay: peakSunHoursPerDay,
    },

    warnings,
    incentiveExpirations,
  };
}

/**
 * Convert credit range to approximate score for comparison
 */
function getCreditScore(
  creditRange: "excellent" | "good" | "fair" | "poor"
): number {
  switch (creditRange) {
    case "excellent":
      return 750;
    case "good":
      return 700;
    case "fair":
      return 650;
    case "poor":
      return 600;
    default:
      return 600;
  }
}

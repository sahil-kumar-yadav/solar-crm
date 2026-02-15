import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding SolarOS CRM database...");

  // Clean existing data
  await prisma.leadActivity.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.utilityRate.deleteMany();
  await prisma.utility.deleteMany();
  await prisma.incentive.deleteMany();
  await prisma.aHJ.deleteMany();
  await prisma.financingProgram.deleteMany();
  await prisma.territory.deleteMany();
  await prisma.salesTaxRate.deleteMany();
  await prisma.regionalWeatherData.deleteMany();

  // ===== UTILITIES =====
  const pgeCa = await prisma.utility.create({
    data: {
      name: "Pacific Gas & Electric",
      state: "CA",
      zipCode: "94000",
      baseRatePerKwh: 0.1850,
      rateEscalationPercent: 3.8,
      tieredRates: true,
      netMeteringAvailable: true,
      netMeteringCredit: 0.1850,
    },
  });

  const sceCa = await prisma.utility.create({
    data: {
      name: "Southern California Edison",
      state: "CA",
      zipCode: "90000",
      baseRatePerKwh: 0.1720,
      rateEscalationPercent: 3.2,
      tieredRates: true,
      netMeteringAvailable: true,
      netMeteringCredit: 0.1720,
    },
  });

  const ercotTx = await prisma.utility.create({
    data: {
      name: "ERCOT Texas",
      state: "TX",
      zipCode: "75000",
      baseRatePerKwh: 0.1200,
      rateEscalationPercent: 2.8,
      tieredRates: false,
      netMeteringAvailable: false,
      netMeteringCredit: 0,
    },
  });

  // ===== UTILITY RATES (Tiered for PG&E) =====
  await prisma.utilityRate.create({
    data: {
      utilityId: pgeCa.id,
      tierLevel: 1,
      maxKwhUsage: 300,
      ratePerKwh: 0.1720,
    },
  });

  await prisma.utilityRate.create({
    data: {
      utilityId: pgeCa.id,
      tierLevel: 2,
      maxKwhUsage: 600,
      ratePerKwh: 0.1950,
    },
  });

  await prisma.utilityRate.create({
    data: {
      utilityId: pgeCa.id,
      tierLevel: 3,
      maxKwhUsage: 999999,
      ratePerKwh: 0.2150,
    },
  });

  // ===== INCENTIVES =====
  const federalITC = await prisma.incentive.create({
    data: {
      type: "federal_tax_credit",
      name: "Federal Investment Tax Credit (ITC)",
      description: "30% federal tax credit on installed solar system cost (Inflation Reduction Act 2023)",
      state: null,
      incentiveAmount: 30,
      isPercentage: true,
      expirationDate: new Date("2033-12-31"),
    },
  });

  const caRebate = await prisma.incentive.create({
    data: {
      type: "state_rebate",
      name: "California Solar Initiative Rebate",
      description: "State rebate for residential solar installations",
      state: "CA",
      incentiveAmount: 1500,
      isPercentage: false,
      maxAmount: 2500,
      expirationDate: new Date("2026-12-31"),
    },
  });

  const pgeRebate = await prisma.incentive.create({
    data: {
      type: "utility_rebate",
      name: "PG&E Solar Rebate Program",
      description: "PG&E utility rebate for residential solar",
      state: "CA",
      zipCode: "94000",
      incentiveAmount: 1000,
      isPercentage: false,
      expirationDate: new Date("2027-06-30"),
    },
  });

  // ===== AHJ (Permit Authorities) =====
  const alamedaCo = await prisma.aHJ.create({
    data: {
      countyName: "Alameda",
      state: "CA",
      city: "Oakland",
      avgPermitDays: 14,
      avgInspectionWaitDays: 7,
      permitCostBaseline: 350,
      inspectionFeeBaseline: 200,
      requiresElectricalSealed: true,
    },
  });

  const losAngelesCo = await prisma.aHJ.create({
    data: {
      countyName: "Los Angeles",
      state: "CA",
      city: "Los Angeles",
      avgPermitDays: 21,
      avgInspectionWaitDays: 10,
      permitCostBaseline: 500,
      inspectionFeeBaseline: 300,
      requiresElectricalSealed: true,
    },
  });

  const harrisTx = await prisma.aHJ.create({
    data: {
      countyName: "Harris",
      state: "TX",
      city: "Houston",
      avgPermitDays: 10,
      avgInspectionWaitDays: 5,
      permitCostBaseline: 200,
      inspectionFeeBaseline: 150,
      requiresElectricalSealed: false,
    },
  });

  // ===== FINANCING PROGRAMS =====
  const sunloans = await prisma.financingProgram.create({
    data: {
      lenderName: "Sunloans",
      programName: "Standard Solar Loan",
      state: "CA",
      minCreditScore: 650,
      minLoanAmount: 5000,
      maxLoanAmount: 100000,
      interestRate: 7.99,
      loanTermYears: 25,
      originationFee: 1.5,
      canUseIncentives: true,
    },
  });

  const visidian = await prisma.financingProgram.create({
    data: {
      lenderName: "Visidian Credit Union",
      programName: "Green Energy Loan",
      state: "CA",
      minCreditScore: 700,
      minLoanAmount: 10000,
      maxLoanAmount: 150000,
      interestRate: 6.49,
      loanTermYears: 25,
      originationFee: 0.99,
      canUseIncentives: true,
    },
  });

  const easyfinance = await prisma.financingProgram.create({
    data: {
      lenderName: "EasyFinance",
      programName: "Solar Power Loan",
      state: "TX",
      minCreditScore: 620,
      minLoanAmount: 3000,
      maxLoanAmount: 80000,
      interestRate: 8.99,
      loanTermYears: 20,
      originationFee: 2.0,
      canUseIncentives: false,
    },
  });

  // ===== TERRITORIES =====
  const caTerritory = await prisma.territory.create({
    data: {
      name: "California North",
      state: "CA",
      zipCodes: "90000-96000",
      salesRepId: "rep-001",
    },
  });

  const txTerritory = await prisma.territory.create({
    data: {
      name: "Texas Central",
      state: "TX",
      zipCodes: "75000-79999",
      salesRepId: "rep-002",
    },
  });

  // ===== SALES TAX RATES =====
  await prisma.salesTaxRate.create({
    data: {
      state: "CA",
      taxRate: 0.0725,
    },
  });

  await prisma.salesTaxRate.create({
    data: {
      state: "TX",
      taxRate: 0.0625,
    },
  });

  // ===== REGIONAL WEATHER DATA =====
  const bayAreaWeather = await prisma.regionalWeatherData.create({
    data: {
      zipCode: "94000",
      state: "CA",
      annualPeakSunHours: 5.2,
      productionMultiplier: 0.95,
      weatherAdjustment: 1.0,
    },
  });

  const laWeather = await prisma.regionalWeatherData.create({
    data: {
      zipCode: "90000",
      state: "CA",
      annualPeakSunHours: 5.5,
      productionMultiplier: 1.02,
      weatherAdjustment: 1.0,
    },
  });

  const houstonWeather = await prisma.regionalWeatherData.create({
    data: {
      zipCode: "75000",
      state: "TX",
      annualPeakSunHours: 4.8,
      productionMultiplier: 0.92,
      weatherAdjustment: 1.0,
    },
  });

  console.log("✅ Database seeded successfully!");
  console.log("\n📊 Seeded data:");
  console.log(`  • 3 Utilities`);
  console.log(`  • 3 AHJ Authorities`);
  console.log(`  • 3 Financing Programs`);
  console.log(`  • 3 Incentive Programs`);
  console.log(`  • 2 Sales Territories`);
  console.log(`  • Regional weather data initialized`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

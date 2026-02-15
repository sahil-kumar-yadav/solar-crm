import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding SolarOS CRM database...");

  // ===== UTILITIES =====
  const pgeCa = await prisma.utility.create({
    data: {
      name: "Pacific Gas & Electric",
      state: "CA",
      zipCode: "94000",
      baseRatePerKwh: 0.185,
      rateEscalationPercent: 3.8,
      tieredRates: true,
      netMeteringAvailable: true,
      netMeteringCredit: 0.185,
    },
  });

  const ercotTx = await prisma.utility.create({
    data: {
      name: "ERCOT Texas",
      state: "TX",
      zipCode: "75000",
      baseRatePerKwh: 0.12,
      rateEscalationPercent: 2.8,
      tieredRates: false,
      netMeteringAvailable: false,
      netMeteringCredit: 0,
    },
  });

  // ===== AHJ (Permit Authorities) =====
  await prisma.aHJ.create({
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

  // ===== INCENTIVES =====
  await prisma.incentive.create({
    data: {
      type: "federal_tax_credit",
      name: "Federal ITC 30%",
      description: "30% federal tax credit",
      state: null,
      incentiveAmount: 30,
      isPercentage: true,
      expirationDate: new Date("2033-12-31"),
    },
  });

  // ===== FINANCING PROGRAMS =====
  await prisma.financingProgram.create({
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

  // ===== TERRITORIES =====
  await prisma.territory.create({
    data: {
      name: "California North",
      state: "CA",
      zipCodes: "90000-96000",
      salesRepId: "rep-001",
    },
  });

  // ===== REGIONAL WEATHER DATA =====
  await prisma.regionalWeatherData.create({
    data: {
      zipCode: "94000",
      state: "CA",
      annualPeakSunHours: 5.2,
      productionMultiplier: 0.95,
      weatherAdjustment: 1.0,
    },
  });

  console.log("✅ Database seeded!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

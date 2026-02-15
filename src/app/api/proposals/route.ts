import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { calculateProposal } from "@/lib/engines/proposalCalculator";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

/**
 * POST /api/proposals/generate
 * Generate solar proposal for a lead using deterministic calculator
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate inputs
    if (!body.leadId || !body.utilityId || !body.ahjId) {
      return NextResponse.json(
        { error: "Missing leadId, utilityId, or ahjId" },
        { status: 400 }
      );
    }

    const offsetPercentage = body.offsetPercentageTarget || 100;
    const financing = body.financing || "cash";

    // Fetch lead for context
    const lead = await prisma.lead.findUnique({
      where: { id: body.leadId },
      include: { utility: true, ahj: true },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Run proposal calculator engine
    const proposal = await calculateProposal({
      monthlyElectricBillDollars: lead.monthlyElectricBill,
      utilityId: body.utilityId,
      ahjId: body.ahjId,
      offsetPercentageTarget: offsetPercentage,
      creditRange: lead.creditRange as any,
      financing: financing as any,
      loanProgramId: body.loanProgramId,
    });

    // Create proposal in database
    const proposalNumber = `PROP-${Date.now()}-${uuidv4().slice(0, 6).toUpperCase()}`;

    const createdProposal = await prisma.proposal.create({
      data: {
        leadId: lead.id,
        proposalNumber,
        systemSizeKw: proposal.systemSizeKw,
        estimatedAnnualProduction: proposal.estimatedAnnualProductionKwh,
        offsetPercentage: proposal.offsetPercentage,
        monthlyConsumptionKwh: lead.monthlyElectricBill / (lead.utility?.baseRatePerKwh || 0.12),
        roofConditionApproved: body.roofConditionApproved || false,

        projectedAnnualSavings: proposal.year1Savings,
        projectedTotalSavings: proposal.totalSavings25Year,
        roiPercent: proposal.roi25Year,
        paybackYears: proposal.paybackYears,
        irr: proposal.irr,

        cashPrice: proposal.cashPrice,
        loanAmount: proposal.loan?.loanAmount,
        loanMonthlyPayment: proposal.loan?.monthlyPayment,
        loanTotalCost: proposal.loan?.totalCost,
        leaseMonthlyPayment: proposal.lease?.monthlyPayment,
        leaseAvailable: financing === "lease",

        federalTaxCredit: proposal.federalTaxCredit,
        stateIncentives: proposal.stateIncentives,
        utilityRebates: proposal.utilityRebates,
        incentiveIds: JSON.stringify([]), // Would populate with actual incentive IDs
        totalIncentives: proposal.totalIncentives,

        annualCo2Offset: proposal.annualCo2OffsetMetricTons,
        netMeteredProduction: proposal.netMeteredProductionKwh,

        utilityRateEscalation: proposal.assumptions.utilityRateEscalation,
        productionDegradation: proposal.assumptions.productionDegradationPercent,
        assumptions: JSON.stringify(proposal.assumptions),

        status: "draft",
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Update lead status
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: "proposed",
        nextAction: "review_proposal",
      },
    });

    // Log activity
    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        type: "proposal_sent",
        notes: `Proposal ${proposalNumber} generated: ${proposal.systemSizeKw}kW system, ${proposal.paybackYears} year payback`,
      },
    });

    return NextResponse.json(
      {
        success: true,
        proposal: {
          id: createdProposal.id,
          proposalNumber: createdProposal.proposalNumber,
          systemSize: `${proposal.systemSizeKw} kW`,
          annualProduction: `${proposal.estimatedAnnualProductionKwh.toLocaleString()} kWh`,
          offsetPercentage: `${proposal.offsetPercentage}%`,

          financials: {
            year1Savings: `$${proposal.year1Savings.toLocaleString()}`,
            totalSavings25Years: `$${proposal.totalSavings25Year.toLocaleString()}`,
            paybackPeriod: `${proposal.paybackYears} years`,
            roi: `${proposal.roi25Year}%`,
            irr: `${proposal.irr}%`,
          },

          pricing: {
            systemCost: `$${proposal.systemCostBeforeIncentives.toLocaleString()}`,
            federalTaxCredit: `$${proposal.federalTaxCredit.toLocaleString()}`,
            stateIncentives: `$${proposal.stateIncentives.toLocaleString()}`,
            utilityRebates: `$${proposal.utilityRebates.toLocaleString()}`,
            totalIncentives: `$${proposal.totalIncentives.toLocaleString()}`,
            netCost: `$${proposal.netSystemCost.toLocaleString()}`,
            permittingCosts: `$${proposal.permittingCosts.toLocaleString()}`,
            totalProjectCost: `$${proposal.totalProjectCost.toLocaleString()}`,
          },

          financingOptions: {
            cash: `$${proposal.cashPrice.toLocaleString()}`,
            loan: proposal.loan
              ? `$${proposal.loan.monthlyPayment.toFixed(2)}/month`
              : null,
            lease: proposal.lease
              ? `$${proposal.lease.monthlyPayment.toFixed(2)}/month`
              : null,
          },

          environmental: {
            annualCo2Offset: `${proposal.annualCo2OffsetMetricTons} metric tons/year`,
            netMeteredProduction: `${proposal.netMeteredProductionKwh.toLocaleString()} kWh/year`,
          },

          assumptions: proposal.assumptions,
          warnings: proposal.warnings,
          incentiveExpirations: proposal.incentiveExpirations,

          expiresAt: createdProposal.expirationDate,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Proposal generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate proposal" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/proposals/:proposalId
 * Retrieve a proposal
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const proposalId = url.pathname.split("/").pop();

    if (!proposalId) {
      return NextResponse.json(
        { error: "Proposal ID required" },
        { status: 400 }
      );
    }

    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        lead: true,
        loanProgram: true,
      },
    });

    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      proposal,
    });
  } catch (error) {
    console.error("Proposal retrieval error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve proposal" },
      { status: 500 }
    );
  }
}

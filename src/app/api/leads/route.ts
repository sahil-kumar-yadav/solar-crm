import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
  scoreLeadByRules,
  LeadScoringInput,
  getRebuttals,
} from "@/lib/engines/leadScoringEngine";

const prisma = new PrismaClient();

/**
 * POST /api/leads/create
 * Create a new lead with automatic scoring and next action assignment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const required = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "address",
      "zipCode",
      "state",
      "monthlyElectricBill",
      "propertyType",
      "utilityId",
    ];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Verify utility and AHJ exist
    const utility = await prisma.utility.findUnique({
      where: { id: body.utilityId },
    });

    if (!utility) {
      return NextResponse.json(
        { error: "Invalid utility ID" },
        { status: 400 }
      );
    }

    // Find matching AHJ
    const ahj = await prisma.aHJ.findFirst({
      where: {
        state: body.state,
        city: body.city || undefined,
      },
    });

    // Find territory assignment
    const territory = await prisma.territory.findFirst({
      where: {
        state: body.state,
      },
    });

    // Run lead scoring engine
    const scoringInput: LeadScoringInput = {
      monthlyElectricBill: body.monthlyElectricBill,
      homeOwner: body.homeOwner || false,
      propertyType: body.propertyType,
      financingReady: body.financing || "unknown",
      appointmentScheduled: body.appointmentScheduled || false,
      engagementActivity: 0, // New lead
      creditRange: body.creditRange,
    };

    const scoring = scoreLeadByRules(scoringInput);
    const rebuttals = getRebuttals(scoring.objectionFlags);

    // Create lead
    const lead = await prisma.lead.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        address: body.address,
        zipCode: body.zipCode,
        state: body.state,
        propertyType: body.propertyType,
        homeOwner: body.homeOwner || false,
        monthlyElectricBill: body.monthlyElectricBill,
        utilityId: body.utilityId,
        ahjId: ahj?.id,
        territoryId: territory?.id,
        roofType: body.roofType || "unknown",
        roofAgeYears: body.roofAgeYears,
        creditRange: body.creditRange,
        score: scoring.score,
        financing: body.financing || "unknown",
        nextAction: scoring.nextAction,
        objections: JSON.stringify(rebuttals),
        engagementNotes: body.notes,
        status: "new",
      },
      include: {
        utility: true,
        ahj: true,
        territory: true,
      },
    });

    // Log creation activity
    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        type: "email",
        notes: `Lead created: ${scoring.score} (${scoring.reason})`,
      },
    });

    return NextResponse.json(
      {
        success: true,
        lead: {
          id: lead.id,
          name: `${lead.firstName} ${lead.lastName}`,
          email: lead.email,
          score: lead.score,
          nextAction: lead.nextAction,
          estimatedMonthlyBill: lead.monthlyElectricBill,
          territory: lead.territory?.name,
          ahj: lead.ahj?.countyName,
          scoring: {
            reason: scoring.reason,
            objections: Object.keys(rebuttals),
            rebuttals: rebuttals,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Lead creation error:", error);
    return NextResponse.json(
      { error: "Failed to create lead" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/leads?zipCode=&state=
 * List leads with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const score = searchParams.get("score");
    const state = searchParams.get("state");
    const status = searchParams.get("status");

    const leads = await prisma.lead.findMany({
      where: {
        ...(score && { score: score as "hot" | "warm" | "cold" }),
        ...(state && { state }),
        ...(status && { status }),
      },
      include: {
        utility: true,
        territory: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      count: leads.length,
      leads: leads.map((lead) => ({
        id: lead.id,
        name: `${lead.firstName} ${lead.lastName}`,
        email: lead.email,
        phone: lead.phone,
        score: lead.score,
        status: lead.status,
        monthlyBill: lead.monthlyElectricBill,
        territory: lead.territory?.name,
        nextAction: lead.nextAction,
        createdAt: lead.createdAt,
      })),
    });
  } catch (error) {
    console.error("Lead list error:", error);
    return NextResponse.json(
      { error: "Failed to list leads" },
      { status: 500 }
    );
  }
}

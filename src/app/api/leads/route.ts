import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismaClient";
import { z } from "zod";
import {
  scoreLeadByRules,
  LeadScoringInput,
  getRebuttals,
} from "@/lib/engines/leadScoringEngine";

const LeadCreateSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(7),
  address: z.string().min(1),
  city: z.string().optional(),
  zipCode: z.string().min(3),
  state: z.string().min(2),
  monthlyElectricBill: z.number().nonnegative(),
  propertyType: z.enum(["residential", "commercial", "non-profit"]),
  utilityId: z.string(),
  homeOwner: z.boolean().optional(),
  roofType: z.string().optional(),
  roofAgeYears: z.number().optional(),
  creditRange: z.string().optional(),
  financing: z.enum(["cash", "loan", "lease", "unknown"]).optional(),
  appointmentScheduled: z.boolean().optional(),
  notes: z.string().optional(),
});

/**
 * POST /api/leads/create
 * Create a new lead with automatic scoring and next action assignment
 */
export async function POST(request: NextRequest) {
  try {
    // Optional API key enforcement
    const API_KEY = process.env.API_KEY;
    if (API_KEY) {
      const provided = request.headers.get("x-api-key") || "";
      if (provided !== API_KEY) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await request.json();
    const parsed = LeadCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;

    // Verify utility exists
    const utility = await prisma.utility.findUnique({ where: { id: data.utilityId } });
    if (!utility) {
      return NextResponse.json({ error: "Invalid utility ID" }, { status: 400 });
    }

    // Find matching AHJ and territory
    const ahj = await prisma.aHJ.findFirst({ where: { state: data.state, city: data.city || undefined } });
    const territory = await prisma.territory.findFirst({ where: { state: data.state } });

    // Run lead scoring engine
    const scoringInput: LeadScoringInput = {
      monthlyElectricBill: data.monthlyElectricBill,
      homeOwner: data.homeOwner || false,
      propertyType: data.propertyType,
      financingReady: data.financing || "unknown",
      appointmentScheduled: data.appointmentScheduled || false,
      engagementActivity: 0,
      creditRange: data.creditRange,
    };

    const scoring = scoreLeadByRules(scoringInput);
    const rebuttals = getRebuttals(scoring.objectionFlags);

    // Create lead
    const lead = await prisma.lead.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        zipCode: data.zipCode,
        state: data.state,
        propertyType: data.propertyType,
        homeOwner: data.homeOwner || false,
        monthlyElectricBill: data.monthlyElectricBill,
        utilityId: data.utilityId,
        ahjId: ahj?.id,
        territoryId: territory?.id,
        roofType: data.roofType || "unknown",
        roofAgeYears: data.roofAgeYears,
        creditRange: data.creditRange,
        score: scoring.score,
        financing: data.financing || "unknown",
        nextAction: scoring.nextAction,
        objections: JSON.stringify(rebuttals),
        engagementNotes: data.notes,
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
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }
}

/**
 * GET /api/leads?zipCode=&state=
 * List leads with filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Optional API key enforcement
    const API_KEY = process.env.API_KEY;
    if (API_KEY) {
      const provided = request.headers.get("x-api-key") || "";
      if (provided !== API_KEY) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
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

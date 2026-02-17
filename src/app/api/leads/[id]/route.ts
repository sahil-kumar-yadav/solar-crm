import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismaClient";
import { z } from "zod";

const LeadUpdateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(7).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  state: z.string().optional(),
  monthlyElectricBill: z.number().nonnegative().optional(),
  propertyType: z.enum(["residential", "commercial", "non-profit"]).optional(),
  homeOwner: z.boolean().optional(),
  roofType: z.string().optional(),
  roofAgeYears: z.number().optional(),
  creditRange: z.string().optional(),
  financing: z.enum(["cash", "loan", "lease", "unknown"]).optional(),
  appointmentScheduled: z.boolean().optional(),
  notes: z.string().optional(),
  status: z.string().optional(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: { utility: true, ahj: true, territory: true },
    });
    if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch lead" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await request.json();
    const parsed = LeadUpdateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });

    const updated = await prisma.lead.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ success: true, lead: updated });
  } catch (error: any) {
    console.error(error);
    if (error.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    await prisma.lead.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    if (error.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 });
  }
}

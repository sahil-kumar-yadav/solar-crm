/**
 * SolarOS Lead Scoring Engine
 * Rule-based deterministic lead qualification
 */

export type LeadScore = "hot" | "warm" | "cold";

export interface LeadScoringInput {
  monthlyElectricBill: number; // $ amount
  homeOwner: boolean;
  propertyType: "residential" | "commercial" | "non-profit";
  financingReady: "cash" | "loan" | "lease" | "unknown";
  appointmentScheduled: boolean;
  engagementActivity: number; // count of recent activities (calls, emails, etc.)
  creditRange?: "excellent" | "good" | "fair" | "poor";
}

export interface ScoringOutput {
  score: LeadScore;
  reason: string;
  nextAction: string;
  objectionFlags: string[];
}

/**
 * Deterministic lead scoring based on rule hierarchy
 * Rules are applied in priority order
 */
export function scoreLeadByRules(input: LeadScoringInput): ScoringOutput {
  let scorePoints = 0;
  const objectionFlags: string[] = [];

  // Rule 1: Monthly bill amount (primary demand indicator)
  // Solar is economical starting ~$80-100/month
  if (input.monthlyElectricBill >= 200) {
    scorePoints += 40; // High consumption = strong ROI
  } else if (input.monthlyElectricBill >= 120) {
    scorePoints += 30;
  } else if (input.monthlyElectricBill >= 80) {
    scorePoints += 15;
  } else {
    scorePoints -= 20; // Low consumption = low ROI
    objectionFlags.push("low_consumption_low_roi");
  }

  // Rule 2: Home ownership
  if (input.homeOwner) {
    scorePoints += 20; // Homeowners = decision makers
  } else {
    scorePoints -= 30; // Renters = typically disqualified
    objectionFlags.push("renter_no_ownership");
  }

  // Rule 3: Property type
  if (input.propertyType === "residential") {
    scorePoints += 15;
  } else if (input.propertyType === "commercial") {
    scorePoints += 10;
  } else {
    scorePoints += 25; // Non-profit = special incentives
  }

  // Rule 4: Financing readiness
  if (input.financingReady === "cash") {
    scorePoints += 25; // Cash = fastest close
  } else if (input.financingReady === "loan") {
    scorePoints += 20;
  } else if (input.financingReady === "lease") {
    scorePoints += 10;
  } else {
    scorePoints -= 15; // Unknown = risk
    objectionFlags.push("financing_status_unknown");
  }

  // Rule 5: Credit score impact (if financing)
  if (
    input.financingReady !== "cash" &&
    input.creditRange &&
    input.creditRange !== "excellent" &&
    input.creditRange !== "good"
  ) {
    scorePoints -= 20;
    objectionFlags.push("credit_score_concern");
  }

  // Rule 6: Appointment scheduled (intent indicator)
  if (input.appointmentScheduled) {
    scorePoints += 20;
  } else {
    scorePoints -= 10;
  }

  // Rule 7: Engagement activity (sales velocity)
  if (input.engagementActivity >= 5) {
    scorePoints += 15; // High engagement = qualified
  } else if (input.engagementActivity >= 2) {
    scorePoints += 5;
  } else {
    scorePoints -= 10;
  }

  // Score classification (deterministic)
  let score: LeadScore;
  let nextAction: string;

  if (scorePoints >= 80) {
    score = "hot";
    nextAction = "schedule_site_survey";
  } else if (scorePoints >= 40) {
    score = "warm";
    nextAction = "send_proposal_request";
  } else {
    score = "cold";
    nextAction = "nurture_campaign";
  }

  // Generate reason summary
  const reason = generateScoringReason(input, scorePoints);

  return {
    score,
    reason,
    nextAction,
    objectionFlags,
  };
}

/**
 * Generate human-readable reason for lead score
 */
function generateScoringReason(input: LeadScoringInput, points: number): string {
  const reasons: string[] = [];

  if (input.monthlyElectricBill >= 200) {
    reasons.push("High electricity consumption ($200+/mo)");
  } else if (input.monthlyElectricBill < 80) {
    reasons.push("Low electricity consumption - limited ROI");
  }

  if (input.homeOwner) {
    reasons.push("Homeowner (decision maker)");
  }

  if (input.financingReady === "cash") {
    reasons.push("Cash buyer (fast close potential)");
  }

  if (input.appointmentScheduled) {
    reasons.push("Appointment already scheduled");
  }

  if (input.engagementActivity >= 5) {
    reasons.push(`High engagement (${input.engagementActivity} activities)`);
  }

  return reasons.join(" • ");
}

/**
 * Get next best action based on lead score
 */
export function getNextAction(score: LeadScore): string {
  switch (score) {
    case "hot":
      return "schedule_site_survey";
    case "warm":
      return "send_proposal_request";
    case "cold":
      return "nurture_campaign";
    default:
      return "follow_up";
  }
}

/**
 * Get predefined rebuttal script for common objections
 */
export function getRebuttals(objectionFlags: string[]): Record<string, string> {
  const rebuttals: Record<string, string> = {
    low_consumption_low_roi:
      "Solar still provides 15-20 year payback even at lower consumption. Combined with battery backup for outage protection, the value extends beyond just savings.",
    renter_no_ownership:
      "We specialize in community solar programs for renters. Let's explore alternatives that work for your situation.",
    financing_status_unknown:
      "We work with multiple lenders. Let's discuss your financing comfort level and I'll identify the best programs for you.",
    credit_score_concern:
      "Credit score is just one factor. We have programs for fair credit ranges. Let's review your options.",
  };

  const flagRebuttals: Record<string, string> = {};
  for (const flag of objectionFlags) {
    if (rebuttals[flag]) {
      flagRebuttals[flag] = rebuttals[flag];
    }
  }

  return flagRebuttals;
}

// Verification scoring engine.
// 6 binary checks → trust score 0-110 → status bucket.

export interface VerificationChecks {
  ninVerified: boolean;     // +25
  nameMatch: boolean;       // +20
  statementValid: boolean;  // +20
  screenshotMatch: boolean; // +15
  receiptMatch: boolean;    // +15
  txnRefValid: boolean;     // +15
}

export const CHECK_WEIGHTS: Record<keyof VerificationChecks, number> = {
  ninVerified: 25,
  nameMatch: 20,
  statementValid: 20,
  screenshotMatch: 15,
  receiptMatch: 15,
  txnRefValid: 15,
};

export const CHECK_LABELS: Record<keyof VerificationChecks, string> = {
  ninVerified: "NIN verified",
  nameMatch: "Name matches payroll",
  statementValid: "Bank statement valid",
  screenshotMatch: "Screenshot OCR matched",
  receiptMatch: "Receipt OCR matched",
  txnRefValid: "Transaction reference valid",
};

export const MAX_SCORE = 110;

export type VerificationStatus = "pending" | "verified" | "flagged" | "rejected";

export function calcScore(c: VerificationChecks): number {
  return (Object.keys(CHECK_WEIGHTS) as (keyof VerificationChecks)[]).reduce(
    (sum, k) => sum + (c[k] ? CHECK_WEIGHTS[k] : 0),
    0,
  );
}

export function statusFromScore(score: number, hasSubmitted = true): VerificationStatus {
  if (!hasSubmitted) return "pending";
  if (score >= 80) return "verified";
  if (score >= 50) return "flagged";
  return "rejected";
}

export const STATUS_META: Record<
  VerificationStatus,
  { label: string; color: string; bg: string; description: string }
> = {
  pending: {
    label: "Pending",
    color: "var(--status-pending)",
    bg: "color-mix(in oklab, var(--status-pending) 14%, transparent)",
    description: "Awaiting document submission.",
  },
  verified: {
    label: "Verified",
    color: "var(--status-verified)",
    bg: "color-mix(in oklab, var(--status-verified) 14%, transparent)",
    description: "Cleared for Squad disbursement.",
  },
  flagged: {
    label: "Flagged",
    color: "var(--status-flagged)",
    bg: "color-mix(in oklab, var(--status-flagged) 14%, transparent)",
    description: "Manual auditor review required.",
  },
  rejected: {
    label: "Rejected",
    color: "var(--status-rejected)",
    bg: "color-mix(in oklab, var(--status-rejected) 14%, transparent)",
    description: "Payment blocked. Worker must request appeal.",
  },
};

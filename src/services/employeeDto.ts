import type { Employee, FlagReason, SquadStatus } from "@/lib/mockData";
import type { VerificationChecks, VerificationStatus } from "@/lib/scoring";
import { normalizeVerificationStatus, trustScoreFromStatus } from "@/lib/scoring";

const emptyChecks: VerificationChecks = {
  ninVerified: false,
  nameMatch: false,
  statementValid: false,
  screenshotMatch: false,
  receiptMatch: false,
  txnRefValid: false,
};

function squadFromVerification(v: VerificationStatus): SquadStatus {
  if (v === "verified") return "RELEASED";
  if (v === "rejected") return "BLOCKED";
  return "HELD";
}

/**
 * Normalizes REST / DB row shapes into the UI `Employee` model.
 * `verification_status` from the backend is the source of truth for the trust bucket.
 */
export function employeeFromApiDto(raw: unknown): Employee | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const d = raw as Record<string, unknown>;
  const id = String(d.id ?? d.employee_id ?? "");
  if (!id) return undefined;

  const verificationStatus = normalizeVerificationStatus(
    (d.verification_status ?? d.verificationStatus) as string | undefined,
  );
  const apiScore = (d.trust_score ?? d.trustScore) as number | null | undefined;
  const trustScore = trustScoreFromStatus(verificationStatus, apiScore);

  const checksRaw = d.checks as VerificationChecks | undefined;
  const checks: VerificationChecks = checksRaw ? { ...emptyChecks, ...checksRaw } : { ...emptyChecks };

  const flagReason = (d.flag_reason ?? d.flagReason ?? "Clean") as FlagReason;

  return {
    id,
    name: String(d.name ?? "Worker"),
    nin: String(d.nin ?? ""),
    bvn: String(d.bvn ?? ""),
    department: String(d.department ?? "—"),
    salary: Number(d.salary ?? 0),
    account: String(d.account ?? d.account_number ?? ""),
    riskScore: Math.round(((110 - trustScore) / 110) * 100),
    flagReason,
    squadStatus: squadFromVerification(verificationStatus),
    override: Boolean(d.override),
    evidence: Array.isArray(d.evidence) ? (d.evidence as string[]) : [],
    accountAgeDays: Number(d.account_age_days ?? d.accountAgeDays ?? 0),
    prevSalary: Number(d.prev_salary ?? d.prevSalary ?? 0),
    checks,
    trustScore,
    verificationStatus,
    hasSubmittedDocs: Boolean(d.has_submitted_docs ?? d.hasSubmittedDocs),
  };
}

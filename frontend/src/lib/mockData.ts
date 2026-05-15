// Deterministic mock dataset for the Smart Decision Ledger.
import {
  calcScore,
  statusFromScore,
  type VerificationChecks,
  type VerificationStatus,
} from "./scoring";

export type FlagReason =
  | "Clean"
  | "Shared Account"
  | "Payday Pop-up"
  | "Ghost Jump"
  | "Velocity Flag";

export type SquadStatus = "RELEASED" | "HELD" | "BLOCKED";

export interface Employee {
  id: string;
  name: string;
  nin: string;
  bvn: string;
  department: string;
  salary: number;
  account: string;
  // legacy risk metrics (kept for existing UI)
  riskScore: number;
  flagReason: FlagReason;
  squadStatus: SquadStatus;
  override: boolean;
  evidence: string[];
  accountAgeDays: number;
  prevSalary: number;
  // new verification engine
  checks: VerificationChecks;
  trustScore: number;
  verificationStatus: VerificationStatus;
  hasSubmittedDocs: boolean;
}

const FIRST = ["Adaeze","Chinedu","Tunde","Ifeoma","Bola","Kemi","Sade","Emeka","Yusuf","Aisha","Folake","Obinna","Hauwa","Segun","Ngozi","Musa","Tope","Ebere","Ahmed","Ronke","Femi","Halima","Chukwu","Bisi","Idris","Nneka","Lekan","Zainab","Uche","Damilola"];
const LAST = ["Okafor","Adeyemi","Ibrahim","Eze","Bello","Adekunle","Mohammed","Nwosu","Ogundimu","Lawal","Okonkwo","Hassan","Adebayo","Yakubu","Onyeka","Sani","Okeke","Garba"];
const DEPTS = ["Education","Health","Works","Finance","Agriculture","Transport","Justice","Secretariat"];

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function squadFromStatus(v: VerificationStatus): SquadStatus {
  if (v === "verified") return "RELEASED";
  if (v === "rejected") return "BLOCKED";
  return "HELD";
}

export function generateEmployees(count = 220): Employee[] {
  const rnd = mulberry32(42);
  const list: Employee[] = [];
  const sharedAccount = "0123456789";

  for (let i = 0; i < count; i++) {
    const fi = Math.floor(rnd() * FIRST.length);
    const li = Math.floor(rnd() * LAST.length);
    const name = `${FIRST[fi]} ${LAST[li]}`;
    const dept = DEPTS[Math.floor(rnd() * DEPTS.length)];
    const salary = Math.round((80_000 + rnd() * 520_000) / 1000) * 1000;

    let flag: FlagReason = "Clean";
    let evidence: string[] = [];
    let account = String(1000000000 + Math.floor(rnd() * 8_999_999_999));
    let accountAgeDays = 30 + Math.floor(rnd() * 1500);
    let prevSalary = salary;

    // Default to a "good" worker
    let checks: VerificationChecks = {
      ninVerified: true,
      nameMatch: true,
      statementValid: true,
      screenshotMatch: true,
      receiptMatch: true,
      txnRefValid: true,
    };
    let hasSubmittedDocs = true;

    const r = rnd();
    if (i < 4) {
      // Shared Account ring → rejected
      flag = "Shared Account";
      account = sharedAccount;
      checks = { ninVerified: false, nameMatch: false, statementValid: true, screenshotMatch: false, receiptMatch: false, txnRefValid: false };
      evidence = [
        `Account ${sharedAccount} linked to 4 distinct employee records`,
        `TX-IDs: TX-${1000 + i}, TX-${2000 + i}`,
        "Bank statement names do not match payroll roster",
      ];
    } else if (r < 0.06) {
      flag = "Payday Pop-up";
      accountAgeDays = Math.floor(rnd() * 2);
      checks = { ninVerified: true, nameMatch: false, statementValid: false, screenshotMatch: false, receiptMatch: true, txnRefValid: false };
      evidence = [
        `Account opened ${accountAgeDays * 24}h before payroll cycle`,
        "No prior transaction history on bank statement",
        "Single inbound transfer expected (salary)",
      ];
    } else if (r < 0.12) {
      flag = "Ghost Jump";
      prevSalary = Math.round(salary * (0.5 + rnd() * 0.2));
      const jump = ((salary - prevSalary) / prevSalary) * 100;
      // Score in flagged band (50-79): drop name + screenshot + receipt
      checks = { ninVerified: true, nameMatch: true, statementValid: true, screenshotMatch: false, receiptMatch: false, txnRefValid: false };
      evidence = [
        `Salary increased ${jump.toFixed(1)}% in one cycle`,
        "No promotion record found in HR ledger",
        `Previous: ₦${prevSalary.toLocaleString()} → Current: ₦${salary.toLocaleString()}`,
      ];
    } else if (r < 0.18) {
      flag = "Velocity Flag";
      checks = { ninVerified: true, nameMatch: true, statementValid: true, screenshotMatch: true, receiptMatch: false, txnRefValid: false };
      evidence = [
        "Duplicate payment detected within current cycle",
        `TX-IDs: TX-${5000 + i}-A, TX-${5000 + i}-B`,
        "Same beneficiary, same amount, < 24h apart",
      ];
    } else if (r < 0.26) {
      // Pending — has not submitted docs yet
      checks = { ninVerified: true, nameMatch: true, statementValid: false, screenshotMatch: false, receiptMatch: false, txnRefValid: false };
      hasSubmittedDocs = false;
    }

    const trustScore = calcScore(checks);
    const verificationStatus = statusFromScore(trustScore, hasSubmittedDocs);
    const squadStatus = squadFromStatus(verificationStatus);
    // Map trust → legacy riskScore (inverse-ish, for old visualizations)
    const riskScore = Math.round(((110 - trustScore) / 110) * 100);

    list.push({
      id: `EMP-${String(10000 + i)}`,
      name,
      nin: `${10000000000 + Math.floor(rnd() * 89999999999)}`.slice(0, 11),
      bvn: `2${Math.floor(rnd() * 10_000_000_000)}`.slice(0, 11),
      department: dept,
      salary,
      account,
      riskScore,
      flagReason: flag,
      squadStatus,
      override: false,
      evidence,
      accountAgeDays,
      prevSalary,
      checks,
      trustScore,
      verificationStatus,
      hasSubmittedDocs,
    });
  }
  return list;
}

export const RED_FLAGS: { name: FlagReason; description: string }[] = [
  { name: "Shared Account", description: "Multiple employees linked to one bank account." },
  { name: "Payday Pop-up", description: "Account opened less than 48 hours before payroll." },
  { name: "Ghost Jump", description: "Salary increase greater than 20% with no promotion record." },
  { name: "Velocity Flag", description: "Duplicate payment to the same beneficiary in one cycle." },
];

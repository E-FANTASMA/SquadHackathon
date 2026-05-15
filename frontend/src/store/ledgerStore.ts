import { create } from "zustand";
import { generateEmployees, type Employee, type SquadStatus } from "@/lib/mockData";
import {
  calcScore,
  statusFromScore,
  type VerificationChecks,
  type VerificationStatus,
} from "@/lib/scoring";

function squadFromStatus(v: VerificationStatus): SquadStatus {
  if (v === "verified") return "RELEASED";
  if (v === "rejected") return "BLOCKED";
  return "HELD";
}

interface LedgerState {
  employees: Employee[];
  setOverride: (id: string, value: boolean) => void;
  setStatus: (id: string, status: SquadStatus) => void;
  updateChecks: (id: string, checks: VerificationChecks) => void;
  /** Worker submitted documents — re-derive score from checks. */
  submitDocs: (id: string, checks: VerificationChecks) => Employee | undefined;
  findByNinAndAccount: (nin: string, account: string) => Employee | undefined;
  executeVerifiedPayments: () => number;
}

function recompute(e: Employee, checks: VerificationChecks, hasSubmitted = true): Employee {
  const trustScore = calcScore(checks);
  const verificationStatus = statusFromScore(trustScore, hasSubmitted);
  const squadStatus = squadFromStatus(verificationStatus);
  const riskScore = Math.round(((110 - trustScore) / 110) * 100);
  return { ...e, checks, trustScore, verificationStatus, squadStatus, riskScore, hasSubmittedDocs: hasSubmitted };
}

export const useLedgerStore = create<LedgerState>((set, get) => ({
  employees: generateEmployees(220),
  setOverride: (id, value) =>
    set((s) => ({
      employees: s.employees.map((e) => {
        if (e.id !== id) return e;
        // Manual override forces verified
        if (value) {
          return { ...e, override: true, verificationStatus: "verified", squadStatus: "RELEASED" };
        }
        // Revert to score-derived status
        return recompute({ ...e, override: false }, e.checks, e.hasSubmittedDocs);
      }),
    })),
  setStatus: (id, status) =>
    set((s) => ({
      employees: s.employees.map((e) => (e.id === id ? { ...e, squadStatus: status } : e)),
    })),
  updateChecks: (id, checks) =>
    set((s) => ({
      employees: s.employees.map((e) => (e.id === id ? recompute(e, checks, true) : e)),
    })),
  submitDocs: (id, checks) => {
    let updated: Employee | undefined;
    set((s) => ({
      employees: s.employees.map((e) => {
        if (e.id !== id) return e;
        updated = recompute(e, checks, true);
        return updated;
      }),
    }));
    return updated;
  },
  findByNinAndAccount: (nin, account) =>
    get().employees.find((e) => e.nin === nin && e.account === account),
  executeVerifiedPayments: () => {
    const cleared = get().employees.filter(
      (e) => e.verificationStatus === "verified" || e.override,
    );
    set((s) => ({
      employees: s.employees.map((e) =>
        e.verificationStatus === "verified" || e.override
          ? { ...e, squadStatus: "RELEASED" as SquadStatus }
          : e,
      ),
    }));
    return cleared.length;
  },
}));

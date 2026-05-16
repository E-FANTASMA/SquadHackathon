import { create } from "zustand";
import { type Employee, type SquadStatus } from "@/lib/mockData";
import {
  calcScore,
  statusFromScore,
  type VerificationChecks,
  type VerificationStatus,
} from "@/lib/scoring";
import { companyService } from "@/services/api";

function squadFromStatus(v: VerificationStatus): SquadStatus {
  if (v === "verified") return "RELEASED";
  if (v === "rejected") return "BLOCKED";
  return "HELD";
}

interface LedgerState {
  employees: Employee[];
  loading: boolean;
  fetchWorkers: (batchId?: string) => Promise<void>;
  setOverride: (id: string, value: boolean) => void;
  setStatus: (id: string, status: SquadStatus) => void;
  updateChecks: (id: string, checks: VerificationChecks) => void;
  /** Worker submitted documents — re-derive score from checks. */
  submitDocs: (id: string, checks: VerificationChecks) => Employee | undefined;
  findByNinAndAccount: (nin: string, account: string) => Employee | undefined;
  fetchEmployee: (id: string) => Promise<void>;
  executeVerifiedPayments: () => number;
}

export function mapWorker(w: any): Employee {
  const status = w.verification_status || "pending";
  return {
    id: w.id,
    name: w.full_name,
    nin: w.nin,
    account: w.account_number,
    salary: w.salary_amount || 0,
    department: w.department || "Payroll", 
    trustScore: w.trust_score || (status === "verified" ? 100 : status === "flagged" ? 75 : status === "rejected" ? 20 : 0),
    verificationStatus: status as VerificationStatus,
    squadStatus: squadFromStatus(status as VerificationStatus),
    riskScore: 0,
    hasSubmittedDocs: !!w.worker_uploads?.length || status !== "pending",
    checks: w.checks || {
      ninVerified: status === "verified",
      statementAuthentic: status === "verified",
      salaryMatched: status === "verified",
      accountAgeValid: status === "verified",
      noSharedAccount: status === "verified",
      nameMatch: status === "verified",
      statementValid: status === "verified",
      screenshotMatch: status === "verified",
      receiptMatch: status === "verified",
      txnRefValid: status === "verified",
    },
    evidence: w.evidence || [],
    accountAgeDays: 0,
    flagReason: undefined,
    override: false,
  };
}

function recompute(e: Employee, checks: VerificationChecks, hasSubmitted = true): Employee {
  const trustScore = calcScore(checks);
  const verificationStatus = statusFromScore(trustScore, hasSubmitted);
  const squadStatus = squadFromStatus(verificationStatus);
  const riskScore = Math.round(((110 - trustScore) / 110) * 100);
  return { ...e, checks, trustScore, verificationStatus, squadStatus, riskScore, hasSubmittedDocs: hasSubmitted };
}

export const useLedgerStore = create<LedgerState>((set, get) => ({
  employees: [],
  loading: false,
  fetchWorkers: async (batchId) => {
    set({ loading: true });
    try {
      console.log("DEBUG: fetchWorkers called with batchId:", batchId);
      let data;
      if (batchId) {
        data = await companyService.getBatchWorkers(batchId);
      } else {
        const batches = await companyService.listBatches();
        console.log("DEBUG: fetched batches:", batches);
        if (batches.length > 0) {
          data = await companyService.getBatchWorkers(batches[0].id);
        } else {
          data = [];
        }
      }
      console.log("DEBUG: raw worker data:", data);
      if (Array.isArray(data)) {
        set({ employees: data.map(mapWorker), loading: false });
      } else {
        console.warn("DEBUG: worker data is not an array:", data);
        set({ employees: [], loading: false });
      }
    } catch (err) {
      console.error("DEBUG: fetchWorkers error:", err);
      set({ loading: false });
    }
  },
  fetchEmployee: async (id) => {
    set({ loading: true });
    try {
      const { employee } = await workerService.status(id);
      if (employee) {
        const mapped = mapWorker(employee);
        set((s) => ({
          employees: s.employees.some(e => e.id === mapped.id)
            ? s.employees.map(e => e.id === mapped.id ? mapped : e)
            : [...s.employees, mapped]
        }));
      }
    } catch (err) {
      console.error("DEBUG: fetchEmployee error:", err);
    } finally {
      set({ loading: false });
    }
  },
  setOverride: (id, value) =>
    set((s) => ({
      employees: s.employees.map((e) => {
        if (e.id !== id) return e;
        if (value) {
          return { ...e, override: true, verificationStatus: "verified", squadStatus: "RELEASED" };
        }
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

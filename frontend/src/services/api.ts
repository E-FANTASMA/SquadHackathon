// Centralized API service layer.
//
// Today: every method dispatches to local Zustand stores (mock backend).
// Tomorrow: flip USE_REAL_API to true (or set VITE_API_BASE_URL) and the
// `real*` paths will hit the actual REST endpoints. UI never changes.

import type { Employee } from "@/lib/mockData";
import type { VerificationChecks, VerificationStatus } from "@/lib/scoring";
import type { PayrollBatch, FailedTransaction } from "@/store/batchStore";
import { useLedgerStore } from "@/store/ledgerStore";
import { useBatchStore } from "@/store/batchStore";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
export const USE_REAL_API = !!API_BASE_URL;

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

// ---------- Worker portal ----------

export interface ClaimRecordInput { nin: string; account: string; }
export interface ClaimRecordResult { matched: boolean; employee?: Employee; }

export const workerService = {
  /** POST /worker/claim-record */
  async claimRecord(input: ClaimRecordInput): Promise<ClaimRecordResult> {
    if (USE_REAL_API) return http("/worker/claim-record", { method: "POST", body: JSON.stringify(input) });
    const employee = useLedgerStore.getState().findByNinAndAccount(input.nin, input.account);
    return { matched: !!employee, employee };
  },

  /** GET /worker/status?employeeId=... */
  async status(employeeId: string): Promise<{ status: VerificationStatus; trustScore: number; employee: Employee | undefined }> {
    if (USE_REAL_API) return http(`/worker/status?employeeId=${encodeURIComponent(employeeId)}`);
    const employee = useLedgerStore.getState().employees.find((e) => e.id === employeeId);
    return {
      status: employee?.verificationStatus ?? "pending",
      trustScore: employee?.trustScore ?? 0,
      employee,
    };
  },

  /** POST /worker/submit-documents — returns updated record with new score. */
  async submitDocuments(employeeId: string, checks: VerificationChecks): Promise<Employee | undefined> {
    if (USE_REAL_API) return http(`/worker/submit-documents`, { method: "POST", body: JSON.stringify({ employeeId, checks }) });
    return useLedgerStore.getState().submitDocs(employeeId, checks);
  },
};

// ---------- Company portal ----------

export interface UploadPayrollInput { filename: string; workerCount: number; totalAmount: number; }

export const companyService = {
  /** POST /company/upload-payroll */
  async uploadPayroll(input: UploadPayrollInput): Promise<PayrollBatch> {
    if (USE_REAL_API) return http("/company/upload-payroll", { method: "POST", body: JSON.stringify(input) });
    return useBatchStore.getState().addBatch(input);
  },

  /** GET /company/payroll-batches */
  async listBatches(): Promise<PayrollBatch[]> {
    if (USE_REAL_API) return http("/company/payroll-batches");
    return useBatchStore.getState().batches;
  },

  /** POST /company/wallet/fund */
  async fundWallet(amount: number) {
    if (USE_REAL_API) return http<{ ok: true } | { ok: false; failure: FailedTransaction }>("/company/wallet/fund", { method: "POST", body: JSON.stringify({ amount }) });
    return useBatchStore.getState().fundWallet(amount);
  },

  /** GET /company/payments/failed/:ref */
  async getFailedTransaction(ref: string): Promise<FailedTransaction | undefined> {
    if (USE_REAL_API) return http(`/company/payments/failed/${encodeURIComponent(ref)}`);
    return useBatchStore.getState().getFailure(ref);
  },

  /** POST /company/squad/disburse — only callable when verification_status === 'verified'. */
  async disburseToWorker(employeeId: string): Promise<{ ok: true; ref: string } | { ok: false; reason: string }> {
    const employee = useLedgerStore.getState().employees.find((e) => e.id === employeeId);
    if (!employee) return { ok: false, reason: "Employee not found" };
    if (employee.verificationStatus !== "verified" && !employee.override) {
      return { ok: false, reason: `Squad transfer blocked: status is ${employee.verificationStatus}, must be 'verified'.` };
    }
    if (USE_REAL_API) return http("/company/squad/disburse", { method: "POST", body: JSON.stringify({ employeeId }) });
    return { ok: true, ref: `SQD-${Date.now()}` };
  },
};

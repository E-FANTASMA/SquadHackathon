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

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
export const USE_REAL_API = true; // Always use the backend for this integration

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {};
  if (!(init?.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  
  // Add Auth Token if available
  try {
    const authStateStr = localStorage.getItem('payguard-auth');
    if (authStateStr) {
      const authState = JSON.parse(authStateStr);
      const token = authState.state?.user?.token;
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }
  } catch (e) {
    console.error("Failed to parse auth state", e);
  }

  const url = `${API_BASE_URL}${path}`;
  console.log(`DEBUG: Calling API: ${init?.method || 'GET'} ${url}`);

  const res = await fetch(url, {
    ...init,
    headers: { ...headers, ...(init?.headers as Record<string, string> ?? {}) },
  });

  if (!res.ok) {
    let errorMsg = `${res.status} ${res.statusText}`;
    try {
      const errorData = await res.json();
      errorMsg = errorData.error || errorData.message || errorMsg;
    } catch (e) {
      // Not JSON
    }
    console.error(`DEBUG: API Error: ${errorMsg}`);
    throw new Error(errorMsg);
  }

  const data = await res.json();
  console.log(`DEBUG: API Success: ${path}`, data);
  return data as T;
}

// ---------- Auth ----------

export const authService = {
  async companySignup(data: any) {
    return http("/auth/company/signup", { method: "POST", body: JSON.stringify(data) });
  },
  async workerSignup(data: any) {
    return http("/auth/worker/signup", { method: "POST", body: JSON.stringify(data) });
  },
  async login(data: any) {
    return http("/auth/company/login", { method: "POST", body: JSON.stringify(data) });
  },
  async getSquadBalance() {
    return http("/payment/balance", { method: "GET" });
  },
};

// ---------- Worker portal ----------

export interface ClaimRecordInput { nin: string; account: string; bank_code?: string; bank_name?: string; }
export interface ClaimRecordResult { matched: boolean; employee?: Employee; }

export const workerService = {
  /** POST /worker/claim-record */
  async claimRecord(input: ClaimRecordInput): Promise<ClaimRecordResult> {
    if (USE_REAL_API) {
      // Map account to account_number for backend
      const body = {
        nin: input.nin,
        account_number: input.account,
        bank_code: input.bank_code,
        bank_name: input.bank_name
      };
      return http("/worker/claim-record", { method: "POST", body: JSON.stringify(body) });
    }
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
  async submitDocuments(employeeId: string, payload: FormData): Promise<any> {
    if (USE_REAL_API) return http(`/worker/submit-documents`, { method: "POST", body: payload });
    return useLedgerStore.getState().submitDocs(employeeId, payload as unknown as VerificationChecks);
  },

  /** POST /worker/submit-appeal */
  async submitAppeal(data: { reason: string; payroll_worker_id?: string }) {
    return http("/worker/submit-appeal", { method: "POST", body: JSON.stringify(data) });
  },

  /** POST /worker/submit-receipt — multipart (receipt) + expected tx fields. */
  async submitReceipt(input: { reference_id: string; amount?: string; date?: string; receipt: File }) {
    const form = new FormData();
    form.append("receipt", input.receipt);
    form.append("reference_id", input.reference_id);
    if (input.amount) form.append("amount", input.amount);
    if (input.date) form.append("date", input.date);
    return http("/worker/submit-receipt", { method: "POST", body: form });
  },
};

// ---------- Company portal ----------

export interface UploadPayrollInput { filename: string; workerCount: number; totalAmount: number; }

export const companyService = {
  /** POST /company/upload-payroll */
  async uploadPayroll(input: FormData | UploadPayrollInput): Promise<any> {
    if (USE_REAL_API) {
      const body = input instanceof FormData ? input : JSON.stringify(input);
      return http("/company/upload-payroll", { method: "POST", body });
    }
    return useBatchStore.getState().addBatch(input as UploadPayrollInput);
  },

  /** GET /company/payroll-batches */
  async listBatches(): Promise<any[]> {
    if (USE_REAL_API) return http("/company/payroll-batches");
    return useBatchStore.getState().batches;
  },

  /** GET /company/batch-workers/:id */
  async getBatchWorkers(batchId: string): Promise<any[]> {
    return http(`/company/batch-workers/${batchId}`);
  },

  /** DELETE /company/delete-batch/:id */
  async deleteBatch(batchId: string): Promise<any> {
    return http(`/company/delete-batch/${batchId}`, { method: "DELETE" });
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

  /** POST /company/update-worker-status */
  async updateWorkerStatus(data: { workerRecordId: string; status: string }): Promise<any> {
    return http("/company/update-worker-status", { method: "POST", body: JSON.stringify(data) });
  },

  /** GET /company/appeals */
  async listAppeals(): Promise<any[]> {
    return http("/company/appeals");
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

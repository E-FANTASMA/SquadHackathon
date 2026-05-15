// Centralized API service layer (aligned with trusty-payguard-ai).
// Set VITE_API_BASE_URL to hit your REST backend; otherwise Zustand mocks are used.

import type { Employee } from "@/lib/mockData";
import type { VerificationChecks, VerificationStatus } from "@/lib/scoring";
import type { PayrollBatch, FailedTransaction } from "@/store/batchStore";
import { useLedgerStore } from "@/store/ledgerStore";
import { useBatchStore } from "@/store/batchStore";
import { getApiBaseUrl } from "@/lib/env";
import { getSupabase } from "@/lib/supabase/client";
import { employeeFromApiDto } from "@/services/employeeDto";

export const API_BASE_URL = getApiBaseUrl();
export const USE_REAL_API = !!API_BASE_URL;

async function authHeaders(): Promise<HeadersInit> {
  const sb = getSupabase();
  if (!sb) return {};
  const { data } = await sb.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getApiBaseUrl();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(await authHeaders()),
    ...(init?.headers ?? {}),
  };
  const res = await fetch(`${base}${path}`, { ...init, headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

async function httpOptional<T>(path: string, init?: RequestInit): Promise<T | null> {
  const base = getApiBaseUrl();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(await authHeaders()),
    ...(init?.headers ?? {}),
  };
  const res = await fetch(`${base}${path}`, { ...init, headers });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  if (res.status === 204) return null;
  return (await res.json()) as T;
}

function normalizeBatch(raw: unknown): PayrollBatch | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  const id = String(b.id ?? "");
  if (!id) return null;
  const status = (b.status as PayrollBatch["status"]) ?? "pending";
  return {
    id,
    filename: String(b.filename ?? b.file_name ?? "payroll"),
    uploadedAt: Number(b.uploaded_at ?? b.uploadedAt ?? Date.now()),
    workerCount: Number(b.worker_count ?? b.workerCount ?? 0),
    totalAmount: Number(b.total_amount ?? b.totalAmount ?? 0),
    status,
  };
}

function normalizeFailure(raw: unknown): FailedTransaction | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const f = raw as Record<string, unknown>;
  const ref = String(f.ref ?? f.reference ?? f.transaction_ref ?? "");
  if (!ref) return undefined;
  return {
    ref,
    ts: Number(f.ts ?? f.created_at ?? f.createdAt ?? Date.now()),
    code: String(f.code ?? f.error_code ?? "UNKNOWN"),
    message: String(f.message ?? f.error_message ?? f.body ?? ""),
    amount: Number(f.amount ?? 0),
    context: (f.context as FailedTransaction["context"]) ?? "wallet-funding",
  };
}

// ---------- Worker portal ----------

export interface ClaimRecordInput {
  nin: string;
  account: string;
}

export interface ClaimRecordResult {
  matched: boolean;
  employee?: Employee;
}

export const workerService = {
  /** POST /worker/claim-record */
  async claimRecord(input: ClaimRecordInput): Promise<ClaimRecordResult> {
    if (USE_REAL_API) {
      const json = await http<unknown>("/worker/claim-record", {
        method: "POST",
        body: JSON.stringify(input),
      });
      const obj = json as Record<string, unknown>;
      const matched = Boolean(obj.matched ?? obj.match);
      const employee = employeeFromApiDto(obj.employee ?? obj.record);
      return { matched, employee };
    }
    const employee = useLedgerStore.getState().findByNinAndAccount(input.nin, input.account);
    return { matched: !!employee, employee };
  },

  /** GET /worker/status?employeeId=… */
  async status(employeeId: string): Promise<{
    status: VerificationStatus;
    trustScore: number;
    employee: Employee | undefined;
  }> {
    if (USE_REAL_API) {
      const json = await http<unknown>(
        `/worker/status?employeeId=${encodeURIComponent(employeeId)}`,
      );
      const obj = json as Record<string, unknown>;
      const employee = employeeFromApiDto(obj.employee ?? obj.record ?? json);
      const st = employee?.verificationStatus ?? "pending";
      return {
        status: st,
        trustScore: employee?.trustScore ?? 0,
        employee,
      };
    }
    const employee = useLedgerStore.getState().employees.find((e) => e.id === employeeId);
    return {
      status: employee?.verificationStatus ?? "pending",
      trustScore: employee?.trustScore ?? 0,
      employee,
    };
  },

  /** POST /worker/submit-documents */
  async submitDocuments(
    employeeId: string,
    checks: VerificationChecks,
    attachments?: { statementPath?: string; screenshotPath?: string },
  ): Promise<Employee | undefined> {
    if (USE_REAL_API) {
      const json = await http<unknown>("/worker/submit-documents", {
        method: "POST",
        body: JSON.stringify({ employeeId, checks, ...attachments }),
      });
      return employeeFromApiDto((json as Record<string, unknown>).employee ?? json);
    }
    return useLedgerStore.getState().submitDocs(employeeId, checks);
  },
};

// ---------- Company portal ----------

export interface UploadPayrollInput {
  filename: string;
  workerCount: number;
  totalAmount: number;
}

export const companyService = {
  /** POST /company/upload-payroll */
  async uploadPayroll(input: UploadPayrollInput): Promise<PayrollBatch> {
    if (USE_REAL_API) {
      const json = await http<unknown>("/company/upload-payroll", {
        method: "POST",
        body: JSON.stringify(input),
      });
      const b = normalizeBatch((json as Record<string, unknown>).batch ?? json);
      if (b) return b;
      throw new Error("Invalid upload response");
    }
    return useBatchStore.getState().addBatch(input);
  },

  /** GET /company/payroll-batches */
  async listBatches(): Promise<PayrollBatch[]> {
    if (USE_REAL_API) {
      const json = await http<unknown>("/company/payroll-batches");
      const rows = Array.isArray(json) ? json : (json as Record<string, unknown>).batches;
      if (!Array.isArray(rows)) return [];
      return rows.map(normalizeBatch).filter(Boolean) as PayrollBatch[];
    }
    return useBatchStore.getState().batches;
  },

  /** POST /company/wallet/fund */
  async fundWallet(
    amount: number,
  ): Promise<{ ok: true } | { ok: false; failure: FailedTransaction }> {
    if (USE_REAL_API) {
      return http<{ ok: true } | { ok: false; failure: FailedTransaction }>("/company/wallet/fund", {
        method: "POST",
        body: JSON.stringify({ amount }),
      });
    }
    return useBatchStore.getState().fundWallet(amount);
  },

  /** GET /company/payments/failed/:ref — maps payment_webhooks / payments payloads */
  async getFailedTransaction(ref: string): Promise<FailedTransaction | null> {
    if (USE_REAL_API) {
      const json = await httpOptional<unknown>(
        `/company/payments/failed/${encodeURIComponent(ref)}`,
      );
      if (!json) return null;
      const normalized = normalizeFailure(
        (json as Record<string, unknown>).failure ??
          (json as Record<string, unknown>).webhook ??
          (json as Record<string, unknown>).payment ??
          json,
      );
      return normalized ?? null;
    }
    return useBatchStore.getState().getFailure(ref) ?? null;
  },

  /** POST /company/squad/disburse — server must enforce verified; client mirrors constraint. */
  async disburseToWorker(
    employeeId: string,
  ): Promise<{ ok: true; ref: string } | { ok: false; reason: string }> {
    const employee = useLedgerStore.getState().employees.find((e) => e.id === employeeId);
    if (!employee) return { ok: false, reason: "Employee not found" };
    if (employee.verificationStatus !== "verified" && !employee.override) {
      return {
        ok: false,
        reason: `Squad transfer blocked: status is ${employee.verificationStatus}, must be 'verified'.`,
      };
    }
    if (USE_REAL_API) {
      return http<{ ok: true; ref: string } | { ok: false; reason: string }>(
        "/company/squad/disburse",
        {
          method: "POST",
          body: JSON.stringify({ employeeId }),
        },
      );
    }
    return { ok: true, ref: `SQD-${Date.now()}` };
  },
};

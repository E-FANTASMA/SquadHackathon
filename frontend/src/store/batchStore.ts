import { create } from "zustand";

export type BatchStatus = "pending" | "processing" | "funded" | "completed";

export interface PayrollBatch {
  id: string;
  filename: string;
  uploadedAt: number;
  workerCount: number;
  totalAmount: number;
  status: BatchStatus;
}

export interface FailedTransaction {
  ref: string;
  ts: number;
  code: string;
  message: string;
  amount: number;
  context: "wallet-funding" | "disbursement";
}

interface BatchState {
  batches: PayrollBatch[];
  walletBalance: number;
  failures: FailedTransaction[];
  addBatch: (b: Omit<PayrollBatch, "id" | "uploadedAt" | "status">) => PayrollBatch;
  advanceBatch: (id: string) => void;
  fundWallet: (amount: number) => { ok: true } | { ok: false; failure: FailedTransaction };
  recordFailure: (f: FailedTransaction) => void;
  getFailure: (ref: string) => FailedTransaction | undefined;
}

const SQUAD_ERRORS = [
  { code: "WALLET_INSUFFICIENT", message: "Insufficient funds in source wallet." },
  { code: "INVALID_RECIPIENT", message: "Recipient account number could not be verified by NIBSS." },
  { code: "SQUAD_TIMEOUT", message: "Squad gateway did not respond within 30s." },
  { code: "DUPLICATE_REF", message: "Transaction reference already exists for this cycle." },
];

export const useBatchStore = create<BatchState>((set, get) => ({
  batches: [
    {
      id: "BATCH-1001",
      filename: "june_2026_payroll.xlsx",
      uploadedAt: Date.now() - 3 * 86_400_000,
      workerCount: 220,
      totalAmount: 64_500_000,
      status: "completed",
    },
    {
      id: "BATCH-1002",
      filename: "july_2026_payroll.xlsx",
      uploadedAt: Date.now() - 86_400_000,
      workerCount: 220,
      totalAmount: 67_120_000,
      status: "funded",
    },
  ],
  walletBalance: 12_500_000,
  failures: [],
  addBatch: (b) => {
    const batch: PayrollBatch = {
      ...b,
      id: `BATCH-${1000 + get().batches.length + 1}`,
      uploadedAt: Date.now(),
      status: "pending",
    };
    set((s) => ({ batches: [batch, ...s.batches] }));
    return batch;
  },
  advanceBatch: (id) =>
    set((s) => ({
      batches: s.batches.map((b) => {
        if (b.id !== id) return b;
        const order: BatchStatus[] = ["pending", "processing", "funded", "completed"];
        const next = order[Math.min(order.length - 1, order.indexOf(b.status) + 1)];
        return { ...b, status: next };
      }),
    })),
  fundWallet: (amount) => {
    // 15% chance of mock failure
    if (Math.random() < 0.15) {
      const err = SQUAD_ERRORS[Math.floor(Math.random() * SQUAD_ERRORS.length)];
      const failure: FailedTransaction = {
        ref: `SQDF-${Date.now()}`,
        ts: Date.now(),
        code: err.code,
        message: err.message,
        amount,
        context: "wallet-funding",
      };
      set((s) => ({ failures: [failure, ...s.failures] }));
      return { ok: false, failure };
    }
    set((s) => ({ walletBalance: s.walletBalance + amount }));
    return { ok: true };
  },
  recordFailure: (f) => set((s) => ({ failures: [f, ...s.failures] })),
  getFailure: (ref) => get().failures.find((f) => f.ref === ref),
}));

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppealStatus = "open" | "approved" | "rejected";

export interface Appeal {
  id: string;
  workerId: string; // auth user id
  workerName: string;
  employeeId?: string; // matched payroll record (if any)
  message: string;
  supportingDocName?: string;
  status: AppealStatus;
  createdAt: number;
  resolvedAt?: number;
  reviewerNote?: string;
}

interface AppealState {
  appeals: Appeal[];
  submit: (a: Omit<Appeal, "id" | "status" | "createdAt">) => Appeal;
  resolve: (id: string, status: Exclude<AppealStatus, "open">, note?: string) => void;
  forWorker: (workerId: string) => Appeal[];
}

export const useAppealStore = create<AppealState>()(
  persist(
    (set, get) => ({
      appeals: [
        {
          id: "APL-001",
          workerId: "demo",
          workerName: "Aisha Mohammed",
          employeeId: "EMP-10004",
          message: "My NIN was updated after marriage. Attaching updated National ID for verification.",
          supportingDocName: "national_id_aisha.jpg",
          status: "open",
          createdAt: Date.now() - 3 * 3_600_000,
        },
      ],
      submit: (a) => {
        const appeal: Appeal = {
          ...a,
          id: `APL-${String(100 + get().appeals.length + 1)}`,
          status: "open",
          createdAt: Date.now(),
        };
        set((s) => ({ appeals: [appeal, ...s.appeals] }));
        return appeal;
      },
      resolve: (id, status, note) =>
        set((s) => ({
          appeals: s.appeals.map((a) =>
            a.id === id ? { ...a, status, resolvedAt: Date.now(), reviewerNote: note } : a,
          ),
        })),
      forWorker: (workerId) => get().appeals.filter((a) => a.workerId === workerId),
    }),
    { name: "payguard-appeals" },
  ),
);

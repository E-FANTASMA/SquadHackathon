import { create } from "zustand";

export type AgencyTier = "small" | "state" | "federal";

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  kind: "bank" | "payroll";
  status: "queued" | "scanning" | "extracted" | "needs-rescan";
}

interface WizardState {
  step: number;
  agency: string;
  tier: AgencyTier;
  cycle: string;
  expectedEmployees: number;
  files: UploadedFile[];
  riskConfidence: number | null;
  setStep: (n: number) => void;
  next: () => void;
  back: () => void;
  setScope: (p: Partial<Pick<WizardState, "agency" | "tier" | "cycle" | "expectedEmployees">>) => void;
  addFiles: (files: UploadedFile[]) => void;
  updateFile: (id: string, patch: Partial<UploadedFile>) => void;
  removeFile: (id: string) => void;
  setRiskConfidence: (n: number | null) => void;
  reset: () => void;
}

const initial = {
  step: 0,
  agency: "",
  tier: "state" as AgencyTier,
  cycle: new Date().toISOString().slice(0, 7),
  expectedEmployees: 5000,
  files: [] as UploadedFile[],
  riskConfidence: null as number | null,
};

export const useWizardStore = create<WizardState>((set) => ({
  ...initial,
  setStep: (step) => set({ step }),
  next: () => set((s) => ({ step: Math.min(3, s.step + 1) })),
  back: () => set((s) => ({ step: Math.max(0, s.step - 1) })),
  setScope: (p) => set(p),
  addFiles: (files) => set((s) => ({ files: [...s.files, ...files] })),
  updateFile: (id, patch) =>
    set((s) => ({ files: s.files.map((f) => (f.id === id ? { ...f, ...patch } : f)) })),
  removeFile: (id) => set((s) => ({ files: s.files.filter((f) => f.id !== id) })),
  setRiskConfidence: (riskConfidence) => set({ riskConfidence }),
  reset: () => set(initial),
}));

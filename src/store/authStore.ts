import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "company_admin" | "worker";

export interface AuthUser {
  id: string;
  role: Role;
  email: string;
  // worker fields
  fullName?: string;
  nin?: string;
  phone?: string;
  // company fields
  companyName?: string;
  // worker portal: matched employee record id
  matchedEmployeeId?: string;
}

interface AuthState {
  user: AuthUser | null;
  signup: (u: Omit<AuthUser, "id">) => AuthUser;
  login: (email: string, role: Role) => AuthUser;
  logout: () => void;
  patch: (p: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      signup: (u) => {
        const user: AuthUser = { ...u, id: `USR-${Date.now()}` };
        set({ user });
        return user;
      },
      login: (email, role) => {
        const existing = get().user;
        const user: AuthUser =
          existing && existing.email === email
            ? { ...existing, role }
            : {
                id: `USR-${Date.now()}`,
                email,
                role,
                fullName: role === "worker" ? "Demo Worker" : undefined,
                companyName: role === "company_admin" ? "Demo Ministry" : undefined,
              };
        set({ user });
        return user;
      },
      logout: () => set({ user: null }),
      patch: (p) => set((s) => ({ user: s.user ? { ...s.user, ...p } : s.user })),
    }),
    { name: "payguard-auth" },
  ),
);

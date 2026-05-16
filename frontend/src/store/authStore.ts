import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authService } from "@/services/api";

export type Role = "company_admin" | "worker";

export interface AuthUser {
  id: string;
  role: Role;
  email: string;
  token?: string;
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
  signup: (u: any) => Promise<AuthUser>;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  patch: (p: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      signup: async (u) => {
        let res;
        if (u.role === 'worker') {
          res = await authService.workerSignup(u);
        } else {
          res = await authService.companySignup(u);
        }
        
        // After signup, we usually expect them to login, but if the API returns a user/profile, we can set it.
        // For simplicity in this demo, we'll let them login after signup or auto-login if the API supports it.
        // Currently our authController returns { user, company/worker } on signup.
        
        const user: AuthUser = {
          id: res.user.id,
          email: res.user.email,
          role: u.role,
          fullName: u.fullName || u.companyName,
        };
        // We don't set the user here because they haven't verified email/logged in yet in a real flow.
        // But for this demo, let's assume they are logged in or redirect them to login.
        return user;
      },
      login: async (email, password) => {
        const res = await authService.login({ email, password });
        console.log("DEBUG: AuthStore login success", res);

        if (!res.session || !res.user) {
          throw new Error("Invalid login response from server");
        }

        const user: AuthUser = {
          id: res.user.id,
          email: res.user.email,
          role: res.profile?.role || 'worker',
          token: res.session.access_token,
          fullName: res.profile?.full_name,
          companyName: res.profile?.companies?.[0]?.company_name || res.profile?.full_name,
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

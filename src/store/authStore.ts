import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase/client";
import { fetchUserRole } from "@/lib/supabase/profile";
import { USE_SUPABASE } from "@/lib/env";

export type Role = "company_admin" | "worker";

export interface AuthUser {
  id: string;
  role: Role;
  email: string;
  fullName?: string;
  nin?: string;
  phone?: string;
  company_name?: string;
  /** Alias used in trusty-payguard-ai remote */
  companyName?: string;
  matchedEmployeeId?: string;
}

interface AuthState {
  session: Session | null;
  authReady: boolean;
  user: AuthUser | null;
  initAuth: () => Promise<void>;
  signInWithSupabase: (email: string, password: string) => Promise<void>;
  signUpWithSupabase: (
    email: string,
    password: string,
    opts: { role: Role; fullName?: string; company_name?: string },
  ) => Promise<void>;
  signup: (u: Omit<AuthUser, "id">) => AuthUser;
  login: (email: string, role: Role) => AuthUser;
  logout: () => Promise<void>;
  patch: (p: Partial<AuthUser>) => void;
}

let supabaseListenerAttached = false;
let authInitialization: Promise<void> | undefined;

async function applySupabaseSession(
  set: (partial: Partial<AuthState> | ((s: AuthState) => Partial<AuthState>)) => void,
  session: Session | null,
) {
  if (!session?.user) {
    set({ user: null, session: null });
    return;
  }
  const sb = getSupabase();
  if (!sb) return;
  const role = await fetchUserRole(sb, session.user.id);
  const meta = (session.user.user_metadata ?? {}) as Record<string, unknown>;
  const user: AuthUser = {
    id: session.user.id,
    email: session.user.email ?? "",
    role,
    fullName: (meta.full_name as string) ?? (meta.fullName as string) ?? undefined,
    company_name: (meta.company_name as string) ?? (meta.companyName as string) ?? undefined,
    companyName:
      (meta.companyName as string) ?? (meta.company_name as string) ?? undefined,
    nin: (meta.nin as string) ?? undefined,
    phone: (meta.phone as string) ?? undefined,
    matchedEmployeeId: (meta.matched_employee_id as string) ?? undefined,
  };
  set({ user, session });
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      authReady: false,
      user: null,

      initAuth: async () => {
        if (import.meta.env.SSR) {
          set({ authReady: true });
          return;
        }
        if (authInitialization) {
          await authInitialization;
          return;
        }
        authInitialization = (async () => {
          const sb = getSupabase();
          if (!sb) {
            set({ authReady: true });
            return;
          }
          const {
            data: { session },
          } = await sb.auth.getSession();
          await applySupabaseSession(set, session);
          if (!supabaseListenerAttached) {
            supabaseListenerAttached = true;
            sb.auth.onAuthStateChange((_event, next) => {
              void applySupabaseSession(set, next);
            });
          }
          set({ authReady: true });
        })();
        await authInitialization;
      },

      signInWithSupabase: async (email, password) => {
        const sb = getSupabase();
        if (!sb) throw new Error("Supabase is not configured (set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY).");
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const {
          data: { session },
        } = await sb.auth.getSession();
        await applySupabaseSession(set, session);
      },

      signUpWithSupabase: async (email, password, opts) => {
        const sb = getSupabase();
        if (!sb) throw new Error("Supabase is not configured.");
        const roleLabel = opts.role === "company_admin" ? "company_admin" : "worker";
        const { error } = await sb.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: roleLabel,
              full_name: opts.fullName,
              company_name: opts.company_name,
            },
          },
        });
        if (error) throw error;
        const {
          data: { session },
        } = await sb.auth.getSession();
        await applySupabaseSession(set, session);
      },

      signup: (u) => {
        const user: AuthUser = {
          ...u,
          id: `USR-${Date.now()}`,
          companyName: u.companyName ?? u.company_name,
          company_name: u.company_name ?? u.companyName,
        };
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
                company_name: role === "company_admin" ? "Demo Ministry" : undefined,
                companyName: role === "company_admin" ? "Demo Ministry" : undefined,
              };
        set({ user });
        return user;
      },

      logout: async () => {
        const sb = getSupabase();
        if (sb) await sb.auth.signOut();
        set({ user: null, session: null });
      },

      patch: (p) => set((s) => ({ user: s.user ? { ...s.user, ...p } : s.user })),
    }),
    {
      name: "payguard-auth",
      partialize: (s) =>
        USE_SUPABASE
          ? {}
          : {
              user: s.user,
            },
    },
  ),
);

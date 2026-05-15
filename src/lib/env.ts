/** Normalized public env (browser). Prefer VITE_* in Vite; non-prefixed keys are not available unless mirrored at build time. */
export function getApiBaseUrl(): string {
  const v = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.API_BASE_URL ?? "";
  return String(v).replace(/\/$/, "");
}

export function getSupabaseUrl(): string {
  return String(import.meta.env.VITE_SUPABASE_URL ?? import.meta.env.SUPABASE_URL ?? "").trim();
}

export function getSupabaseAnonKey(): string {
  return String(
    import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.SUPABASE_ANON_KEY ?? "",
  ).trim();
}

export const USE_REAL_API = !!getApiBaseUrl();
export const USE_SUPABASE = !!(getSupabaseUrl() && getSupabaseAnonKey());

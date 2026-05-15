import type { SupabaseClient } from "@supabase/supabase-js";
import type { Role } from "@/store/authStore";

/**
 * Reads `public.users.role` for the signed-in auth user.
 * Expects a row keyed by the same UUID as `auth.users.id`.
 */
export async function fetchUserRole(sb: SupabaseClient, userId: string): Promise<Role> {
  const { data, error } = await sb.from("users").select("role").eq("id", userId).maybeSingle();
  if (error || !data || typeof data.role !== "string") return "worker";
  const r = data.role.toLowerCase();
  if (r === "company_admin" || r === "admin" || r === "company") return "company_admin";
  return "worker";
}

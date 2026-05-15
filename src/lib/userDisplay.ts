import type { AuthUser } from "@/store/authStore";

/** Display name for company admins (supports remote `companyName` and legacy `company_name`). */
export function userDisplayName(user: AuthUser | null | undefined): string {
  if (!user) return "";
  return user.fullName ?? user.companyName ?? user.company_name ?? user.email;
}

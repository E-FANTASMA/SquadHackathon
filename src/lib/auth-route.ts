import { useAuthStore } from "@/store/authStore";

/**
 * For TanStack Start SSR: `beforeLoad` runs on the server where `localStorage` is empty, so
 * persisted auth is missing until the client rehydrates. Call this from guarded routes'
 * `beforeLoad` (await it) so client navigations see the real session before redirecting.
 */
export async function clientAuthReady(): Promise<void> {
  if (import.meta.env.SSR) return;
  const p = useAuthStore.persist;
  if (p && !p.hasHydrated()) {
    await p.rehydrate();
  }
  await useAuthStore.getState().initAuth();
}

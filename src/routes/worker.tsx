import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/store/authStore";

export const Route = createFileRoute("/worker")({
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    if (!user) throw redirect({ to: "/auth/login" });
    if (user.role !== "worker") throw redirect({ to: "/admin/dashboard" });
  },
  component: () => <Outlet />,
});

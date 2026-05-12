import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/store/authStore";

export const Route = createFileRoute("/admin")({
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    console.log("Admin beforeLoad - user:", user);
    if (!user) {
      console.log("No user found, redirecting to /auth/login");
      throw redirect({ to: "/auth/login" });
    }
    if (user.role !== "company_admin") {
      console.log("User is not company_admin, redirecting to /worker/home");
      throw redirect({ to: "/worker/home" });
    }
  },
  component: () => <Outlet />,
});

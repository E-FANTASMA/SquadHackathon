import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

export default function AdminLayout() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/auth/login" replace />;
  if (user.role !== "company_admin") return <Navigate to="/worker/home" replace />;
  return <Outlet />;
}

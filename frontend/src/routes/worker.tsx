import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

export default function WorkerLayout() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/auth/login" replace />;
  if (user.role !== "worker") return <Navigate to="/admin/dashboard" replace />;
  return <Outlet />;
}

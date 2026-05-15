import { Navigate } from "react-router-dom";
export default function DashboardRedirect() {
  return <Navigate to="/admin/dashboard" replace />;
}

import { Navigate, Route, Routes, Link, useRouteError } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/sonner";

import Landing from "@/routes/index";
import LoginPage from "@/routes/auth.login";
import SignupPage from "@/routes/auth.signup";
import AdminLayout from "@/routes/admin";
import AdminDashboard from "@/routes/admin.dashboard";
import BatchesPage from "@/routes/admin.batches";
import WalletPage from "@/routes/admin.wallet";
import AppealsPage from "@/routes/admin.appeals";
import FailurePage from "@/routes/admin.transaction-failed.$ref";
import WorkerLayout from "@/routes/worker";
import WorkerHome from "@/routes/worker.home";
import ClaimPage from "@/routes/worker.claim";
import DocumentsPage from "@/routes/worker.documents";
import AppealPage from "@/routes/worker.appeal";
import AuditPage from "@/routes/audit";
import WizardPage from "@/routes/wizard";

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/signup" element={<SignupPage />} />

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="batches" element={<BatchesPage />} />
            <Route path="wallet" element={<WalletPage />} />
            <Route path="appeals" element={<AppealsPage />} />
            <Route path="transaction-failed/:ref" element={<FailurePage />} />
          </Route>

          <Route path="/worker" element={<WorkerLayout />}>
            <Route index element={<Navigate to="/worker/home" replace />} />
            <Route path="home" element={<WorkerHome />} />
            <Route path="claim" element={<ClaimPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="appeal" element={<AppealPage />} />
          </Route>

          <Route path="/audit" element={<AuditPage />} />
          <Route path="/wizard" element={<WizardPage />} />
          <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}

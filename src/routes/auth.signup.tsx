import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/store/authStore";
import { Building2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { USE_SUPABASE } from "@/lib/env";

export const Route = createFileRoute("/auth/signup")({
  head: () => ({ meta: [{ title: "Create account · PayGuard AI" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    role: (s.role as string) === "company" ? "company" : "worker",
  }),
  component: SignupPage,
});

function SignupPage() {
  const { role: defaultRole } = Route.useSearch();
  const signup = useAuthStore((s) => s.signup);
  const signUpWithSupabase = useAuthStore((s) => s.signUpWithSupabase);
  const navigate = useNavigate();

  const [role, setRole] = useState<"worker" | "company">(defaultRole as "worker" | "company");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [worker, setWorker] = useState({
    fullName: "",
    nin: "",
    email: "",
    phone: "",
  });
  const [company, setCompany] = useState({
    company_name: "",
    email: "",
    phone: "",
  });

  const submitWorker = () => {
    if (!worker.fullName || !worker.email) return toast.error("Full name and email required");
    if (worker.nin && worker.nin.length !== 11) return toast.error("NIN must be 11 digits");
    signup({ ...worker, role: "worker" });
    toast.success("Account created");
    navigate({ to: "/worker/home" });
  };

  const submitCompany = () => {
    if (!company.company_name || !company.email)
      return toast.error("Company name and email required");
    signup({ ...company, role: "company_admin" });
    toast.success("Company account created");
    navigate({ to: "/admin/dashboard" });
  };

  const submitWorkerSupabase = async () => {
    if (!worker.fullName || !worker.email || !password)
      return toast.error("Full name, email, and password are required");
    setBusy(true);
    try {
      await signUpWithSupabase(worker.email, password, {
        role: "worker",
        fullName: worker.fullName,
      });
      toast.success("Check your email if confirmation is required, then sign in.");
      navigate({ to: "/auth/login" });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Sign up failed");
    } finally {
      setBusy(false);
    }
  };

  const submitCompanySupabase = async () => {
    if (!company.company_name || !company.email || !password)
      return toast.error("Company name, email, and password are required");
    setBusy(true);
    try {
      await signUpWithSupabase(company.email, password, {
        role: "company_admin",
        company_name: company.company_name,
      });
      toast.success("Check your email if confirmation is required, then sign in.");
      navigate({ to: "/auth/login" });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Sign up failed");
    } finally {
      setBusy(false);
    }
  };

  if (USE_SUPABASE) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-md items-center px-4 py-10">
        <div className="w-full rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
          <h1 className="text-xl font-semibold">Create your PayGuard account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A <code className="text-xs">users</code> row with matching <code className="text-xs">id</code>{" "}
            and <code className="text-xs">role</code> should be created by your Supabase trigger.
          </p>

          <Tabs
            value={role}
            onValueChange={(v) => setRole(v as "worker" | "company")}
            className="mt-6"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="worker">
                <UserRound className="h-4 w-4" /> Worker
              </TabsTrigger>
              <TabsTrigger value="company">
                <Building2 className="h-4 w-4" /> Company
              </TabsTrigger>
            </TabsList>

            <TabsContent value="worker" className="mt-4 space-y-3">
              <Field
                label="Full name"
                value={worker.fullName}
                onChange={(v) => setWorker({ ...worker, fullName: v })}
              />
              <Field
                label="NIN (11 digits)"
                value={worker.nin}
                onChange={(v) => setWorker({ ...worker, nin: v.replace(/\D/g, "").slice(0, 11) })}
                inputMode="numeric"
              />
              <Field
                label="Email"
                type="email"
                value={worker.email}
                onChange={(v) => setWorker({ ...worker, email: v })}
              />
              <Field
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
              />
              <Button className="w-full" disabled={busy} onClick={() => void submitWorkerSupabase()}>
                {busy ? "Creating…" : "Create Worker account"}
              </Button>
            </TabsContent>

            <TabsContent value="company" className="mt-4 space-y-3">
              <Field
                label="Company name"
                value={company.company_name}
                onChange={(v) => setCompany({ ...company, company_name: v })}
              />
              <Field
                label="Email"
                type="email"
                value={company.email}
                onChange={(v) => setCompany({ ...company, email: v })}
              />
              <Field
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
              />
              <Button className="w-full" disabled={busy} onClick={() => void submitCompanySupabase()}>
                {busy ? "Creating…" : "Create Company account"}
              </Button>
            </TabsContent>
          </Tabs>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/auth/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-md items-center px-4 py-10">
      <div className="w-full rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
        <h1 className="text-xl font-semibold">Create your PayGuard account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pick a portal to register for.</p>

        <Tabs
          value={role}
          onValueChange={(v) => setRole(v as "worker" | "company")}
          className="mt-6"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="worker"
              onClick={() => setRole("worker")}
              className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
            >
              <UserRound className="h-4 w-4" /> Worker
            </TabsTrigger>
            <TabsTrigger
              value="company"
              onClick={() => setRole("company")}
              className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
            >
              <Building2 className="h-4 w-4" /> Company
            </TabsTrigger>
          </TabsList>

          <TabsContent value="worker" className="mt-4 space-y-3">
            <Field
              label="Full name"
              value={worker.fullName}
              onChange={(v) => setWorker({ ...worker, fullName: v })}
            />
            <Field
              label="NIN (11 digits)"
              value={worker.nin}
              onChange={(v) => setWorker({ ...worker, nin: v.replace(/\D/g, "").slice(0, 11) })}
              inputMode="numeric"
            />
            <Field
              label="Email"
              type="email"
              value={worker.email}
              onChange={(v) => setWorker({ ...worker, email: v })}
            />
            <Field
              label="Phone number"
              value={worker.phone}
              onChange={(v) => setWorker({ ...worker, phone: v })}
            />
            <Button className="w-full" onClick={submitWorker}>
              Create Worker account
            </Button>
          </TabsContent>

          <TabsContent value="company" className="mt-4 space-y-3">
            <Field
              label="Company name"
              value={company.company_name}
              onChange={(v) => setCompany({ ...company, company_name: v })}
            />
            <Field
              label="Email"
              type="email"
              value={company.email}
              onChange={(v) => setCompany({ ...company, email: v })}
            />
            <Field
              label="Phone number"
              value={company.phone}
              onChange={(v) => setCompany({ ...company, phone: v })}
            />
            <Button className="w-full" onClick={submitCompany}>
              Create Company account
            </Button>
          </TabsContent>
        </Tabs>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/auth/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  inputMode?: "text" | "numeric";
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

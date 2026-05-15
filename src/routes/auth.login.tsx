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

export const Route = createFileRoute("/auth/login")({
  head: () => ({ meta: [{ title: "Sign in · PayGuard AI" }] }),
  component: LoginPage,
});

function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const signInWithSupabase = useAuthStore((s) => s.signInWithSupabase);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("worker");
  const [busy, setBusy] = useState(false);

  const handleDemo = (r: "worker" | "company_admin") => {
    if (!email) {
      toast.error("Enter your email to continue");
      return;
    }
    login(email, r);
    toast.success(`Signed in as ${r === "worker" ? "Worker" : "Company Admin"}`);
    navigate({ to: r === "worker" ? "/worker/home" : "/admin/dashboard" });
  };

  const handleSupabase = async () => {
    if (!email || !password) {
      toast.error("Enter email and password");
      return;
    }
    setBusy(true);
    try {
      await signInWithSupabase(email, password);
      const user = useAuthStore.getState().user;
      if (!user) {
        toast.message("Check your email", {
          description: "If email confirmation is enabled, confirm your address then sign in again.",
        });
        return;
      }
      toast.success("Signed in");
      navigate({ to: user.role === "company_admin" ? "/admin/dashboard" : "/worker/home" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Sign in failed";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  if (USE_SUPABASE) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-md items-center px-4 py-10">
        <div className="w-full rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
          <h1 className="text-xl font-semibold">Sign in to PayGuard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Supabase Auth — routing uses the <code className="text-xs">users.role</code> row for
            your account.
          </p>
          <div className="mt-6 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pwd">Password</Label>
              <Input
                id="pwd"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button className="w-full" disabled={busy} onClick={() => void handleSupabase()}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link to="/auth/signup" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-md items-center px-4 py-10">
      <div className="w-full rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
        <h1 className="text-xl font-semibold">Sign in to PayGuard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Demo mode &mdash; pick your portal and continue. Set Supabase env vars for production auth.
        </p>

        <Tabs value={role} onValueChange={setRole} className="mt-6">
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

          <div className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pwd">Password</Label>
              <Input
                id="pwd"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <TabsContent value="worker" className="mt-4">
            <Button className="w-full" onClick={() => handleDemo("worker")}>
              Continue to Worker Portal
            </Button>
          </TabsContent>
          <TabsContent value="company" className="mt-4">
            <Button className="w-full" onClick={() => handleDemo("company_admin")}>
              Continue to Admin Portal
            </Button>
          </TabsContent>
        </Tabs>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link
            to="/auth/signup"
            search={{ role: "worker" }}
            className="font-medium text-primary hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

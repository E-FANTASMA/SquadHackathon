import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/store/authStore";
import { Building2, UserRound } from "lucide-react";
import { toast } from "sonner";


function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const handle = (role: "worker" | "company_admin") => {
    if (!email) {
      toast.error("Enter your email to continue");
      return;
    }
    login(email, role);
    toast.success(`Signed in as ${role === "worker" ? "Worker" : "Company Admin"}`);
    navigate(role === "worker" ? "/worker/home" : "/admin/dashboard");
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-md items-center px-4 py-10">
      <div className="w-full rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
        <h1 className="text-xl font-semibold">Sign in to PayGuard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Demo mode &mdash; pick your portal and continue. Backend wires in next.
        </p>

        <Tabs defaultValue="worker" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="worker"><UserRound className="h-4 w-4" /> Worker</TabsTrigger>
            <TabsTrigger value="company"><Building2 className="h-4 w-4" /> Company</TabsTrigger>
          </TabsList>

          <div className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pwd">Password</Label>
              <Input id="pwd" type="password" placeholder="••••••••" defaultValue="demo1234" />
            </div>
          </div>

          <TabsContent value="worker" className="mt-4">
            <Button className="w-full" onClick={() => handle("worker")}>Continue to Worker Portal</Button>
          </TabsContent>
          <TabsContent value="company" className="mt-4">
            <Button className="w-full" onClick={() => handle("company_admin")}>Continue to Admin Portal</Button>
          </TabsContent>
        </Tabs>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          New here? <Link to="/auth/signup" className="font-medium text-primary hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;

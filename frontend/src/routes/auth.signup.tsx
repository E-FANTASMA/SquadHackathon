import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/store/authStore";
import { Building2, UserRound } from "lucide-react";
import { toast } from "sonner";


function SignupPage() {
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get("role") === "company" ? "company" : "worker";
  const signup = useAuthStore((s) => s.signup);
  const navigate = useNavigate();

  const [worker, setWorker] = useState({ firstName: "", lastName: "", nin: "", email: "", phone: "", password: "" });
  const [company, setCompany] = useState({ companyName: "", firstName: "", lastName: "", email: "", phone: "", password: "" });

  const submitWorker = async () => {
    if (!worker.firstName || !worker.lastName || !worker.email || !worker.password || !worker.nin) {
      return toast.error("First name, Last name, NIN, and email/password are required");
    }
    if (worker.nin.length !== 11) return toast.error("NIN must be 11 digits");
    try {
      await signup({ ...worker, role: "worker" });
      toast.success("Account created");
      navigate("/worker/claim");
    } catch (error: any) {
      toast.error(error.message || "Signup failed");
    }
  };
  
  const submitCompany = async () => {
    if (!company.companyName || !company.firstName || !company.lastName || !company.email || !company.password) {
      return toast.error("All fields including Agency and Admin name are required");
    }
    try {
      await signup({ ...company, role: "company_admin" });
      toast.success("Ministry account created");
      navigate("/admin/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Signup failed");
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-md items-center px-4 py-10">
      <div className="w-full rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
        <h1 className="text-xl font-semibold">Create your PayGuard account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pick a portal to register for.</p>

        <Tabs defaultValue={defaultRole} className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="worker"><UserRound className="h-4 w-4" /> Worker</TabsTrigger>
            <TabsTrigger value="company"><Building2 className="h-4 w-4" /> Company</TabsTrigger>
          </TabsList>

          <TabsContent value="worker" className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="First Name" value={worker.firstName} onChange={(v) => setWorker({ ...worker, firstName: v })} />
              <Field label="Last Name" value={worker.lastName} onChange={(v) => setWorker({ ...worker, lastName: v })} />
            </div>
            <Field label="NIN (11 digits)" value={worker.nin} onChange={(v) => setWorker({ ...worker, nin: v.replace(/\D/g, "").slice(0, 11) })} inputMode="numeric" />
            <Field label="Email" type="email" value={worker.email} onChange={(v) => setWorker({ ...worker, email: v })} />
            <Field label="Phone number" value={worker.phone} onChange={(v) => setWorker({ ...worker, phone: v })} />
            <Field label="Password" type="password" value={worker.password} onChange={(v) => setWorker({ ...worker, password: v })} />
            <Button className="w-full" onClick={submitWorker}>Create Worker account</Button>
          </TabsContent>

          <TabsContent value="company" className="mt-4 space-y-3">
            <Field label="Ministry / Agency Name" value={company.companyName} onChange={(v) => setCompany({ ...company, companyName: v })} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Admin First Name" value={company.firstName} onChange={(v) => setCompany({ ...company, firstName: v })} />
              <Field label="Admin Last Name" value={company.lastName} onChange={(v) => setCompany({ ...company, lastName: v })} />
            </div>
            <Field label="Email" type="email" value={company.email} onChange={(v) => setCompany({ ...company, email: v })} />
            <Field label="Phone number" value={company.phone} onChange={(v) => setCompany({ ...company, phone: v })} />
            <Field label="Password" type="password" value={company.password} onChange={(v) => setCompany({ ...company, password: v })} />
            <Button className="w-full" onClick={submitCompany}>Create Agency account</Button>
          </TabsContent>
        </Tabs>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account? <Link to="/auth/login" className="font-medium text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", inputMode }: { label: string; value: string; onChange: (v: string) => void; type?: string; inputMode?: "text" | "numeric" }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input type={type} inputMode={inputMode} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export default SignupPage;

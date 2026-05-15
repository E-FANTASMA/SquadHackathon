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

  const [worker, setWorker] = useState({ fullName: "", nin: "", email: "", phone: "" });
  const [company, setCompany] = useState({ companyName: "", email: "", phone: "" });

  const submitWorker = () => {
    if (!worker.fullName || !worker.email) return toast.error("Full name and email required");
    if (worker.nin && worker.nin.length !== 11) return toast.error("NIN must be 11 digits");
    signup({ ...worker, role: "worker" });
    toast.success("Account created");
    navigate("/worker/claim");
  };
  const submitCompany = () => {
    if (!company.companyName || !company.email) return toast.error("Company name and email required");
    signup({ ...company, role: "company_admin" });
    toast.success("Company account created");
    navigate("/admin/dashboard");
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
            <Field label="Full name" value={worker.fullName} onChange={(v) => setWorker({ ...worker, fullName: v })} />
            <Field label="NIN (11 digits)" value={worker.nin} onChange={(v) => setWorker({ ...worker, nin: v.replace(/\D/g, "").slice(0, 11) })} inputMode="numeric" />
            <Field label="Email" type="email" value={worker.email} onChange={(v) => setWorker({ ...worker, email: v })} />
            <Field label="Phone number" value={worker.phone} onChange={(v) => setWorker({ ...worker, phone: v })} />
            <Button className="w-full" onClick={submitWorker}>Create Worker account</Button>
          </TabsContent>

          <TabsContent value="company" className="mt-4 space-y-3">
            <Field label="Company name" value={company.companyName} onChange={(v) => setCompany({ ...company, companyName: v })} />
            <Field label="Email" type="email" value={company.email} onChange={(v) => setCompany({ ...company, email: v })} />
            <Field label="Phone number" value={company.phone} onChange={(v) => setCompany({ ...company, phone: v })} />
            <Button className="w-full" onClick={submitCompany}>Create Company account</Button>
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
      <Label>{label}</Label>
      <Input type={type} inputMode={inputMode} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export default SignupPage;

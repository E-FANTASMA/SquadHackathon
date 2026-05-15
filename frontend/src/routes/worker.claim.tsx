import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import { useLedgerStore } from "@/store/ledgerStore";
import { workerService } from "@/services/api";
import { CheckCircle2, AlertTriangle, Search } from "lucide-react";
import { toast } from "sonner";


function ClaimPage() {
  const user = useAuthStore((s) => s.user);
  const patch = useAuthStore((s) => s.patch);
  const navigate = useNavigate();

  const [nin, setNin] = useState(user?.nin ?? "");
  const [account, setAccount] = useState("");
  const [result, setResult] = useState<"idle" | "match" | "miss">("idle");
  const [busy, setBusy] = useState(false);

  const onSearch = async () => {
    if (nin.length !== 11) return toast.error("NIN must be exactly 11 digits");
    if (account.length !== 10) return toast.error("Account number must be exactly 10 digits");
    setBusy(true);
    try {
      const { matched, employee } = await workerService.claimRecord({ nin, account });
      if (matched && employee) {
        patch({ matchedEmployeeId: employee.id, nin });
        setResult("match");
        toast.success(`Matched: ${employee.name}`);
      } else {
        setResult("miss");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lookup failed");
    } finally {
      setBusy(false);
    }
  };

  const matched = user?.matchedEmployeeId ? useLedgerStore.getState().employees.find((e) => e.id === user.matchedEmployeeId) : undefined;

  return (
    <div className="mx-auto max-w-md px-4 py-6 sm:max-w-xl sm:py-10">
      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Claim My Salary</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Match your NIN and 10-digit NUBAN against your employer's payroll. This is the first verification check.
      </p>

      <div className="mt-6 rounded-xl border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="nin">NIN (11 digits)</Label>
            <Input
              id="nin" inputMode="numeric" maxLength={11}
              value={nin}
              onChange={(e) => setNin(e.target.value.replace(/\D/g, "").slice(0, 11))}
              placeholder="12345678901"
              className="h-12 text-base tabular-nums"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="acct">Account Number (10 digits)</Label>
            <Input
              id="acct" inputMode="numeric" maxLength={10}
              value={account}
              onChange={(e) => setAccount(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="0123456789"
              className="h-12 text-base tabular-nums"
            />
          </div>
          <Button className="h-12 w-full text-base" onClick={onSearch} disabled={busy}>
            <Search className="h-4 w-4" /> {busy ? "Searching…" : "Search payroll"}
          </Button>
          <p className="text-[11px] text-muted-foreground">
            Demo tip: try NIN <span className="font-mono">11111111111</span> or use the account on a worker shown in the admin ledger.
          </p>
        </div>
      </div>

      {result === "match" && matched && (
        <div className="mt-6 rounded-xl border bg-card p-5 shadow-[var(--shadow-card)]" style={{ background: "color-mix(in oklab, var(--status-verified) 10%, transparent)", borderColor: "color-mix(in oklab, var(--status-verified) 35%, transparent)" }}>
          <div className="flex items-center gap-2 text-[color:var(--status-verified)]">
            <CheckCircle2 className="h-5 w-5" />
            <h2 className="text-base font-semibold">Match found</h2>
          </div>
          <dl className="mt-3 grid gap-2 text-sm">
            <Row label="Name on payroll" value={matched.name} />
            <Row label="Employee ID" value={matched.id} />
            <Row label="Department" value={matched.department} />
          </dl>
          <Button asChild className="mt-4 w-full">
            <Link to="/worker/documents">Continue to document upload</Link>
          </Button>
        </div>
      )}

      {result === "miss" && (
        <div className="mt-6 rounded-xl border bg-card p-5 shadow-[var(--shadow-card)]" style={{ background: "color-mix(in oklab, var(--status-rejected) 10%, transparent)", borderColor: "color-mix(in oklab, var(--status-rejected) 35%, transparent)" }}>
          <div className="flex items-center gap-2 text-[color:var(--status-rejected)]">
            <AlertTriangle className="h-5 w-5" />
            <h2 className="text-base font-semibold">Discrepancy detected</h2>
          </div>
          <p className="mt-2 text-sm">
            Your NIN and account combination doesn't match any record in your employer's payroll. This can happen if your details were updated (e.g. name change) or the wrong account was registered.
          </p>
          <Button asChild className="mt-4 w-full">
            <Link to="/worker/appeal">Request a manual appeal</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

export default ClaimPage;

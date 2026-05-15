import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBatchStore } from "@/store/batchStore";
import { useFeedStore } from "@/store/feedStore";
import { companyService } from "@/services/api";
import { compactNaira, naira } from "@/lib/format";
import { Wallet, ArrowUpRight, AlertTriangle } from "lucide-react";
import { toast } from "sonner";


function WalletPage() {
  const balance = useBatchStore((s) => s.walletBalance);
  const failures = useBatchStore((s) => s.failures);
  const pushFeed = useFeedStore((s) => s.push);
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const value = Number(amount.replace(/,/g, ""));
    if (!value || value <= 0) return toast.error("Enter an amount greater than 0");
    setBusy(true);
    try {
      const result = await companyService.fundWallet(value);
      if (!result.ok) {
        pushFeed({ kind: "blocked", message: `Squad funding failed · ${result.failure.code}` });
        toast.error(`Squad funding failed · ${result.failure.code}`);
        navigate(`/admin/transaction-failed/${result.failure.ref}`);
        return;
      }
      pushFeed({ kind: "released", message: `Wallet funded · ${naira(value)}` });
      toast.success(`Wallet funded · ${naira(value)}`);
      setAmount("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Squad Wallet</h1>
        <p className="text-sm text-muted-foreground">Fund the disbursement wallet. Transfers only fire from this balance.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]" style={{ backgroundImage: "var(--gradient-trust)" }}>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Wallet className="h-4 w-4" /> Available balance
          </div>
          <div className="mt-3 text-4xl font-semibold tabular-nums">{naira(balance)}</div>
          <div className="mt-1 text-xs text-muted-foreground">{compactNaira(balance)} · Squad sandbox</div>

          <div className="mt-6 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Fund amount (₦)</Label>
              <Input id="amount" inputMode="numeric" placeholder="500000" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d,]/g, ""))} />
            </div>
            <Button onClick={submit} disabled={busy} className="w-full">
              <ArrowUpRight className="h-4 w-4" /> {busy ? "Funding…" : "Fund via Squad"}
            </Button>
            <div className="flex flex-wrap gap-2">
              {[100_000, 500_000, 2_000_000, 10_000_000].map((v) => (
                <Button key={v} variant="outline" size="sm" onClick={() => setAmount(String(v))}>{compactNaira(v)}</Button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">~15% of mock fundings will fail and route to a help page so you can see the failure flow.</p>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-semibold">Recent failures</h2>
          {failures.length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">No failed transactions. The Squad gateway is happy.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {failures.slice(0, 5).map((f) => (
                <li key={f.ref} className="rounded-md border bg-background p-3 text-xs">
                  <div className="flex items-center gap-1.5 text-[color:var(--status-rejected)]">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span className="font-semibold">{f.code}</span>
                  </div>
                  <div className="mt-1 tabular-nums">{f.ref} · {naira(f.amount)}</div>
                  <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs">
                    <a href={`/admin/transaction-failed/${f.ref}`}>View help page →</a>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default WalletPage;

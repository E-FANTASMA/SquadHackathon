import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBatchStore } from "@/store/batchStore";
import { useFeedStore } from "@/store/feedStore";
import { companyService, authService } from "@/services/api";
import { compactNaira, naira } from "@/lib/format";
import { Wallet, ArrowUpRight, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";


function WalletPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const localBalance = useBatchStore((s) => s.walletBalance);
  const fundWalletLocally = useBatchStore((s) => s.fundWallet);
  const failures = useBatchStore((s) => s.failures);
  const pushFeed = useFeedStore((s) => s.push);
  const navigate = useNavigate();
  
  const [squadBalance, setSquadBalance] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch Squad Balance
  const fetchBalance = async () => {
    setRefreshing(true);
    try {
      const res: any = await authService.getSquadBalance();
      // Squad returns balance in Kobo
      if (res.data && res.data.balance !== undefined) {
        setSquadBalance(res.data.balance / 100);
      }
    } catch (err) {
      console.error("Failed to fetch Squad balance", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    
    // Check for amount parameter in URL (callback from Squad)
    const amountParam = searchParams.get("amount");
    if (amountParam) {
      const value = Number(amountParam);
      if (!isNaN(value) && value > 0) {
        fundWalletLocally(value);
        pushFeed({ kind: "released", message: `Wallet funding confirmed · ${naira(value)}` });
        toast.success(`Wallet funding of ${naira(value)} confirmed!`);
        
        // Clear param to avoid double counting on refresh
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("amount");
        setSearchParams(newParams);
      }
    }
  }, []);

  const submit = async () => {
    const value = Number(amount.replace(/,/g, ""));
    if (!value || value <= 0) return toast.error("Enter an amount greater than 0");
    setBusy(true);
    try {
      const result: any = await companyService.fundWallet(value);
      if (!result.ok) {
        pushFeed({ kind: "blocked", message: `Squad funding failed · ${result.failure.code}` });
        toast.error(`Squad funding failed · ${result.failure.code}`);
        navigate(`/admin/transaction-failed/${result.failure.ref}`);
        return;
      }

      if (result.checkout_url) {
        // Redirect to Squad checkout
        window.location.href = result.checkout_url;
        pushFeed({ kind: "info", message: `Redirecting to Squad · ${naira(value)}` });
      } else {
        pushFeed({ kind: "released", message: `Wallet funded · ${naira(value)}` });
        toast.success(`Wallet funded · ${naira(value)}`);
      }
      setAmount("");
    } catch (error: any) {
      toast.error(error.message || "Funding failed");
    } finally {
      setBusy(false);
    }
  };

  const displayBalance = squadBalance !== null ? squadBalance : localBalance;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Squad Wallet</h1>
          <p className="text-sm text-muted-foreground">Fund the disbursement wallet. Transfers only fire from this balance.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchBalance} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]" style={{ backgroundImage: "var(--gradient-trust)" }}>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Wallet className="h-4 w-4" /> Available balance
          </div>
          <div className="mt-3 text-4xl font-semibold tabular-nums">{naira(displayBalance)}</div>
          <div className="mt-1 text-xs text-muted-foreground">{compactNaira(displayBalance)} · Squad {squadBalance !== null ? "Live Balance" : "Sandbox Mode"}</div>

          <div className="mt-6 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Fund amount (₦)</Label>
              <Input id="amount" inputMode="numeric" placeholder="500000" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d,]/g, ""))} />
            </div>
            <Button onClick={submit} disabled={busy} className="w-full">
              <ArrowUpRight className="h-4 w-4" /> {busy ? "Redirecting…" : "Fund via Squad"}
            </Button>
            <div className="flex flex-wrap gap-2">
              {[100_000, 500_000, 2_000_000, 10_000_000].map((v) => (
                <Button key={v} variant="outline" size="sm" onClick={() => setAmount(String(v))}>{compactNaira(v)}</Button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">Payments are processed securely via Squad Gateway. You will be redirected to the secure payment page.</p>
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

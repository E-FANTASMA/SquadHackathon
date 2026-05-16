import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useLedgerStore, mapWorker } from "@/store/ledgerStore";
import { useFeedStore } from "@/store/feedStore";
import { workerService } from "@/services/api";
import { ScoreBreakdown } from "@/components/common/ScoreBreakdown";
import { StatusPill } from "@/components/common/StatusPill";
import { FileText, ImageIcon, Lock, Upload, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { MAX_SCORE } from "@/lib/scoring";


function DocumentsPage() {
  const user = useAuthStore((s) => s.user);
  const matchedEmployeeId = user?.matchedEmployeeId;
  const employeeFromStore = useLedgerStore((s) => s.employees.find((e) => e.id === matchedEmployeeId));
  const [localEmployee, setLocalEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pushFeed = useFeedStore((s) => s.push);

  const [statementFile, setStatementFile] = useState<File | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [tally, setTally] = useState<number | null>(null);
  const [receiptChallenge, setReceiptChallenge] = useState<any>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await workerService.status("");
      if (res.employee) {
        setLocalEmployee(mapWorker(res.employee));
      } else {
        setError("Your worker record could not be found. Please try claiming it again.");
      }
    } catch (err: any) {
      console.error("DEBUG: DocumentsPage fetch error:", err);
      setError(err.message || "Failed to load verification status. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const employee = localEmployee || employeeFromStore;

  if (loading) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <div className="text-center">
          <h2 className="text-lg font-medium">Verifying your status...</h2>
          <p className="text-sm text-muted-foreground">Syncing with payroll records</p>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center sm:max-w-xl">
        <div className="mb-4 flex justify-center">
          <AlertCircle className="h-16 w-16 text-destructive/50" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Syncing Issue</h1>
        <p className="mt-3 text-muted-foreground">
          {error || "We couldn't verify your payroll link. This happens if you haven't claimed your record yet or your session expired."}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={fetchStatus} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" /> Try again
          </Button>
          <Button asChild className="gap-2">
            <Link to="/worker/claim">Go to claim wizard</Link>
          </Button>
        </div>
      </div>
    );
  }

  const locked = employee.verificationStatus === "rejected" && !employee.override;

  const submit = async () => {
    if (!statementFile || !screenshotFile) return toast.error("Both bank statement and transaction screenshot are required");
    
    setTally(0);
    try {
      const formData = new FormData();
      formData.append("statement", statementFile);
      formData.append("screenshot", screenshotFile);
      
      const res: any = await workerService.submitDocuments(employee.id, formData);
      
      pushFeed({ kind: "info", message: `Worker submitted documents · ${employee.id}` });
      
      setReceiptChallenge(res.receipt_challenge ?? null);

      // Simulate tally for UI effect
      runTally(res.trust_score || 75, () => {
        toast.info(res.message);
        if (res.verification_status === "verified") toast.success(`Verified!`);
        else if (res.verification_status === "flagged") toast.warning(`Flagged for review`);
        
        // Refresh status to show new score/status
        fetchStatus();
        if (!res.receipt_challenge) {
            setTally(null);
        }
      });
    } catch (error: any) {
      toast.error(error.message || "Upload failed");
      setTally(null);
    }
  };

  const runTally = (target: number, done: () => void) => {
    setTally(0);
    let v = 0;
    const step = Math.max(1, Math.round(target / 25));
    const id = setInterval(() => {
      v = Math.min(target, v + step);
      setTally(v);
      if (v >= target) {
        clearInterval(id);
        setTimeout(() => { done(); }, 600);
      }
    }, 50);
  };

  const submitReceipt = async () => {
    if (!receiptChallenge?.reference_id) return toast.error("No receipt challenge reference available");
    if (!receiptFile) return toast.error("Please attach a receipt image");
    try {
      const res: any = await workerService.submitReceipt({
        reference_id: receiptChallenge.reference_id,
        amount: receiptChallenge.amount,
        date: receiptChallenge.date,
        receipt: receiptFile
      });
      toast.info(res.message || "Receipt submitted");
      if (res.verification_status === "verified") toast.success("Verified!");
      else if (res.verification_status === "flagged") toast.warning("Flagged for review");
      fetchStatus();
      setReceiptChallenge(null);
    } catch (error: any) {
      toast.error(error.message || "Receipt upload failed");
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-6 sm:max-w-2xl sm:py-10">
      <header className="mb-8 flex items-center justify-between gap-3 border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Verification Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">Prove your identity to unlock your GTCO salary payment.</p>
        </div>
        <div className="text-right">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Current Status</div>
            <StatusPill status={employee.verificationStatus} />
        </div>
      </header>

      {locked && (
        <div className="mb-8 rounded-xl border p-5 text-sm shadow-sm" style={{ background: "color-mix(in oklab, var(--status-rejected) 8%, transparent)", borderColor: "color-mix(in oklab, var(--status-rejected) 30%, transparent)", color: "var(--status-rejected)" }}>
          <div className="flex items-center gap-2 text-base font-bold"><Lock className="h-5 w-5" /> Account Restricted</div>
          <p className="mt-2 leading-relaxed">Your trust score is currently below the minimum requirement. To unlock further verification steps, please contact your department administrator or file a formal appeal.</p>
          <Button asChild className="mt-4 w-full font-semibold" variant="outline" style={{ borderColor: "currentColor", color: "currentColor" }}><Link to="/worker/appeal">File an Appeal</Link></Button>
        </div>
      )}

      <div className="grid gap-6">
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">1. Identity Evidence</h2>
          <div className="space-y-4">
            <DocCard
              icon={<FileText className="h-6 w-6" />}
              title="Bank Statement (PDF)"
              subtitle="Upload your most recent monthly statement"
              file={statementFile}
              onFile={setStatementFile}
              accept="application/pdf"
              disabled={locked}
            />
            <DocCard
              icon={<ImageIcon className="h-6 w-6" />}
              title="Bank App Screenshot"
              subtitle="Capture your recent transaction history"
              file={screenshotFile}
              onFile={setScreenshotFile}
              accept="image/*"
              capture
              disabled={locked}
            />
          </div>

          <Button 
            className="mt-6 h-14 w-full text-lg font-bold shadow-lg transition-transform active:scale-[0.98]" 
            onClick={submit} 
            disabled={locked || tally !== null || !statementFile || !screenshotFile}
          >
            <Upload className="mr-2 h-5 w-5" /> {tally !== null ? "Processing..." : "Submit for AI Audit"}
          </Button>
        </section>

        {tally !== null && (
          <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-8 text-center shadow-inner">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary/60">PayGuard AI Scoring Engine</div>
            <div className="mt-3 text-7xl font-black tabular-nums tracking-tighter text-primary">
              {tally}<span className="text-2xl font-bold text-muted-foreground">/{MAX_SCORE}</span>
            </div>
            <p className="mt-4 text-sm font-medium text-muted-foreground italic">Analyzing transaction patterns and name matches...</p>
          </div>
        )}

        {receiptChallenge?.reference_id && (
          <section className="rounded-xl border-2 border-dashed border-primary/40 bg-card p-6 shadow-md">
            <div className="flex items-center gap-2 text-primary">
                <AlertCircle className="h-5 w-5" />
                <h3 className="text-base font-bold">Action Required: Receipt Challenge</h3>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Our AI detected a specific transaction that requires proof. Please upload the receipt for reference <span className="font-mono font-bold text-foreground bg-muted px-1 rounded">{receiptChallenge.reference_id}</span>.
            </p>
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-muted bg-muted/30 py-8">
                <input 
                    type="file" 
                    id="receipt-upload"
                    accept="image/*" 
                    className="hidden"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)} 
                />
                <label htmlFor="receipt-upload" className="flex cursor-pointer flex-col items-center gap-2 text-sm font-medium">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    {receiptFile ? <span className="text-primary">{receiptFile.name}</span> : <span>Click to select receipt image</span>}
                </label>
              </div>
              <Button onClick={submitReceipt} disabled={!receiptFile} className="w-full font-bold">Verify Transaction</Button>
            </div>
          </section>
        )}

        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Verification Metrics</h3>
          <ScoreBreakdown checks={employee.checks} />
          
          <div className="mt-6 border-t pt-4">
              <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Last Updated</span>
                  <span className="font-medium text-foreground">{new Date().toLocaleTimeString()}</span>
              </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function DocCard({
  icon, title, subtitle, file, onFile, accept, capture, disabled,
}: {
  icon: React.ReactNode; title: string; subtitle: string; file: File | null;
  onFile: (f: File | null) => void; accept: string; capture?: boolean; disabled?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <button
      type="button"
      onClick={() => !disabled && ref.current?.click()}
      disabled={disabled}
      className="flex w-full items-center gap-4 rounded-xl border bg-card p-5 text-left shadow-sm transition-all hover:border-primary/50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="font-bold">{title}</div>
        <div className="truncate text-xs text-muted-foreground">{file ? file.name : subtitle}</div>
      </div>
      <div className="shrink-0">
        {file ? (
            <div className="rounded-full bg-status-verified/10 px-2 py-1 text-[10px] font-bold text-status-verified">READY</div>
        ) : (
            <div className="rounded-full bg-muted px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase">UPLOAD</div>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept={accept}
        {...(capture ? { capture: "environment" as const } : {})}
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
    </button>
  );
}

export default DocumentsPage;

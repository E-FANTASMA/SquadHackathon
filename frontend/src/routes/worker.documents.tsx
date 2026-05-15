import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useLedgerStore } from "@/store/ledgerStore";
import { useFeedStore } from "@/store/feedStore";
import { workerService } from "@/services/api";
import { ScoreBreakdown } from "@/components/common/ScoreBreakdown";
import { StatusPill } from "@/components/common/StatusPill";
import { FileText, ImageIcon, Lock, Upload } from "lucide-react";
import { toast } from "sonner";
import { calcScore, statusFromScore, MAX_SCORE, type VerificationChecks } from "@/lib/scoring";


function DocumentsPage() {
  const user = useAuthStore((s) => s.user);
  const employee = user?.matchedEmployeeId ? useLedgerStore((s) => s.employees.find((e) => e.id === user.matchedEmployeeId)) : undefined;
  const pushFeed = useFeedStore((s) => s.push);

  const [statementFile, setStatementFile] = useState<File | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [tally, setTally] = useState<number | null>(null);

  if (!user?.matchedEmployeeId || !employee) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center sm:max-w-xl">
        <h1 className="text-xl font-semibold">Claim your record first</h1>
        <p className="mt-2 text-sm text-muted-foreground">You need to match a payroll record before uploading documents.</p>
        <Button asChild className="mt-5"><Link to="/worker/claim">Go to claim wizard</Link></Button>
      </div>
    );
  }

  const locked = employee.verificationStatus === "rejected" && !employee.override;

  const submit = () => {
    if (!statementFile && !screenshotFile) return toast.error("Upload at least one document");
    // Simulated AI scoring: each upload awards a check
    const newChecks: VerificationChecks = {
      ninVerified: true,
      nameMatch: true,
      statementValid: !!statementFile,
      screenshotMatch: !!screenshotFile,
      receiptMatch: !!screenshotFile,
      txnRefValid: !!statementFile && !!screenshotFile,
    };
    const finalScore = calcScore(newChecks);
    runTally(finalScore, async () => {
      await workerService.submitDocuments(employee.id, newChecks);
      pushFeed({ kind: "info", message: `Worker submitted documents · ${employee.id} · score ${finalScore}` });
      const status = statusFromScore(finalScore, true);
      if (status === "verified") toast.success(`Verified! Trust score ${finalScore}/${MAX_SCORE}`);
      else if (status === "flagged") toast.warning(`Flagged for review · score ${finalScore}/${MAX_SCORE}`);
      else toast.error(`Rejected · score ${finalScore}/${MAX_SCORE}`);
    });
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
        setTimeout(() => { done(); setTally(null); }, 600);
      }
    }, 50);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-6 sm:max-w-2xl sm:py-10">
      <header className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">My Documents</h1>
          <p className="text-sm text-muted-foreground">Upload your bank statement and a transaction screenshot.</p>
        </div>
        <StatusPill status={employee.verificationStatus} />
      </header>

      {locked && (
        <div className="mb-5 rounded-xl border p-4 text-sm" style={{ background: "color-mix(in oklab, var(--status-rejected) 10%, transparent)", borderColor: "color-mix(in oklab, var(--status-rejected) 35%, transparent)", color: "var(--status-rejected)" }}>
          <div className="flex items-center gap-2 font-semibold"><Lock className="h-4 w-4" /> Uploads locked</div>
          <p className="mt-1">Your trust score is below 50. To unlock further uploads, please file an appeal with your administrator.</p>
          <Button asChild className="mt-3 w-full" variant="secondary"><Link to="/worker/appeal">Request appeal</Link></Button>
        </div>
      )}

      <div className="space-y-4">
        <DocCard
          icon={<FileText className="h-6 w-6" />}
          title="Bank Statement"
          subtitle="PDF · last 3 months"
          file={statementFile}
          onFile={setStatementFile}
          accept="application/pdf"
          disabled={locked}
        />
        <DocCard
          icon={<ImageIcon className="h-6 w-6" />}
          title="Transaction Screenshot"
          subtitle="Image · most recent salary credit"
          file={screenshotFile}
          onFile={setScreenshotFile}
          accept="image/*"
          capture
          disabled={locked}
        />
      </div>

      <Button className="mt-5 h-12 w-full text-base" onClick={submit} disabled={locked || tally !== null}>
        <Upload className="h-4 w-4" /> Submit for AI verification
      </Button>

      {tally !== null && (
        <div className="mt-5 rounded-xl border bg-card p-5 text-center shadow-[var(--shadow-card)]">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">AI tallying your trust score…</div>
          <div className="mt-2 text-5xl font-semibold tabular-nums" style={{ color: "var(--primary)" }}>
            {tally}<span className="text-2xl text-muted-foreground">/{MAX_SCORE}</span>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-xl border bg-card p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-sm font-semibold">Current breakdown</h2>
        <div className="mt-3"><ScoreBreakdown checks={employee.checks} /></div>
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
      className="flex w-full items-center gap-4 rounded-xl border bg-card p-5 text-left shadow-[var(--shadow-card)] transition-colors hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{file ? file.name : subtitle}</div>
      </div>
      <span className="text-xs font-medium" style={{ color: file ? "var(--status-verified)" : "var(--muted-foreground)" }}>
        {file ? "Ready" : "Tap to upload"}
      </span>
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

import { useNavigate } from "@tanstack/react-router";
import { useWizardStore } from "@/store/wizardStore";
import { useLedgerStore } from "@/store/ledgerStore";
import { useFeedStore } from "@/store/feedStore";
import { naira, compactNaira } from "@/lib/format";
import { StatCard } from "@/components/common/StatCard";
import { LogicBadge } from "@/components/common/LogicBadge";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ShieldCheck, Wallet } from "lucide-react";

export function ReviewStep() {
  const navigate = useNavigate();
  const employees = useLedgerStore((s) => s.employees);
  const execute = useLedgerStore((s) => s.executeVerifiedPayments);
  const pushFeed = useFeedStore((s) => s.push);
  const reset = useWizardStore((s) => s.reset);
  const agency = useWizardStore((s) => s.agency);

  const totalPayroll = employees.reduce((s, e) => s + e.salary, 0);
  const flagged = employees.filter((e) => e.riskScore >= 70 && !e.override);
  const ready = employees.filter((e) => !(e.riskScore >= 70 && !e.override));
  const verifiedAmount = ready.reduce((s, e) => s + e.salary, 0);
  const savings = flagged.reduce((s, e) => s + e.salary, 0);

  const onAuthorize = () => {
    const n = execute();
    pushFeed({
      kind: "released",
      message: `Squad batch executed for ${agency || "audit run"} · ${n} transfers released`,
    });
    reset();
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Final review &amp; Squad authorization</h2>
        <p className="text-sm text-muted-foreground">
          The AI has cleared {ready.length} workers and locked {flagged.length} for manual review.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard
          label="Total Payroll"
          value={compactNaira(totalPayroll)}
          hint={naira(totalPayroll)}
          icon={<Wallet className="h-4 w-4" />}
        />
        <StatCard
          label="Verified Amount"
          value={compactNaira(verifiedAmount)}
          hint="Cleared for Squad disbursement"
          tone="success"
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <StatCard
          label="Potential Savings"
          value={compactNaira(savings)}
          hint="Fraud prevented before disbursement"
          tone="danger"
          icon={<ShieldAlert className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Bucket
          tone="success"
          title="Ready for Squad disbursement"
          count={ready.length}
          subtitle={`${compactNaira(verifiedAmount)} cleared`}
        />
        <Bucket
          tone="danger"
          title="Flagged for manual review"
          count={flagged.length}
          subtitle={`${compactNaira(savings)} held by AI`}
        />
      </div>

      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between">
        <LogicBadge
          locked={flagged.length > 0}
          reason={
            flagged.length > 0
              ? `${flagged.length} record(s) · Risk Score > 70`
              : "All records cleared by AI"
          }
        />
        <Button size="lg" onClick={onAuthorize}>
          Authorize Disbursement via Squad
        </Button>
      </div>
    </div>
  );
}

function Bucket({
  tone,
  title,
  count,
  subtitle,
}: {
  tone: "success" | "danger";
  title: string;
  count: number;
  subtitle: string;
}) {
  const color = tone === "success" ? "var(--squad-released)" : "var(--squad-locked)";
  return (
    <div
      className="rounded-lg border p-4"
      style={{
        borderColor: `color-mix(in oklab, ${color} 30%, transparent)`,
        background: `color-mix(in oklab, ${color} 6%, transparent)`,
      }}
    >
      <div className="text-xs uppercase tracking-wider" style={{ color }}>
        {title}
      </div>
      <div className="mt-1 text-3xl font-semibold tabular-nums">{count}</div>
      <div className="text-xs text-muted-foreground">{subtitle}</div>
    </div>
  );
}

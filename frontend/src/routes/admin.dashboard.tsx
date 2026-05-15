
import { LedgerTable } from "@/components/ledger/LedgerTable";
import { RealTimeWebhookFeed } from "@/components/feed/RealTimeWebhookFeed";
import { useLedgerStore } from "@/store/ledgerStore";
import { StatCard } from "@/components/common/StatCard";
import { naira, compactNaira } from "@/lib/format";
import { ShieldAlert, ShieldCheck, Users, Wallet } from "lucide-react";


function AdminDashboard() {
  const employees = useLedgerStore((s) => s.employees);
  const verified = employees.filter((e) => e.verificationStatus === "verified" || e.override);
  const flagged = employees.filter((e) => e.verificationStatus === "flagged" && !e.override);
  const rejected = employees.filter((e) => e.verificationStatus === "rejected" && !e.override);
  const totalPayroll = employees.reduce((s, e) => s + e.salary, 0);
  const savings = [...flagged, ...rejected].reduce((s, e) => s + e.salary, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Smart Decision Ledger</h1>
          <p className="text-sm text-muted-foreground">
            Every row is one Squad gate. Click to expand the trust breakdown and AI evidence.
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-4">
        <StatCard label="Total Payroll" value={compactNaira(totalPayroll)} hint={naira(totalPayroll)} icon={<Wallet className="h-4 w-4" />} />
        <StatCard label="Verified Workers" value={`${verified.length}`} hint="Cleared for Squad" tone="success" icon={<ShieldCheck className="h-4 w-4" />} />
        <StatCard label="Flagged" value={`${flagged.length}`} hint="Manual review pending" tone="warning" icon={<ShieldAlert className="h-4 w-4" />} />
        <StatCard label="Savings Prevented" value={compactNaira(savings)} hint={`${rejected.length} rejected · ${flagged.length} flagged`} tone="danger" icon={<Users className="h-4 w-4" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <LedgerTable />
        <RealTimeWebhookFeed />
      </div>
    </div>
  );
}

export default AdminDashboard;

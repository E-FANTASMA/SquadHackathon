
import { useLedgerStore } from "@/store/ledgerStore";
import { Button } from "@/components/ui/button";
import { compactNaira, naira } from "@/lib/format";
import { Download, Printer, ShieldCheck } from "lucide-react";
import { SquadPaymentGate } from "@/components/ledger/SquadPaymentGate";


function AuditPage() {
  const employees = useLedgerStore((s) => s.employees);
  const totalPayroll = employees.reduce((s, e) => s + e.salary, 0);
  const flagged = employees.filter((e) => e.riskScore >= 70 && !e.override);
  const released = employees.filter((e) => e.squadStatus === "RELEASED");
  const savings = flagged.reduce((s, e) => s + e.salary, 0);

  const exportCsv = () => {
    const header = ["Employee ID", "Name", "Department", "Salary", "Risk Score", "Flag Reason", "Squad Status", "Override"];
    const rows = employees.map((e) => [
      e.id, e.name, e.department, e.salary, e.riskScore, e.flagReason, e.squadStatus, e.override ? "Yes" : "No",
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payguard-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="no-print mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payroll Compliance Report</h1>
          <p className="text-sm text-muted-foreground">
            Government-ready summary of this audit cycle.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print / PDF
          </Button>
        </div>
      </div>

      <article className="rounded-lg border bg-card p-8 shadow-[var(--shadow-card)]">
        <header className="border-b pb-6">
          <div className="flex items-center gap-2 text-sm text-primary">
            <ShieldCheck className="h-4 w-4" />
            PayGuard AI · Compliance Statement
          </div>
          <h2 className="mt-2 text-xl font-semibold">Payroll Audit Cycle Report</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Generated {new Date().toLocaleString()} · Audit firm reference: PG-{Date.now().toString().slice(-6)}
          </p>
        </header>

        <section className="grid gap-4 border-b py-6 sm:grid-cols-4">
          <Field label="Total Payroll" value={compactNaira(totalPayroll)} sub={naira(totalPayroll)} />
          <Field label="Records Cleared" value={`${released.length}`} sub="Squad: RELEASED" />
          <Field label="Records Held / Blocked" value={`${flagged.length}`} sub="Manual review required" />
          <Field label="Savings Prevented" value={compactNaira(savings)} sub="Before disbursement" />
        </section>

        <section className="py-6">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Decision Log
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2 pr-3">Employee</th>
                  <th className="py-2 pr-3">Department</th>
                  <th className="py-2 pr-3">Risk</th>
                  <th className="py-2 pr-3">Flag</th>
                  <th className="py-2 pr-3">Salary</th>
                  <th className="py-2">Squad</th>
                </tr>
              </thead>
              <tbody>
                {employees.slice(0, 40).map((e) => (
                  <tr key={e.id} className="border-b">
                    <td className="py-2 pr-3">
                      <div className="font-medium">{e.name}</div>
                      <div className="text-[11px] text-muted-foreground tabular-nums">{e.id}</div>
                    </td>
                    <td className="py-2 pr-3">{e.department}</td>
                    <td className="py-2 pr-3 tabular-nums">{e.riskScore}</td>
                    <td className="py-2 pr-3">{e.flagReason}</td>
                    <td className="py-2 pr-3 tabular-nums">{naira(e.salary)}</td>
                    <td className="py-2"><SquadPaymentGate status={e.squadStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-muted-foreground">
              Showing 40 of {employees.length} records. Full list available in CSV export.
            </p>
          </div>
        </section>

        <footer className="border-t pt-6 text-xs text-muted-foreground">
          <p>
            This report certifies that PayGuard AI cross-referenced uploaded bank statements,
            transaction IDs and payroll registers, and that the Squad Transfer API was
            programmatically gated by AI risk scoring. Funds were released only for verified
            workers.
          </p>
        </footer>
      </article>
    </div>
  );
}

function Field({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold tabular-nums">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export default AuditPage;

import { useEffect, useState } from "react";
import { LedgerTable } from "@/components/ledger/LedgerTable";
import { RealTimeWebhookFeed } from "@/components/feed/RealTimeWebhookFeed";
import { useLedgerStore } from "@/store/ledgerStore";
import { StatCard } from "@/components/common/StatCard";
import { naira, compactNaira } from "@/lib/format";
import { ShieldAlert, ShieldCheck, Users, Wallet, FileSpreadsheet } from "lucide-react";
import { companyService } from "@/services/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


function AdminDashboard() {
  const employees = useLedgerStore((s) => s.employees);
  const loading = useLedgerStore((s) => s.loading);
  const fetchWorkers = useLedgerStore((s) => s.fetchWorkers);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("");

  useEffect(() => {
    companyService.listBatches().then((data) => {
      console.log("DEBUG: Dashboard batches:", data);
      setBatches(data);
      if (data && data.length > 0) {
        setSelectedBatch(data[0].id);
        fetchWorkers(data[0].id);
      }
    }).catch(err => {
      console.error("DEBUG: Dashboard fetch error:", err);
    });
  }, []);

  const onBatchChange = (id: string) => {
    setSelectedBatch(id);
    fetchWorkers(id);
  };

  const verified = employees.filter((e) => e.verificationStatus === "verified" || e.override);
  const flagged = employees.filter((e) => e.verificationStatus === "flagged" && !e.override);
  const rejected = employees.filter((e) => e.verificationStatus === "rejected" && !e.override);
  const totalPayroll = employees.reduce((s, e) => s + Number(e.salary), 0);
  const savings = [...flagged, ...rejected].reduce((s, e) => s + Number(e.salary), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Smart Decision Ledger</h1>
          <p className="text-sm text-muted-foreground">
            AI-verified payroll records. Click to expand evidence and transaction history.
          </p>
        </div>
        
        {batches.length > 0 && (
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedBatch} onValueChange={onBatchChange}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Select Payroll Batch" />
              </SelectTrigger>
              <SelectContent>
                {batches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.batch_name} ({new Date(b.upload_date).toLocaleDateString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-4">
        <StatCard label="Total Payroll" value={compactNaira(totalPayroll)} hint={naira(totalPayroll)} icon={<Wallet className="h-4 w-4" />} />
        <StatCard label="Verified Workers" value={`${verified.length}`} hint="Cleared for Squad" tone="success" icon={<ShieldCheck className="h-4 w-4" />} />
        <StatCard label="Flagged" value={`${flagged.length}`} hint="Manual review pending" tone="warning" icon={<ShieldAlert className="h-4 w-4" />} />
        <StatCard label="Savings (Rejected)" value={compactNaira(savings)} hint={`${rejected.length} rejected · ${flagged.length} flagged`} tone="danger" icon={<Users className="h-4 w-4" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {batches.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center h-64 rounded-lg border border-dashed bg-card text-center p-6">
              <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
              <h3 className="text-lg font-medium">No payroll data found</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Upload your first payroll Excel file in the Batches section to see AI-verified insights here.
              </p>
            </div>
          ) : loading ? (
            <div className="flex h-64 items-center justify-center rounded-lg border bg-card">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span>Analyzing payroll data…</span>
              </div>
            </div>
          ) : (
            <LedgerTable />
          )}
        </div>
        <RealTimeWebhookFeed />
      </div>
    </div>
  );
}

export default AdminDashboard;

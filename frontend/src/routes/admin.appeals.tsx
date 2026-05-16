import { useState, useEffect } from "react";
import { useLedgerStore } from "@/store/ledgerStore";
import { useFeedStore } from "@/store/feedStore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusPill } from "@/components/common/StatusPill";
import { ScoreBreakdown } from "@/components/common/ScoreBreakdown";
import { companyService } from "@/services/api";
import { Inbox, Paperclip, RefreshCw } from "lucide-react";
import { toast } from "sonner";


function AppealsPage() {
  const [appeals, setAppeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const employees = useLedgerStore((s) => s.employees);
  const pushFeed = useFeedStore((s) => s.push);

  const fetchAppeals = async () => {
    setLoading(true);
    try {
      const data = await companyService.listAppeals();
      setAppeals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppeals();
  }, []);

  const open = appeals.filter((a) => a.status === "pending");
  const closed = appeals.filter((a) => a.status !== "pending");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <Inbox className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Appeals Inbox</h1>
            <p className="text-sm text-muted-foreground">{open.length} open · {closed.length} resolved</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAppeals} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading && appeals.length === 0 ? (
        <div className="flex justify-center p-12"><RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : open.length === 0 ? (
        <div className="rounded-lg border bg-card p-10 text-center text-sm text-muted-foreground">
          No open appeals. When a worker is rejected, their appeal will land here.
        </div>
      ) : (
        <ul className="space-y-4">
          {open.map((a) => (
            <AppealItem
              key={a.id}
              appeal={a}
              employee={employees.find((e) => e.id === a.payroll_worker_id)}
              onResolve={async (status) => {
                try {
                  await companyService.updateWorkerStatus({ 
                    workerRecordId: a.payroll_worker_id, 
                    status: status === 'approved' ? 'verified' : 'rejected' 
                  });
                  // Ideally we also update appeal status in backend, but updateWorkerStatus is core.
                  // For this hackathon, we'll refresh list.
                  toast.success(`Appeal ${status}`);
                  pushFeed({ kind: status === 'approved' ? "override" : "blocked", message: `Appeal ${status} · ${a.workers?.full_name}` });
                  fetchAppeals();
                } catch (err: any) {
                  toast.error(err.message || "Resolution failed");
                }
              }}
            />
          ))}
        </ul>
      )}

      {closed.length > 0 && (
        <>
          <h2 className="mt-10 mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Resolved</h2>
          <ul className="space-y-2">
            {closed.map((a) => (
              <li key={a.id} className="flex items-center justify-between rounded-md border bg-card p-3 text-sm">
                <div>
                  <div className="font-medium">{a.workers?.full_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {a.id.slice(0,8)} · {a.status} · {new Date(a.created_at).toLocaleDateString()}
                  </div>
                </div>
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize"
                  style={{
                    color: a.status === "approved" ? "var(--status-verified)" : "var(--status-rejected)",
                    background: `color-mix(in oklab, ${a.status === "approved" ? "var(--status-verified)" : "var(--status-rejected)"} 14%, transparent)`,
                  }}
                >
                  {a.status}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function AppealItem({
  appeal,
  employee,
  onResolve,
}: {
  appeal: any;
  employee?: any;
  onResolve: (status: "approved" | "rejected") => void;
}) {
  const [note, setNote] = useState("");
  return (
    <li className="rounded-lg border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold">{appeal.workers?.full_name}</h3>
            {employee && <StatusPill status={employee.verificationStatus} />}
          </div>
          <div className="text-xs text-muted-foreground">
            {appeal.id.slice(0,8)} · filed {new Date(appeal.created_at).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Worker message</div>
          <p className="mt-1 rounded-md border bg-background p-3 text-sm whitespace-pre-wrap">{appeal.reason}</p>
        </div>
        {employee && (
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Current trust breakdown</div>
            <div className="mt-2"><ScoreBreakdown checks={employee.checks} /></div>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <Textarea placeholder="Reviewer note (optional)" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onResolve("approved")} className="bg-[color:var(--status-verified)] hover:bg-[color:var(--status-verified)]/90">Approve & Verify</Button>
          <Button variant="outline" onClick={() => onResolve("rejected")} className="text-[color:var(--status-rejected)] border-[color:var(--status-rejected)] hover:bg-[color:var(--status-rejected)]/10">Reject Appeal</Button>
        </div>
      </div>
    </li>
  );
}

export default AppealsPage;

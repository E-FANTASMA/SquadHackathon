
import { useState } from "react";
import { useAppealStore } from "@/store/appealStore";
import { useLedgerStore } from "@/store/ledgerStore";
import { useFeedStore } from "@/store/feedStore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusPill } from "@/components/common/StatusPill";
import { ScoreBreakdown } from "@/components/common/ScoreBreakdown";
import { Inbox, Paperclip } from "lucide-react";
import { toast } from "sonner";


function AppealsPage() {
  const appeals = useAppealStore((s) => s.appeals);
  const resolve = useAppealStore((s) => s.resolve);
  const employees = useLedgerStore((s) => s.employees);
  const setOverride = useLedgerStore((s) => s.setOverride);
  const pushFeed = useFeedStore((s) => s.push);

  const open = appeals.filter((a) => a.status === "open");
  const closed = appeals.filter((a) => a.status !== "open");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
          <Inbox className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Appeals Inbox</h1>
          <p className="text-sm text-muted-foreground">{open.length} open · {closed.length} resolved</p>
        </div>
      </div>

      {open.length === 0 ? (
        <div className="rounded-lg border bg-card p-10 text-center text-sm text-muted-foreground">
          No open appeals. When a worker is rejected, their appeal will land here.
        </div>
      ) : (
        <ul className="space-y-3">
          {open.map((a) => (
            <AppealItem
              key={a.id}
              appeal={a}
              employee={a.employeeId ? employees.find((e) => e.id === a.employeeId) : undefined}
              onApprove={(note) => {
                if (a.employeeId) setOverride(a.employeeId, true);
                resolve(a.id, "approved", note);
                pushFeed({ kind: "override", message: `Appeal approved · ${a.workerName}` });
                toast.success("Appeal approved · worker re-verified");
              }}
              onReject={(note) => {
                resolve(a.id, "rejected", note);
                pushFeed({ kind: "blocked", message: `Appeal rejected · ${a.workerName}` });
                toast.error("Appeal rejected");
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
                  <div className="font-medium">{a.workerName}</div>
                  <div className="text-xs text-muted-foreground">
                    {a.id} · {a.status} · {a.resolvedAt ? new Date(a.resolvedAt).toLocaleDateString() : ""}
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
  onApprove,
  onReject,
}: {
  appeal: ReturnType<typeof useAppealStore.getState>["appeals"][number];
  employee?: ReturnType<typeof useLedgerStore.getState>["employees"][number];
  onApprove: (note: string) => void;
  onReject: (note: string) => void;
}) {
  const [note, setNote] = useState("");
  return (
    <li className="rounded-lg border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold">{appeal.workerName}</h3>
            {employee && <StatusPill status={employee.verificationStatus} />}
          </div>
          <div className="text-xs text-muted-foreground">
            {appeal.id} · filed {new Date(appeal.createdAt).toLocaleString()}
            {employee && ` · ${employee.id}`}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Worker message</div>
          <p className="mt-1 rounded-md border bg-background p-3 text-sm">{appeal.message}</p>
          {appeal.supportingDocName && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-xs">
              <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-mono">{appeal.supportingDocName}</span>
            </div>
          )}
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
          <Button onClick={() => onApprove(note)}>Approve & Re-verify</Button>
          <Button variant="outline" onClick={() => onReject(note)}>Reject Appeal</Button>
        </div>
      </div>
    </li>
  );
}

export default AppealsPage;

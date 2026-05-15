import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useLedgerStore } from "@/store/ledgerStore";
import { useAppealStore } from "@/store/appealStore";
import { StatusPill } from "@/components/common/StatusPill";
import { ScoreBreakdown } from "@/components/common/ScoreBreakdown";
import { Button } from "@/components/ui/button";
import { naira } from "@/lib/format";
import { STATUS_META, MAX_SCORE } from "@/lib/scoring";
import { ArrowRight, FileSearch, Upload, MessageSquareWarning } from "lucide-react";


function WorkerHome() {
  const user = useAuthStore((s) => s.user);
  const employees = useLedgerStore((s) => s.employees);
  const appeals = useAppealStore((s) => s.appeals);
  const employee = user?.matchedEmployeeId ? employees.find((e) => e.id === user.matchedEmployeeId) : undefined;

  const status = employee?.verificationStatus ?? "pending";
  const meta = STATUS_META[status];
  const myAppeals = appeals.filter((a) => a.workerId === user?.id);

  return (
    <div className="mx-auto max-w-md px-4 py-6 sm:max-w-2xl sm:py-10">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Hi, {user?.fullName ?? "Worker"}</h1>
        <p className="text-sm text-muted-foreground">Here's where your verification stands.</p>
      </header>

      {/* Big status card */}
      <section
        className="rounded-2xl border p-6 shadow-[var(--shadow-card)]"
        style={{ background: meta.bg, borderColor: `color-mix(in oklab, ${meta.color} 35%, transparent)` }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wider opacity-80">Verification status</div>
            <div className="mt-1 flex items-center gap-2">
              <StatusPill status={status} size="lg" />
            </div>
            <p className="mt-3 text-sm" style={{ color: meta.color }}>{meta.description}</p>
          </div>
          {employee && (
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-wider opacity-80">Trust score</div>
              <div className="text-3xl font-semibold tabular-nums" style={{ color: meta.color }}>
                {employee.trustScore}<span className="text-base opacity-70">/{MAX_SCORE}</span>
              </div>
            </div>
          )}
        </div>

        {employee && (
          <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
            <Pair label="Salary on file" value={naira(employee.salary)} />
            <Pair label="Department" value={employee.department} />
          </div>
        )}
      </section>

      {/* Next-step CTA */}
      <section className="mt-6 grid gap-3">
        {!employee ? (
          <ActionCard
            icon={<FileSearch className="h-5 w-5" />}
            title="Claim your record"
            body="Match your NIN and account number against your employer's payroll."
            href="/worker/claim"
            cta="Start claim"
          />
        ) : status === "rejected" ? (
          <ActionCard
            icon={<MessageSquareWarning className="h-5 w-5" />}
            title="Submit an appeal"
            body="Your trust score was below 50. Uploads are locked. Send your auditor a message and proof to request a manual review."
            href="/worker/appeal"
            cta="Request appeal"
            tone="danger"
          />
        ) : (
          <ActionCard
            icon={<Upload className="h-5 w-5" />}
            title={status === "verified" ? "Add more proof (optional)" : "Submit your documents"}
            body="Upload your bank statement PDF and a transaction screenshot. The AI will tally your trust points live."
            href="/worker/documents"
            cta="Upload documents"
          />
        )}
      </section>

      {/* Trust breakdown */}
      {employee && (
        <section className="mt-6 rounded-xl border bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-semibold">Your trust breakdown</h2>
          <p className="mt-1 text-xs text-muted-foreground">Each check is awarded by the AI from your documents.</p>
          <div className="mt-4"><ScoreBreakdown checks={employee.checks} /></div>
        </section>
      )}

      {/* Appeals */}
      {myAppeals.length > 0 && (
        <section className="mt-6 rounded-xl border bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-semibold">Your appeals</h2>
          <ul className="mt-3 space-y-2">
            {myAppeals.map((a) => (
              <li key={a.id} className="flex items-center justify-between rounded-md border bg-background p-3 text-sm">
                <div>
                  <div className="font-medium capitalize">{a.status}</div>
                  <div className="text-xs text-muted-foreground">{a.id} · {new Date(a.createdAt).toLocaleDateString()}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background/70 p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-medium tabular-nums">{value}</div>
    </div>
  );
}

function ActionCard({ icon, title, body, href, cta, tone }: { icon: React.ReactNode; title: string; body: string; href: string; cta: string; tone?: "danger" }) {
  return (
    <Link to={href} className="block rounded-xl border bg-card p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elegant)]">
      <div className="flex items-start gap-3">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
          style={{
            background: tone === "danger" ? "color-mix(in oklab, var(--status-rejected) 14%, transparent)" : "color-mix(in oklab, var(--primary) 14%, transparent)",
            color: tone === "danger" ? "var(--status-rejected)" : "var(--primary)",
          }}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{body}</p>
        </div>
        <Button size="sm" variant="ghost" className="self-center">{cta} <ArrowRight className="h-4 w-4" /></Button>
      </div>
    </Link>
  );
}

export default WorkerHome;

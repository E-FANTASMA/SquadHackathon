import { Link, useParams } from "react-router-dom";
import { useBatchStore } from "@/store/batchStore";
import { Button } from "@/components/ui/button";
import { naira } from "@/lib/format";
import { AlertTriangle, ArrowLeft, RefreshCcw } from "lucide-react";


const FIXES: Record<string, string[]> = {
  WALLET_INSUFFICIENT: [
    "Top up the Squad wallet before retrying.",
    "Verify the Squad merchant account is funded in the Squad dashboard.",
    "Check that no other batch is currently draining the wallet.",
  ],
  INVALID_RECIPIENT: [
    "Confirm the recipient's 10-digit NUBAN account is correct.",
    "Confirm the bank code matches the recipient's bank.",
    "Re-run NIBSS account-name verification before retrying.",
  ],
  SQUAD_TIMEOUT: [
    "Retry once after 60 seconds.",
    "Check Squad's status page for ongoing incidents.",
    "If the issue persists, contact Squad support with the reference below.",
  ],
  DUPLICATE_REF: [
    "A transfer with this reference was already posted in the current cycle.",
    "Generate a fresh reference and re-attempt the transfer.",
    "Check the Squad dashboard to confirm the original transfer's final state.",
  ],
};

function FailurePage() {
  const { ref = "" } = useParams<{ ref: string }>();
  const failure = useBatchStore((s) => s.getFailure(ref));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-2xl border bg-card p-8 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl" style={{ background: "color-mix(in oklab, var(--status-rejected) 14%, transparent)", color: "var(--status-rejected)" }}>
            <AlertTriangle className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-xl font-semibold">Transaction Failed</h1>
            <p className="text-sm text-muted-foreground">Squad rejected the request. Funds were not moved.</p>
          </div>
        </div>

        {failure ? (
          <>
            <dl className="mt-6 grid gap-3 rounded-lg border bg-background p-4 text-sm sm:grid-cols-2">
              <Item label="Squad reference" value={failure.ref} />
              <Item label="Error code" value={failure.code} tone="danger" />
              <Item label="Amount" value={naira(failure.amount)} />
              <Item label="When" value={new Date(failure.ts).toLocaleString()} />
              <div className="sm:col-span-2">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Squad message</div>
                <div className="mt-1 rounded-md border bg-muted/30 p-3 font-mono text-xs">{failure.message}</div>
              </div>
            </dl>

            <h2 className="mt-6 text-sm font-semibold">How to fix it</h2>
            <ol className="mt-3 space-y-2">
              {(FIXES[failure.code] ?? ["Retry the transaction. If it fails again, contact Squad support with the reference above."]).map((tip, i) => (
                <li key={i} className="flex gap-3 rounded-md border bg-background p-3 text-sm">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-primary text-xs font-semibold">{i + 1}</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">
            No failure record found for reference <span className="font-mono">{ref}</span>. It may have been cleared from this session.
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/admin/wallet"><ArrowLeft className="h-4 w-4" /> Back to Wallet</Link>
          </Button>
          <Button asChild>
            <Link to="/admin/wallet"><RefreshCcw className="h-4 w-4" /> Retry funding</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Item({ label, value, tone }: { label: string; value: string; tone?: "danger" }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-sm tabular-nums" style={{ color: tone === "danger" ? "var(--status-rejected)" : undefined }}>{value}</div>
    </div>
  );
}

export default FailurePage;

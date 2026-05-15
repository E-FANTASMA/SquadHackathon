import { Check, X } from "lucide-react";
import {
  CHECK_LABELS,
  CHECK_WEIGHTS,
  MAX_SCORE,
  calcScore,
  type VerificationChecks,
} from "@/lib/scoring";

export function ScoreBreakdown({
  checks,
  editable,
  onToggle,
}: {
  checks: VerificationChecks;
  editable?: boolean;
  onToggle?: (key: keyof VerificationChecks, value: boolean) => void;
}) {
  const score = calcScore(checks);
  const pct = (score / MAX_SCORE) * 100;
  const keys = Object.keys(CHECK_WEIGHTS) as (keyof VerificationChecks)[];

  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Trust Score
          </span>
          <span className="tabular-nums text-lg font-semibold">
            {score}
            <span className="text-sm text-muted-foreground"> / {MAX_SCORE}</span>
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              background:
                score >= 80
                  ? "var(--status-verified)"
                  : score >= 50
                    ? "var(--status-flagged)"
                    : "var(--status-rejected)",
            }}
          />
        </div>
      </div>

      <ul className="grid gap-1.5 sm:grid-cols-2">
        {keys.map((k) => {
          const ok = checks[k];
          return (
            <li
              key={k}
              className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${
                editable ? "cursor-pointer hover:bg-muted/40" : ""
              }`}
              onClick={editable ? () => onToggle?.(k, !ok) : undefined}
            >
              <div className="flex items-center gap-2">
                <span
                  className="grid h-5 w-5 place-items-center rounded-full"
                  style={{
                    background: ok
                      ? "color-mix(in oklab, var(--status-verified) 20%, transparent)"
                      : "color-mix(in oklab, var(--status-rejected) 18%, transparent)",
                    color: ok ? "var(--status-verified)" : "var(--status-rejected)",
                  }}
                >
                  {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                </span>
                <span>{CHECK_LABELS[k]}</span>
              </div>
              <span
                className="tabular-nums text-xs font-medium"
                style={{ color: ok ? "var(--status-verified)" : "var(--muted-foreground)" }}
              >
                {ok ? "+" : ""}
                {ok ? CHECK_WEIGHTS[k] : 0}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

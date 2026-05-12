import { useEffect, useState } from "react";
import { useWizardStore } from "@/store/wizardStore";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const TASKS = [
  "Parsing bank statement PDFs",
  "Matching BVN/NIN against payroll roster",
  "Cross-referencing transaction IDs",
  "Detecting smart fraud patterns",
] as const;

export function AnalyzeStep() {
  const setRiskConfidence = useWizardStore((s) => s.setRiskConfidence);
  const riskConfidence = useWizardStore((s) => s.riskConfidence);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (riskConfidence !== null) {
      setProgress(TASKS.length);
      return;
    }
    let i = 0;
    const t = setInterval(() => {
      i++;
      setProgress(i);
      if (i >= TASKS.length) {
        clearInterval(t);
        setTimeout(() => setRiskConfidence(91), 400);
      }
    }, 900);
    return () => clearInterval(t);
  }, [riskConfidence, setRiskConfidence]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">AI analysis in progress</h2>
        <p className="text-sm text-muted-foreground">
          Behavioral checks running across uploaded documents. The Squad gate stays locked until
          analysis completes.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <div className="rounded-lg border bg-card p-4 shadow-[var(--shadow-card)]">
          <ul className="space-y-3">
            {TASKS.map((task, i) => {
              const done = i < progress;
              const active = i === progress && riskConfidence === null;
              return (
                <li key={task} className="flex items-center gap-3 text-sm">
                  <span
                    className={cn(
                      "grid h-7 w-7 place-items-center rounded-full",
                      done
                        ? "bg-[color:var(--squad-released)] text-white"
                        : active
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {done ? (
                      <Check className="h-4 w-4" />
                    ) : active ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <span className="text-xs">{i + 1}</span>
                    )}
                  </span>
                  <span
                    className={cn(
                      done && "text-muted-foreground line-through",
                      active && "font-medium",
                    )}
                  >
                    {task}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="rounded-lg border bg-[var(--gradient-trust)] p-4 text-center shadow-[var(--shadow-card)]">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Risk Confidence
          </div>
          <div className="mt-2 text-5xl font-semibold tabular-nums text-primary">
            {riskConfidence !== null ? `${riskConfidence}%` : "—"}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {riskConfidence !== null
              ? "Analysis ready. You may proceed to review."
              : "Streaming preliminary score…"}
          </div>
        </div>
      </div>
    </div>
  );
}

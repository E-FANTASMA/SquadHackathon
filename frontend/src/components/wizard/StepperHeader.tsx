import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Scope", "Ingest", "Analyze", "Review"] as const;

export function StepperHeader({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-2">
      {STEPS.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs font-semibold transition-colors",
                done && "border-transparent bg-[color:var(--squad-released)] text-white",
                active && "border-primary bg-primary text-primary-foreground pulse-ring",
                !done && !active && "bg-muted text-muted-foreground",
              )}
            >
              {done ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <div className="hidden sm:block">
              <div
                className={cn(
                  "text-xs uppercase tracking-wider",
                  active ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                Step {i + 1}
              </div>
              <div className="text-sm font-medium">{label}</div>
            </div>
            {i < STEPS.length - 1 && (
              <div className="ml-2 h-px flex-1 bg-border" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}

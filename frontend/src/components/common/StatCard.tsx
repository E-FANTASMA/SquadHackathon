import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneVar =
    tone === "success"
      ? "var(--squad-released)"
      : tone === "warning"
        ? "var(--squad-held)"
        : tone === "danger"
          ? "var(--squad-locked)"
          : "var(--primary)";
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 shadow-[var(--shadow-card)]",
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {icon && (
          <span
            className="grid h-8 w-8 place-items-center rounded-md"
            style={{
              background: `color-mix(in oklab, ${toneVar} 12%, transparent)`,
              color: toneVar,
            }}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

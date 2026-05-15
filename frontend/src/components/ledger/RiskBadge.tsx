import { cn } from "@/lib/utils";

export function RiskBadge({ score }: { score: number }) {
  const tier = score < 30 ? "low" : score < 70 ? "medium" : "high";
  const color =
    tier === "low"
      ? "var(--risk-low)"
      : tier === "medium"
        ? "var(--risk-medium)"
        : "var(--risk-high)";
  const label = tier === "low" ? "Low" : tier === "medium" ? "Medium" : "High";
  return (
    <div className="flex items-center gap-2">
      <div
        className="grid h-9 w-9 place-items-center rounded-full text-[11px] font-semibold tabular-nums text-white"
        style={{
          background: `conic-gradient(${color} ${score * 3.6}deg, color-mix(in oklab, ${color} 18%, transparent) 0)`,
        }}
      >
        <span
          className="grid h-7 w-7 place-items-center rounded-full"
          style={{ background: "var(--card)", color: "var(--foreground)" }}
        >
          {score}
        </span>
      </div>
      <span
        className={cn("text-xs font-medium")}
        style={{ color }}
      >
        {label}
      </span>
    </div>
  );
}

import { Lock } from "lucide-react";

export function LogicBadge({
  locked,
  reason,
}: {
  locked: boolean;
  reason: string;
}) {
  const color = locked ? "var(--squad-locked)" : "var(--squad-released)";
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
      style={{
        borderColor: `color-mix(in oklab, ${color} 35%, transparent)`,
        background: `color-mix(in oklab, ${color} 10%, transparent)`,
        color,
      }}
    >
      <Lock className="h-3.5 w-3.5" />
      {locked ? "Squad API Locked" : "Squad API Cleared"} · {reason}
    </div>
  );
}

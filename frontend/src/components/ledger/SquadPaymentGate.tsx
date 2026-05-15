import { Lock, LockOpen, PauseCircle } from "lucide-react";
import type { SquadStatus } from "@/lib/mockData";

export function SquadPaymentGate({ status }: { status: SquadStatus }) {
  const map = {
    RELEASED: { Icon: LockOpen, color: "var(--squad-released)", label: "Released" },
    HELD: { Icon: PauseCircle, color: "var(--squad-held)", label: "Held" },
    BLOCKED: { Icon: Lock, color: "var(--squad-locked)", label: "Blocked" },
  } as const;
  const { Icon, color, label } = map[status];
  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium"
      style={{
        borderColor: `color-mix(in oklab, ${color} 35%, transparent)`,
        background: `color-mix(in oklab, ${color} 10%, transparent)`,
        color,
      }}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
  );
}

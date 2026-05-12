import { STATUS_META, type VerificationStatus } from "@/lib/scoring";
import { CheckCircle2, Clock, ShieldAlert, XCircle } from "lucide-react";

const ICONS = {
  verified: CheckCircle2,
  pending: Clock,
  flagged: ShieldAlert,
  rejected: XCircle,
} as const;

export function StatusPill({
  status,
  size = "sm",
}: {
  status: VerificationStatus;
  size?: "sm" | "lg";
}) {
  const meta = STATUS_META[status];
  const Icon = ICONS[status];
  const padding = size === "lg" ? "px-3 py-1.5 text-sm" : "px-2 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${padding}`}
      style={{
        color: meta.color,
        background: meta.bg,
        borderColor: `color-mix(in oklab, ${meta.color} 35%, transparent)`,
      }}
    >
      <Icon className={size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5"} />
      {meta.label}
    </span>
  );
}

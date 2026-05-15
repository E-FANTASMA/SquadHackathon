import { useEffect } from "react";
import { useFeedStore, type FeedKind } from "@/store/feedStore";
import { Activity, CheckCircle2, Lock, PauseCircle, ShieldAlert } from "lucide-react";

const ICONS: Record<FeedKind, typeof Activity> = {
  released: CheckCircle2,
  paused: PauseCircle,
  blocked: Lock,
  override: ShieldAlert,
  info: Activity,
};

const COLORS: Record<FeedKind, string> = {
  released: "var(--squad-released)",
  paused: "var(--squad-held)",
  blocked: "var(--squad-locked)",
  override: "var(--primary)",
  info: "var(--muted-foreground)",
};

const SAMPLE: { kind: FeedKind; message: string }[] = [
  { kind: "released", message: "Squad transfer released · ₦142,000 → EMP-10042" },
  { kind: "paused", message: "AI paused payment · EMP-10118 · Risk 74" },
  { kind: "blocked", message: "Squad gate blocked · Shared Account ring detected" },
  { kind: "released", message: "Squad transfer released · ₦98,500 → EMP-10067" },
  { kind: "override", message: "Auditor override applied · EMP-10093" },
  { kind: "paused", message: "AI paused payment · EMP-10204 · Payday Pop-up" },
];

export function RealTimeWebhookFeed() {
  const events = useFeedStore((s) => s.events);
  const push = useFeedStore((s) => s.push);

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      push(SAMPLE[i % SAMPLE.length]);
      i++;
    }, 4200);
    return () => clearInterval(t);
  }, [push]);

  return (
    <div className="rounded-lg border bg-card shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--squad-released)] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--squad-released)]" />
          </span>
          <h3 className="text-sm font-semibold">Squad Webhook Feed</h3>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Live</span>
      </div>
      <ul className="max-h-[480px] divide-y overflow-y-auto">
        {events.map((e) => {
          const Icon = ICONS[e.kind];
          return (
            <li key={e.id} className="flex items-start gap-3 px-4 py-2.5">
              <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: COLORS[e.kind] }} />
              <div className="min-w-0 flex-1">
                <p className="text-xs leading-snug">{e.message}</p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(e.ts).toLocaleTimeString()}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

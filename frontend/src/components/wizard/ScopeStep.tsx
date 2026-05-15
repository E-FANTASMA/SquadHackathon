import { useWizardStore, type AgencyTier } from "@/store/wizardStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Building2, Landmark, Building } from "lucide-react";

const TIERS: { id: AgencyTier; label: string; size: string; icon: typeof Building }[] = [
  { id: "small", label: "Small Agency", size: "500 – 2,000 staff", icon: Building },
  { id: "state", label: "State Ministry", size: "5,000 – 20,000 staff", icon: Building2 },
  { id: "federal", label: "Federal Institution", size: "50,000+ staff", icon: Landmark },
];

export function ScopeStep() {
  const { agency, tier, cycle, expectedEmployees, setScope } = useWizardStore();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Define audit scope</h2>
        <p className="text-sm text-muted-foreground">
          Select the agency and payroll cycle. This calibrates the AI's expected employee volume and
          flagging thresholds.
        </p>
      </div>
      <div>
        <Label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">
          Client tier
        </Label>
        <div className="grid gap-3 sm:grid-cols-3">
          {TIERS.map((t) => {
            const active = tier === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() =>
                  setScope({
                    tier: t.id,
                    expectedEmployees: t.id === "small" ? 1500 : t.id === "state" ? 8000 : 60000,
                  })
                }
                className={cn(
                  "flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-all",
                  active
                    ? "border-primary bg-primary/5 shadow-[var(--shadow-elegant)]"
                    : "hover:border-primary/40 hover:bg-muted/40",
                )}
              >
                <Icon className="h-5 w-5 text-primary" />
                <div className="font-medium">{t.label}</div>
                <div className="text-xs text-muted-foreground">{t.size}</div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="agency">Agency / Ministry name</Label>
          <Input
            id="agency"
            placeholder="e.g. Lagos State Ministry of Education"
            value={agency}
            onChange={(e) => setScope({ agency: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="cycle">Payroll cycle</Label>
          <Input
            id="cycle"
            type="month"
            value={cycle}
            onChange={(e) => setScope({ cycle: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="exp">Expected employee count</Label>
          <Input
            id="exp"
            type="number"
            value={expectedEmployees}
            onChange={(e) => setScope({ expectedEmployees: Number(e.target.value) })}
            className="mt-1 tabular-nums"
          />
        </div>
      </div>
    </div>
  );
}

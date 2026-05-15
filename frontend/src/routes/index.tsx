import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Lock, ShieldCheck, Smartphone, Sparkles, UserRound, Wallet } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import logoMark from "@/assets/payguard-logo-mark.png";


function Landing() {
  const user = useAuthStore((s) => s.user);
  return (
    <>
      <section className="relative overflow-hidden text-white" style={{ backgroundImage: "var(--gradient-hero)" }}>
        <div className="absolute inset-0 opacity-20" aria-hidden>
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.3) 0, transparent 40%), radial-gradient(circle at 80% 60%, rgba(255,255,255,0.2) 0, transparent 50%)" }} />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 md:py-24">
          <img src={logoMark} alt="PayGuard AI" className="mb-6 h-16 w-16 rounded-xl bg-white/10 p-2 backdrop-blur md:h-20 md:w-20" />
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Built on the Squad Transfer API
          </div>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
            Stop payroll fraud <span className="opacity-80">before</span> the money leaves the bank.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-white/80 md:text-lg">
            PayGuard AI is a dual-portal trust system. Companies upload payroll. Workers claim their record and submit proof. The AI scores every payment 0&ndash;110 and Squad only releases funds for verified records.
          </p>

          {user && (
            <div className="mt-8 inline-flex items-center gap-3 rounded-lg border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
              <span className="text-sm">Welcome back, {user.fullName ?? user.companyName ?? user.email}.</span>
              <Button asChild variant="secondary" size="sm">
                <Link to={user.role === "company_admin" ? "/admin/dashboard" : "/worker/home"}>
                  Continue to your portal <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Portal picker */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">Pick your portal</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Two distinct experiences, one shared trust engine. Auditors get a desktop command center; workers get a mobile-first claim flow.
        </p>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <PortalCard
            tone="primary"
            icon={<Building2 className="h-6 w-6" />}
            badge="For audit firms & ministries"
            title="Company / Admin Portal"
            body="Upload Excel payroll batches, fund the Squad wallet, audit every worker against the 6-check trust score, and release verified payments in one click."
            features={["Payroll batch manager", "Wallet funding & disbursement", "Smart Decision Ledger", "Appeals inbox"]}
            cta="Sign up as a Company"
            href="/auth/signup?role=company"
            secondary={{ label: "Demo admin dashboard", href: "/admin/dashboard" }}
          />
          <PortalCard
            tone="accent"
            icon={<UserRound className="h-6 w-6" />}
            badge="Mobile-first for workers"
            title="Worker Portal"
            body="Claim your record with NIN + Account Number, upload your bank statement and screenshots, watch the AI tally your trust score in real time."
            features={["NIN / Account claim wizard", "Document upload (PDF + image)", "Live verification status", "Appeal a rejected score"]}
            cta="Sign up as a Worker"
            href="/auth/signup?role=worker"
            secondary={{ label: "Demo worker home", href: "/worker/home" }}
          />
        </div>
      </section>

      {/* How it works */}
      <section className="bg-[var(--gradient-trust)] py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-2xl font-semibold tracking-tight">How the trust score works</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Every worker is graded on six checks. The total score routes them into one of three buckets, and Squad is locked accordingly.
          </p>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            <Bucket color="var(--status-verified)" range="80&ndash;110" label="Verified" desc="Squad transfer enabled. Money moves." />
            <Bucket color="var(--status-flagged)" range="50&ndash;79" label="Flagged" desc="Manual review. Admin can override after reading evidence." />
            <Bucket color="var(--status-rejected)" range="Below 50" label="Rejected" desc="Squad locked. Worker must request an appeal." />
          </div>

          <div className="mt-10 grid items-center gap-10 md:grid-cols-2">
            <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-elegant)]">
              <h3 className="text-sm font-semibold">Six-check breakdown</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {[
                  ["NIN verified", "+25"],
                  ["Name matches payroll", "+20"],
                  ["Bank statement valid", "+20"],
                  ["Screenshot OCR matched", "+15"],
                  ["Receipt OCR matched", "+15"],
                  ["Transaction reference valid", "+15"],
                ].map(([label, pts]) => (
                  <li key={label} className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5 text-[color:var(--status-verified)]" />
                      {label}
                    </span>
                    <span className="tabular-nums text-xs font-semibold text-muted-foreground">{pts}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <ul className="space-y-3 text-sm">
                {[
                  { icon: <Smartphone className="h-4 w-4" />, body: "Mobile-first worker UI works on low-end Android phones over slow networks." },
                  { icon: <Lock className="h-4 w-4" />, body: "Squad transfers cannot fire for any worker below score 80, full stop." },
                  { icon: <Wallet className="h-4 w-4" />, body: "Failed wallet funding redirects to a dedicated help page with the Squad reference and fix." },
                  { icon: <ShieldCheck className="h-4 w-4" />, body: "Auditor overrides and appeal approvals are recorded in the audit trail." },
                ].map((b, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">{b.icon}</span>
                    <span>{b.body}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function PortalCard({
  tone,
  icon,
  badge,
  title,
  body,
  features,
  cta,
  href,
  secondary,
}: {
  tone: "primary" | "accent";
  icon: React.ReactNode;
  badge: string;
  title: string;
  body: string;
  features: string[];
  cta: string;
  href: string;
  secondary: { label: string; href: string };
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elegant)]">
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: tone === "primary" ? "var(--gradient-primary)" : "var(--status-verified)" }}
      />
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">{icon}</span>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{badge}</div>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{body}</p>
      <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-[color:var(--status-verified)]" />
            {f}
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button asChild>
          <Link to={href}>{cta} <ArrowRight className="h-4 w-4" /></Link>
        </Button>
        <Button asChild variant="outline">
          <Link to={secondary.href}>{secondary.label}</Link>
        </Button>
      </div>
    </div>
  );
}

function Bucket({ color, range, label, desc }: { color: string; range: string; label: string; desc: string }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold" style={{ color }}>{label}</span>
        <span className="tabular-nums text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: range }} />
      </div>
      <div className="mt-3 h-1.5 rounded-full" style={{ background: color, opacity: 0.85 }} />
      <p className="mt-3 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

export default Landing;

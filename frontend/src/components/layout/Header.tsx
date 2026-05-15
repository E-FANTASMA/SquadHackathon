import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import logoMark from "@/assets/payguard-logo-mark.png";

const ADMIN_NAV = [
  { to: "/admin/dashboard", label: "Decision Ledger" },
  { to: "/admin/batches", label: "Batches" },
  { to: "/admin/wallet", label: "Wallet" },
  { to: "/admin/appeals", label: "Appeals" },
  { to: "/audit", label: "Audit" },
] as const;

const WORKER_NAV = [
  { to: "/worker/home", label: "Status" },
  { to: "/worker/claim", label: "Claim Record" },
  { to: "/worker/documents", label: "Documents" },
] as const;

export function Header() {
  const loc = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const nav = user?.role === "company_admin" ? ADMIN_NAV : user?.role === "worker" ? WORKER_NAV : [];

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logoMark} alt="PayGuard AI logo" className="h-9 w-9 object-contain" />
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">PayGuard AI</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Smart Payroll Trust
            </div>
          </div>
        </Link>

        {user && (
          <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
            {nav.map((n) => {
              const active = loc.pathname === n.to || loc.pathname.startsWith(n.to + "/");
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  )}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <div className="hidden text-right text-xs leading-tight md:block">
                <div className="font-medium">{user.fullName ?? user.companyName ?? user.email}</div>
                <div className="text-muted-foreground">
                  {user.role === "company_admin" ? "Company Admin" : "Worker"}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Sign out"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth/login">
                  <User className="h-4 w-4" /> Sign in
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/auth/signup">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

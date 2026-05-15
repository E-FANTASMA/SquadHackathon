import { Fragment, useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ChevronDown, ChevronRight, ChevronUp, ChevronsUpDown, Send, ShieldCheck } from "lucide-react";
import { useLedgerStore } from "@/store/ledgerStore";
import { useFeedStore } from "@/store/feedStore";
import { naira } from "@/lib/format";
import type { Employee } from "@/lib/mockData";
import { SquadPaymentGate } from "./SquadPaymentGate";
import { TransactionMap } from "./TransactionMap";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { StatusPill } from "@/components/common/StatusPill";
import { ScoreBreakdown } from "@/components/common/ScoreBreakdown";
import { MAX_SCORE, type VerificationChecks, type VerificationStatus } from "@/lib/scoring";
import { companyService } from "@/services/api";
import { toast } from "sonner";

export function LedgerTable() {
  const employees = useLedgerStore((s) => s.employees);
  const setOverride = useLedgerStore((s) => s.setOverride);
  const updateChecks = useLedgerStore((s) => s.updateChecks);
  const execute = useLedgerStore((s) => s.executeVerifiedPayments);
  const pushFeed = useFeedStore((s) => s.push);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dept, setDept] = useState<string>("all");
  const [sorting, setSorting] = useState<SortingState>([{ id: "trustScore", desc: false }]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<Employee | null>(null);

  const departments = useMemo(
    () => Array.from(new Set(employees.map((e) => e.department))).sort(),
    [employees],
  );

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      if (search && !`${e.name} ${e.id} ${e.account} ${e.nin}`.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (dept !== "all" && e.department !== dept) return false;
      if (statusFilter !== "all" && e.verificationStatus !== statusFilter) return false;
      return true;
    });
  }, [employees, search, dept, statusFilter]);

  const disburseOne = async (e: Employee) => {
    const result = await companyService.disburseToWorker(e.id);
    if (!result.ok) {
      toast.error(result.reason);
      return;
    }
    pushFeed({ kind: "released", message: `Squad transfer released · ${naira(e.salary)} → ${e.id} · ${result.ref}` });
    toast.success(`Squad transfer released to ${e.name}`);
  };

  const columns = useMemo<ColumnDef<Employee>[]>(
    () => [
      {
        id: "expander",
        header: "",
        cell: ({ row }) => (
          <button
            onClick={() => setExpanded(expanded === row.original.id ? null : row.original.id)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Expand row"
          >
            {expanded === row.original.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ),
      },
      {
        accessorKey: "name",
        header: "Employee",
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-sm font-medium">
              {row.original.name}
              {row.original.checks.ninVerified && (
                <ShieldCheck className="h-3.5 w-3.5 text-[color:var(--status-verified)]" aria-label="NIN verified" />
              )}
            </div>
            <div className="text-[11px] text-muted-foreground tabular-nums">
              {row.original.id} · NIN {row.original.nin}
            </div>
          </div>
        ),
      },
      { accessorKey: "department", header: "Department" },
      {
        accessorKey: "trustScore",
        header: "Trust Score",
        cell: ({ row }) => <TrustBadge score={row.original.trustScore} />,
      },
      {
        accessorKey: "verificationStatus",
        header: "Status",
        cell: ({ row }) => <StatusPill status={row.original.verificationStatus} />,
      },
      {
        accessorKey: "salary",
        header: "Salary",
        cell: ({ row }) => <span className="tabular-nums text-sm">{naira(row.original.salary)}</span>,
      },
      {
        accessorKey: "squadStatus",
        header: "Squad",
        cell: ({ row }) => <SquadPaymentGate status={row.original.squadStatus} />,
      },
      {
        id: "action",
        header: "Action",
        cell: ({ row }) => {
          const e = row.original;
          const eligible = e.verificationStatus === "verified" || e.override;
          if (e.verificationStatus === "flagged") {
            return (
              <Button size="sm" variant="outline" onClick={() => setReviewing(e)}>
                Review
              </Button>
            );
          }
          return (
            <Button size="sm" disabled={!eligible} onClick={() => disburseOne(e)}>
              <Send className="h-3.5 w-3.5" /> Disburse
            </Button>
          );
        },
      },
      {
        id: "override",
        header: "Override",
        cell: ({ row }) => (
          <Switch
            checked={row.original.override}
            onCheckedChange={(v) => {
              setOverride(row.original.id, v);
              if (v) pushFeed({ kind: "override", message: `Auditor override applied · ${row.original.id}` });
            }}
            aria-label="Manual override"
          />
        ),
      },
    ],
    [expanded, setOverride, pushFeed],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 12 } },
  });

  const totalPayroll = employees.reduce((s, e) => s + e.salary, 0);
  const verifiedCount = employees.filter((e) => e.verificationStatus === "verified" || e.override).length;
  const flaggedCount = employees.filter((e) => e.verificationStatus === "flagged" && !e.override).length;
  const rejectedCount = employees.filter((e) => e.verificationStatus === "rejected" && !e.override).length;
  const blockedSavings = employees
    .filter((e) => (e.verificationStatus === "flagged" || e.verificationStatus === "rejected") && !e.override)
    .reduce((s, e) => s + e.salary, 0);

  return (
    <div className="rounded-lg border bg-card shadow-[var(--shadow-card)]">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 border-b p-3">
        <Input
          placeholder="Search name, ID, NIN, or account…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full sm:w-64"
        />
        <Select value={dept} onValueChange={setDept}>
          <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Department" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button
          onClick={() => {
            const n = execute();
            pushFeed({ kind: "released", message: `Squad batch executed · ${n} verified payments released` });
            toast.success(`Squad batch executed · ${n} verified payments released`);
          }}
        >
          Execute Verified Payments via Squad
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => {
                  const sortable = h.column.getCanSort() && !["expander", "override", "action"].includes(h.column.id);
                  return (
                    <th key={h.id} className="px-3 py-2 font-medium">
                      {sortable ? (
                        <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={h.column.getToggleSortingHandler()}>
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {h.column.getIsSorted() === "asc" ? <ChevronUp className="h-3 w-3" /> : h.column.getIsSorted() === "desc" ? <ChevronDown className="h-3 w-3" /> : <ChevronsUpDown className="h-3 w-3 opacity-40" />}
                        </button>
                      ) : (
                        flexRender(h.column.columnDef.header, h.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              const status = row.original.verificationStatus;
              const isExpanded = expanded === row.original.id;
              const tint =
                status === "rejected"
                  ? "bg-[color-mix(in_oklab,var(--status-rejected)_8%,transparent)]"
                  : status === "flagged"
                    ? "bg-[color-mix(in_oklab,var(--status-flagged)_7%,transparent)]"
                    : "hover:bg-muted/40";
              return (
                <Fragment key={row.id}>
                  <tr className={cn("border-t transition-colors", tint)}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-2.5 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                  {isExpanded && (
                    <tr className="border-t bg-muted/30">
                      <td colSpan={row.getVisibleCells().length} className="p-4">
                        <Evidence employee={row.original} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center text-sm text-muted-foreground">
                  No employees match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
        <div>{filtered.length} of {employees.length} employees</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button>
          <span className="tabular-nums">Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}</span>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
        </div>
      </div>

      {/* Footer summary */}
      <div className="grid gap-3 border-t bg-[var(--gradient-trust)] p-4 sm:grid-cols-4">
        <Summary label="Total Payroll" value={naira(totalPayroll)} />
        <Summary label="Verified" value={`${verifiedCount}`} tone="success" />
        <Summary label="Flagged" value={`${flaggedCount}`} tone="warning" />
        <Summary label="Rejected (Savings)" value={naira(blockedSavings)} tone="danger" sub={`${rejectedCount} records`} />
      </div>

      {/* Manual review modal */}
      <Dialog open={!!reviewing} onOpenChange={(o) => !o && setReviewing(null)}>
        <DialogContent className="max-w-2xl">
          {reviewing && (
            <ManualReview
              employee={reviewing}
              onSave={(checks) => {
                updateChecks(reviewing.id, checks);
                pushFeed({ kind: "override", message: `Manual review · ${reviewing.id} re-scored` });
                toast.success("Verification re-scored");
                setReviewing(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ManualReview({ employee, onSave }: { employee: Employee; onSave: (c: VerificationChecks) => void }) {
  const [checks, setChecks] = useState<VerificationChecks>(employee.checks);
  return (
    <>
      <DialogHeader>
        <DialogTitle>Manual Review · {employee.name}</DialogTitle>
        <DialogDescription>
          {employee.id} · {employee.department} · Tap any check to award or remove its points. Decision is recorded in the audit trail.
        </DialogDescription>
      </DialogHeader>
      <div className="py-2">
        <ScoreBreakdown
          checks={checks}
          editable
          onToggle={(k, v) => setChecks({ ...checks, [k]: v })}
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => setChecks(employee.checks)}>Reset</Button>
        <Button onClick={() => onSave(checks)}>Save & Re-score</Button>
      </DialogFooter>
    </>
  );
}

function TrustBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? "var(--status-verified)" : score >= 50 ? "var(--status-flagged)" : "var(--status-rejected)";
  const pct = (score / MAX_SCORE) * 360;
  return (
    <div className="flex items-center gap-2">
      <div
        className="grid h-9 w-9 place-items-center rounded-full text-[11px] font-semibold tabular-nums"
        style={{ background: `conic-gradient(${color} ${pct}deg, color-mix(in oklab, ${color} 18%, transparent) 0)` }}
      >
        <span className="grid h-7 w-7 place-items-center rounded-full text-foreground" style={{ background: "var(--card)" }}>
          {score}
        </span>
      </div>
      <span className="text-xs font-medium tabular-nums" style={{ color }}>/{MAX_SCORE}</span>
    </div>
  );
}

function Summary({ label, value, sub, tone = "default" }: { label: string; value: string; sub?: string; tone?: "default" | "success" | "danger" | "warning" }) {
  const color =
    tone === "success" ? "var(--status-verified)" :
    tone === "danger" ? "var(--status-rejected)" :
    tone === "warning" ? "var(--status-flagged)" :
    "var(--foreground)";
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold tabular-nums" style={{ color }}>{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Evidence({ employee }: { employee: Employee }) {
  const all = useLedgerStore((s) => s.employees);
  const peers =
    employee.flagReason === "Shared Account"
      ? all.filter((e) => e.account === employee.account && e.id !== employee.id).slice(0, 4)
      : [];
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Trust Breakdown</h4>
        <ScoreBreakdown checks={employee.checks} />
      </div>
      <div className="space-y-3">
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Evidence</h4>
          <ul className="space-y-1.5 text-sm">
            {(employee.evidence.length ? employee.evidence : ["No anomalies detected on this record."]).map((line, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-md border bg-background p-3 font-mono text-[11px] text-muted-foreground">
          <div>// Bank statement excerpt (parsed by AI OCR)</div>
          <div>ACCT: {employee.account}</div>
          <div>NAME: {employee.name.toUpperCase()}</div>
          <div>OPENED: {employee.accountAgeDays} days ago</div>
          <div>EXPECTED CREDIT: ₦{employee.salary.toLocaleString()}</div>
        </div>
        {peers.length > 0 && (
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account Sharing Map</h4>
            <div className="rounded-md border bg-background">
              <TransactionMap employee={employee} peers={peers} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

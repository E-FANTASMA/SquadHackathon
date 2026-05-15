import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { useBatchStore, type BatchStatus } from "@/store/batchStore";
import { useFeedStore } from "@/store/feedStore";
import { compactNaira } from "@/lib/format";
import { FileSpreadsheet, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { companyService, USE_REAL_API } from "@/services/api";

export const Route = createFileRoute("/admin/batches")({
  head: () => ({ meta: [{ title: "Payroll Batches · PayGuard Admin" }] }),
  component: BatchesPage,
});

const STATUS_COLOR: Record<BatchStatus, string> = {
  pending: "var(--status-pending)",
  processing: "var(--status-flagged)",
  funded: "var(--primary)",
  completed: "var(--status-verified)",
};

function BatchesPage() {
  const batches = useBatchStore((s) => s.batches);
  const addBatch = useBatchStore((s) => s.addBatch);
  const setBatches = useBatchStore((s) => s.setBatches);
  const advance = useBatchStore((s) => s.advanceBatch);
  const pushFeed = useFeedStore((s) => s.push);
  const [last, setLast] = useState<string | null>(null);

  useEffect(() => {
    if (!USE_REAL_API) return;
    let cancelled = false;
    void companyService.listBatches().then((list) => {
      if (!cancelled) setBatches(list);
    });
    return () => {
      cancelled = true;
    };
  }, [setBatches]);

  const onDrop = useCallback(
    async (files: File[]) => {
      for (const f of files) {
        const workerCount = 50 + Math.floor(Math.random() * 200);
        const totalAmount = workerCount * (200_000 + Math.floor(Math.random() * 200_000));
        if (USE_REAL_API) {
          try {
            const batch = await companyService.uploadPayroll({
              filename: f.name,
              workerCount,
              totalAmount,
            });
            setLast(batch.id);
            const list = await companyService.listBatches();
            setBatches(list);
            toast.success(`Uploaded ${f.name}`);
            pushFeed({
              kind: "info",
              message: `Payroll batch uploaded · ${batch.id}`,
            });
          } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Upload failed");
          }
        } else {
          const batch = addBatch({ filename: f.name, workerCount, totalAmount });
          setLast(batch.id);
          toast.success(`Uploaded ${f.name}`);
          pushFeed({
            kind: "info",
            message: `Payroll batch uploaded · ${batch.id}`,
          });
          setTimeout(() => advance(batch.id), 1500);
          setTimeout(() => advance(batch.id), 3500);
        }
      }
    },
    [addBatch, advance, pushFeed, setBatches],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Payroll Batches</h1>
        <p className="text-sm text-muted-foreground">
          Upload an Excel payroll file (Name, NIN, Account Number, Salary). PayGuard parses it, runs
          the AI checks, and queues it for Squad disbursement.
        </p>
      </div>

      <div
        {...getRootProps()}
        className={cn(
          "cursor-pointer rounded-xl border-2 border-dashed bg-card p-10 text-center transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium">
          {isDragActive ? "Drop the file here" : "Drop Excel payroll file or click to browse"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Required columns: Name · NIN · Account Number · Salary
        </p>
      </div>

      <div className="mt-8 rounded-lg border bg-card shadow-[var(--shadow-card)]">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Batch History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Batch</th>
                <th className="px-4 py-2">File</th>
                <th className="px-4 py-2">Workers</th>
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2">Uploaded</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b.id} className={cn("border-t", last === b.id && "bg-primary/5")}>
                  <td className="px-4 py-2.5 font-medium tabular-nums">{b.id}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-muted-foreground" /> {b.filename}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 tabular-nums">{b.workerCount}</td>
                  <td className="px-4 py-2.5 tabular-nums">{compactNaira(b.totalAmount)}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {new Date(b.uploadedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize"
                      style={{
                        background: `color-mix(in oklab, ${STATUS_COLOR[b.status]} 14%, transparent)`,
                        color: STATUS_COLOR[b.status],
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: STATUS_COLOR[b.status] }}
                      />
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {b.status !== "completed" && (
                      <Button variant="outline" size="sm" onClick={() => advance(b.id)}>
                        Advance
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {batches.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-sm text-muted-foreground">
                    No batches uploaded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Naira values are estimated client-side from the demo dataset.
      </p>
    </div>
  );
}

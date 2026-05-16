
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { useBatchStore, type BatchStatus } from "@/store/batchStore";
import { useFeedStore } from "@/store/feedStore";
import { companyService } from "@/services/api";
import { naira, compactNaira } from "@/lib/format";
import { FileSpreadsheet, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUS_COLOR: Record<BatchStatus, string> = {
  pending: "var(--status-pending)",
  processing: "var(--status-flagged)",
  funded: "var(--primary)",
  completed: "var(--status-verified)",
};

function BatchesPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const pushFeed = useFeedStore((s) => s.push);
  const [last, setLast] = useState<string | null>(null);

  const fetchBatches = async () => {
    try {
      const data = await companyService.listBatches();
      setBatches(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const deleteBatch = async (id: string) => {
    if (!confirm("Are you sure you want to delete this batch and all its worker records?")) return;
    try {
      await companyService.deleteBatch(id);
      toast.success("Batch deleted");
      fetchBatches();
    } catch (error: any) {
      toast.error(error.message || "Delete failed");
    }
  };

  const onDrop = useCallback((files: File[]) => {
    files.forEach(async (f) => {
      try {
        const formData = new FormData();
        formData.append("payroll_file", f);
        formData.append("batch_name", f.name);
        
        const res = await companyService.uploadPayroll(formData);
        
        toast.success(`Uploaded ${f.name}`);
        pushFeed({ kind: "info", message: `New payroll batch uploaded: ${f.name}` });
        pushFeed({ kind: "released", message: `${res.workerCount} workers imported to Smart Decision Ledger` });
        
        fetchBatches();
      } catch (error: any) {
        toast.error(error.message || "Upload failed");
      }
    });
  }, [pushFeed]);

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
          Upload an Excel payroll file (Name, NIN, Account Number, Salary). PayGuard parses it, runs the AI checks, and queues it for Squad disbursement.
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
        <p className="mt-3 text-sm font-medium">{isDragActive ? "Drop the file here" : "Drop Excel payroll file or click to browse"}</p>
        <p className="mt-1 text-xs text-muted-foreground">Required columns: Name · NIN · Account Number · Salary</p>
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
                  <td className="px-4 py-2.5 font-medium tabular-nums">{b.id.slice(0, 8)}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-2"><FileSpreadsheet className="h-4 w-4 text-muted-foreground" /> {b.batch_name}</span>
                  </td>
                  <td className="px-4 py-2.5 tabular-nums">{b.total_workers}</td>
                  <td className="px-4 py-2.5 tabular-nums">{compactNaira(b.total_amount)}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{new Date(b.upload_date).toLocaleString()}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize"
                      style={{
                        background: `color-mix(in oklab, ${STATUS_COLOR[b.status as BatchStatus] || STATUS_COLOR.pending} 14%, transparent)`,
                        color: STATUS_COLOR[b.status as BatchStatus] || STATUS_COLOR.pending,
                      }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_COLOR[b.status as BatchStatus] || STATUS_COLOR.pending }} />
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/admin/verify/${b.id}`}>View Details</Link>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteBatch(b.id)} className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {batches.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-sm text-muted-foreground">No batches uploaded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Naira values are estimated client-side from the demo dataset. Real Excel parsing is integrated in the backend.
      </p>
    </div>
  );
}

export default BatchesPage;

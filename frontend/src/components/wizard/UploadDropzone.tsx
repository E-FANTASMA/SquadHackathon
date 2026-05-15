import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Camera, FileText, Upload, X } from "lucide-react";
import { useWizardStore, type UploadedFile } from "@/store/wizardStore";
import { cn } from "@/lib/utils";

let counter = 0;

export function UploadDropzone({
  kind,
  accept,
  label,
  hint,
}: {
  kind: "bank" | "payroll";
  accept: Record<string, string[]>;
  label: string;
  hint: string;
}) {
  const addFiles = useWizardStore((s) => s.addFiles);
  const updateFile = useWizardStore((s) => s.updateFile);
  const removeFile = useWizardStore((s) => s.removeFile);
  const files = useWizardStore((s) => s.files.filter((f) => f.kind === kind));

  const onDrop = useCallback(
    (accepted: File[]) => {
      const list: UploadedFile[] = accepted.map((f) => ({
        id: `f${++counter}-${Date.now()}`,
        name: f.name,
        size: f.size,
        kind,
        status: "queued",
      }));
      addFiles(list);
      list.forEach((f, i) => {
        setTimeout(() => updateFile(f.id, { status: "scanning" }), 200 + i * 80);
        setTimeout(
          () =>
            updateFile(f.id, {
              status: Math.random() < 0.08 ? "needs-rescan" : "extracted",
            }),
          1400 + i * 200,
        );
      });
    },
    [addFiles, updateFile, kind],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept,
    noClick: false,
  });

  return (
    <div className="rounded-lg border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">{label}</h3>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-secondary">
          <Camera className="h-3.5 w-3.5" />
          Scan
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files && onDrop(Array.from(e.target.files))}
          />
        </label>
      </div>
      <div
        {...getRootProps()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed px-4 py-8 text-center transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40",
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
        <p className="text-sm">
          Drop files or <button type="button" onClick={open} className="font-medium text-primary underline">browse</button>
        </p>
        <p className="text-[11px] text-muted-foreground">{Object.keys(accept).join(", ")}</p>
      </div>
      {files.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {files.map((f) => (
            <li
              key={f.id}
              className={cn(
                "flex items-center gap-2 rounded-md border bg-background px-2.5 py-2 text-xs",
                f.status === "scanning" && "scanline",
              )}
            >
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate">{f.name}</span>
              <StatusChip status={f.status} />
              <button
                onClick={() => removeFile(f.id)}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Remove"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusChip({ status }: { status: UploadedFile["status"] }) {
  const map = {
    queued: { label: "Queued", color: "var(--muted-foreground)" },
    scanning: { label: "AI Scanning", color: "var(--primary)" },
    extracted: { label: "Extracted", color: "var(--squad-released)" },
    "needs-rescan": { label: "Needs Re-scan", color: "var(--squad-locked)" },
  } as const;
  const { label, color } = map[status];
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{
        background: `color-mix(in oklab, ${color} 14%, transparent)`,
        color,
      }}
    >
      {label}
    </span>
  );
}

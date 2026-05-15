import { UploadDropzone } from "./UploadDropzone";
import { useWizardStore } from "@/store/wizardStore";
import { AlertTriangle } from "lucide-react";

export function IngestStep() {
  const files = useWizardStore((s) => s.files);
  const needsRescan = files.filter((f) => f.status === "needs-rescan");
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Upload payroll evidence</h2>
        <p className="text-sm text-muted-foreground">
          The AI will OCR bank statements and cross-reference your payroll roster. Use the camera
          for on-site scans.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <UploadDropzone
          kind="bank"
          label="Bank Statements"
          hint="PDF statements from each beneficiary bank."
          accept={{ "application/pdf": [".pdf"], "image/*": [".jpg", ".jpeg", ".png"] }}
        />
        <UploadDropzone
          kind="payroll"
          label="Payroll Register"
          hint="CSV or XLSX export from your HR/finance system."
          accept={{
            "text/csv": [".csv"],
            "application/vnd.ms-excel": [".xls"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
          }}
        />
      </div>
      {needsRescan.length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-[color:var(--squad-locked)]/40 bg-[color-mix(in_oklab,var(--squad-locked)_8%,transparent)] p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-[color:var(--squad-locked)]" />
          <div>
            <div className="font-medium">{needsRescan.length} file(s) need a re-scan</div>
            <div className="text-xs text-muted-foreground">
              The AI couldn't extract clean text. Try a higher-resolution scan or re-upload the PDF.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

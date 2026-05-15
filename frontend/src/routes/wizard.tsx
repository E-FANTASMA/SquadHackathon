
import { useWizardStore } from "@/store/wizardStore";
import { StepperHeader } from "@/components/wizard/StepperHeader";
import { ScopeStep } from "@/components/wizard/ScopeStep";
import { IngestStep } from "@/components/wizard/IngestStep";
import { AnalyzeStep } from "@/components/wizard/AnalyzeStep";
import { ReviewStep } from "@/components/wizard/ReviewStep";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";


function WizardPage() {
  const { step, next, back, agency, files, riskConfidence } = useWizardStore();

  const canAdvance =
    step === 0
      ? agency.trim().length > 0
      : step === 1
        ? files.filter((f) => f.status === "extracted").length >= 1
        : step === 2
          ? riskConfidence !== null
          : true;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Pre-Flight Payroll Audit</h1>
        <p className="text-sm text-muted-foreground">
          AI-gated workflow. Squad disbursement remains locked until every check passes.
        </p>
      </div>
      <div className="mb-8 rounded-lg border bg-card p-4 shadow-[var(--shadow-card)]">
        <StepperHeader step={step} />
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-[var(--shadow-card)]">
        {step === 0 && <ScopeStep />}
        {step === 1 && <IngestStep />}
        {step === 2 && <AnalyzeStep />}
        {step === 3 && <ReviewStep />}
      </div>

      {step < 3 && (
        <div className="mt-6 flex items-center justify-between">
          <Button variant="outline" onClick={back} disabled={step === 0}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Button onClick={next} disabled={!canAdvance}>
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default WizardPage;

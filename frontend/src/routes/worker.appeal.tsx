import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import { useAppealStore } from "@/store/appealStore";
import { useFeedStore } from "@/store/feedStore";
import { Paperclip, Send } from "lucide-react";
import { toast } from "sonner";


function AppealPage() {
  const user = useAuthStore((s) => s.user);
  const submit = useAppealStore((s) => s.submit);
  const pushFeed = useFeedStore((s) => s.push);
  const navigate = useNavigate();

  const [message, setMessage] = useState("");
  const [doc, setDoc] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onSubmit = () => {
    if (message.trim().length < 20) return toast.error("Please describe the issue (min 20 characters)");
    if (!doc) return toast.error("Attach a supporting document (e.g. National ID)");
    submit({
      workerId: user?.id ?? "anon",
      workerName: user?.fullName ?? user?.email ?? "Worker",
      employeeId: user?.matchedEmployeeId,
      message: message.trim(),
      supportingDocName: doc.name,
    });
    pushFeed({ kind: "info", message: `Appeal filed by ${user?.fullName ?? "worker"}` });
    toast.success("Appeal submitted to your administrator");
    navigate("/worker/home");
  };

  return (
    <div className="mx-auto max-w-md px-4 py-6 sm:max-w-xl sm:py-10">
      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Request a Manual Appeal</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Tell your auditor what happened and attach one supporting document (e.g. National ID, marriage certificate, NIN slip).
      </p>

      <div className="mt-6 space-y-4 rounded-xl border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="space-y-1.5">
          <Label htmlFor="msg">Your message</Label>
          <Textarea id="msg" rows={6} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="My NIN was updated after marriage, the payroll still has my old name. Attaching my new National ID for verification." />
          <div className="text-right text-[11px] text-muted-foreground">{message.length} / 600</div>
        </div>

        <div className="space-y-1.5">
          <Label>Supporting document</Label>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center gap-3 rounded-md border bg-background p-3 text-left text-sm hover:bg-muted/40"
          >
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 truncate">{doc ? doc.name : "Tap to attach National ID, NIN slip, or other proof"}</span>
            <span className="text-xs font-medium text-primary">{doc ? "Replace" : "Attach"}</span>
            <input ref={fileRef} type="file" accept="image/*,application/pdf" capture="environment" className="hidden" onChange={(e) => setDoc(e.target.files?.[0] ?? null)} />
          </button>
        </div>

        <Button className="h-12 w-full text-base" onClick={onSubmit}>
          <Send className="h-4 w-4" /> Submit appeal
        </Button>
      </div>
    </div>
  );
}

export default AppealPage;

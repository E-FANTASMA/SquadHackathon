import { getSupabase } from "@/lib/supabase/client";

const BUCKET_STATEMENTS = "statements";
const BUCKET_SCREENSHOTS = "screenshots";

export type WorkerEvidenceUpload = {
  statementPath?: string;
  screenshotPath?: string;
};

/**
 * Uploads worker evidence to Supabase Storage (RLS must allow authenticated writes).
 * Paths are scoped by auth user id + employee id to avoid collisions.
 */
export async function uploadWorkerEvidence(params: {
  authUserId: string;
  employeeId: string;
  statementFile?: File | null;
  screenshotFile?: File | null;
}): Promise<WorkerEvidenceUpload> {
  const sb = getSupabase();
  if (!sb) return {};

  const { authUserId, employeeId, statementFile, screenshotFile } = params;
  const base = `${authUserId}/${employeeId}`;
  const out: WorkerEvidenceUpload = {};

  if (statementFile) {
    const path = `${base}/statement-${Date.now()}-${sanitize(statementFile.name)}`;
    const { error } = await sb.storage.from(BUCKET_STATEMENTS).upload(path, statementFile, {
      upsert: true,
      contentType: statementFile.type || "application/pdf",
    });
    if (!error) out.statementPath = path;
  }

  if (screenshotFile) {
    const path = `${base}/screenshot-${Date.now()}-${sanitize(screenshotFile.name)}`;
    const { error } = await sb.storage.from(BUCKET_SCREENSHOTS).upload(path, screenshotFile, {
      upsert: true,
      contentType: screenshotFile.type || "image/jpeg",
    });
    if (!error) out.screenshotPath = path;
  }

  return out;
}

function sanitize(name: string): string {
  return name.replace(/[^\w.\-]+/g, "_").slice(0, 120);
}

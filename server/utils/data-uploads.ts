import type { H3Event } from "h3";
import { eq } from "drizzle-orm";
import { db, schema } from "@nuxthub/db";
import { blob } from "@nuxthub/blob";

export const MAX_UPLOAD_FILES = 10;
export const MAX_UPLOAD_FILE_BYTES = 15 * 1024 * 1024;
export const MAX_UPLOAD_TEXT = 100_000;

/** File types we can read: register photos, PDFs, spreadsheets, text. */
const ACCEPTED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "application/pdf": "pdf",
  "text/csv": "csv",
  "text/plain": "txt",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.oasis.opendocument.spreadsheet": "ods",
};
const ACCEPTED_EXTENSIONS = new Set(Object.values(ACCEPTED_TYPES).concat(["jpeg"]));

export interface UploadFile {
  key: string;
  name: string;
  type: string;
  size: number;
}

export interface UploadResult {
  plansCreated: number;
  membersLoaded: number;
  membersWithoutDueDate: number;
  dueNow: number;
  skipped: { name?: string | null; reason: string }[];
  warnings?: { name?: string | null; reason: string }[];
}

function extensionOf(name: string) {
  return name.toLowerCase().split(".").pop() || "";
}

/** Read files, pasted text and a note from a multipart form and queue them for loading. */
export async function queueUploadFromForm(event: H3Event, opts: { orgId: number; uploadedBy: number | null; source: "owner" | "admin" }) {
  const form = await readFormData(event);
  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  const text = String(form.get("text") || "").trim();
  const note = String(form.get("note") || "").trim().slice(0, 1000) || null;

  if (!files.length && !text) {
    throw createError({ statusCode: 400, statusMessage: "Add a file or paste your list" });
  }
  if (files.length > MAX_UPLOAD_FILES) {
    throw createError({ statusCode: 400, statusMessage: `Send at most ${MAX_UPLOAD_FILES} files at a time` });
  }
  if (text.length > MAX_UPLOAD_TEXT) {
    throw createError({ statusCode: 400, statusMessage: "The pasted text is too long. Send it as a file instead." });
  }
  for (const file of files) {
    if (file.size > MAX_UPLOAD_FILE_BYTES) {
      throw createError({ statusCode: 400, statusMessage: `"${file.name}" is bigger than 15 MB` });
    }
    if (!ACCEPTED_TYPES[file.type] && !ACCEPTED_EXTENSIONS.has(extensionOf(file.name))) {
      throw createError({ statusCode: 400, statusMessage: `We can't read "${file.name}". Send photos, PDF, Excel, CSV or text files.` });
    }
  }

  const stored: UploadFile[] = [];
  for (const file of files) {
    const ext = ACCEPTED_TYPES[file.type] || extensionOf(file.name);
    const saved = await blob.put(`uploads/${opts.orgId}/${Date.now()}.${ext}`, file, {
      addRandomSuffix: true,
      contentType: file.type || "application/octet-stream",
    });
    stored.push({ key: saved.pathname, name: file.name.slice(0, 200), type: file.type || "", size: file.size });
  }

  const [row] = await db.insert(schema.dataUploads).values({
    orgId: opts.orgId,
    uploadedBy: opts.uploadedBy,
    source: opts.source,
    files: JSON.stringify(stored),
    text: text || null,
    note,
  }).returning();

  return row!;
}

export function parseUploadFiles(json: string | null): UploadFile[] {
  try {
    const parsed = JSON.parse(json || "[]");
    return Array.isArray(parsed) ? parsed : [];
  }
  catch {
    return [];
  }
}

export function parseUploadResult(json: string | null): UploadResult | null {
  if (!json) return null;
  try {
    return JSON.parse(json);
  }
  catch {
    return null;
  }
}

/** Email the admin about a new upload so it isn't left waiting. */
export async function alertNewUpload(event: H3Event, upload: { id: number; orgId: number; source: string }) {
  const [org] = await db.select({ name: schema.organizations.name }).from(schema.organizations)
    .where(eq(schema.organizations.id, upload.orgId)).limit(1);
  const appUrl = String(useRuntimeConfig(event).public.appUrl || "https://memberbook.in");
  await sendAdminEmail(
    event,
    `New data upload: ${org?.name ?? `business ${upload.orgId}`}`,
    `${org?.name ?? "A business"} sent their data (upload #${upload.id}, from ${upload.source}).\n\n`
    + `The AI task starts on its own now (or within a few hours if that fails). Queue: ${appUrl}/admin/setup\n`,
  );
}

export async function getUploadOr404(event: H3Event) {
  const id = Number(getRouterParam(event, "id"));
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: "Invalid upload id" });
  }
  const [upload] = await db.select().from(schema.dataUploads).where(eq(schema.dataUploads.id, id)).limit(1);
  if (!upload) throw createError({ statusCode: 404, statusMessage: "Upload not found" });
  return upload;
}

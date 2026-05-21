import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { env } from "@/lib/env";
import type { Json } from "@/lib/supabase/types";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getToolDefinition } from "@/definitions";

export type ExportFormat = "txt" | "md" | "pdf" | "json" | "png";

type ToolUsageRow = {
  id: string;
  user_id: string;
  tool_id: string;
  tool_name: string;
  output: Json;
  created_at: string;
};

const EXPORT_BUCKET = "generated-exports";

type ExistingExportRow = {
  id: string;
  storage_path: string | null;
  file_type: string | null;
  metadata: Json | null;
  created_at: string;
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

function titleCaseFromKey(key: string) {
  return key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function stringifyValue(value: unknown, indent = 0): string {
  const pad = "  ".repeat(indent);
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === "object" ? `${pad}- ${stringifyValue(item, indent + 1)}` : `${pad}- ${item}`)).join("\n");
  }
  return Object.entries(value as Record<string, unknown>)
    .map(([key, nested]) => {
      const header = `${pad}${titleCaseFromKey(key)}:`;
      if (nested && typeof nested === "object") return `${header}\n${stringifyValue(nested, indent + 1)}`;
      return `${header} ${stringifyValue(nested, indent + 1)}`;
    })
    .join("\n");
}

function objectToMarkdown(value: unknown, depth = 2): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item && typeof item === "object" && !Array.isArray(item)) {
          const nested = Object.entries(item as Record<string, unknown>)
            .map(([nestedKey, nestedValue]) => `  - **${titleCaseFromKey(nestedKey)}:** ${stringifyValue(nestedValue)}`)
            .join("\n");
          return `- Item\n${nested}`;
        }
        return `- ${stringifyValue(item)}`;
      })
      .join("\n");
  }
  return Object.entries(value as Record<string, unknown>)
    .map(([key, nested]) => `${"#".repeat(Math.min(depth, 6))} ${titleCaseFromKey(key)}\n\n${objectToMarkdown(nested, depth + 1)}`)
    .join("\n\n");
}

export function formatOutputAsMarkdown(toolId: string, toolName: string, output: unknown) {
  return [`# ${toolName}`, "", `Generated from **${toolId}** on ${new Date().toLocaleString()}.`, "", objectToMarkdown(output)]
    .filter(Boolean)
    .join("\n");
}

export function formatOutputAsText(toolId: string, toolName: string, output: unknown) {
  return `${toolName}\n${"=".repeat(toolName.length)}\nGenerated from ${toolId} on ${new Date().toLocaleString()}\n\n${stringifyValue(output)}`;
}

async function buildProfessionalPdf(args: { title: string; subtitle: string; content: string }) {
  const pdf = await PDFDocument.create();
  const pageSize: [number, number] = [595.28, 841.89];
  let page = pdf.addPage(pageSize);
  const { width: pageWidth, height: pageHeight } = page.getSize();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const margin = 48;
  const brand = rgb(0.13, 0.22, 0.55);
  const muted = rgb(0.35, 0.38, 0.45);
  const text = rgb(0.1, 0.11, 0.14);
  const lineHeight = 16;
  const fontSize = 11;
  let y = pageHeight - margin;

  const drawHeader = () => {
    page.drawRectangle({ x: 0, y: pageHeight - 96, width: pageWidth, height: 96, color: brand });
    page.drawText(env.NEXT_PUBLIC_APP_NAME || "Zenovee AI", { x: margin, y: pageHeight - 42, size: 24, font: bold, color: rgb(1, 1, 1) });
    page.drawText(args.title, { x: margin, y: pageHeight - 72, size: 16, font: bold, color: rgb(0.94, 0.97, 1) });
    page.drawText(args.subtitle, { x: margin, y: pageHeight - 92, size: 9, font, color: rgb(0.88, 0.92, 0.99) });
    y = pageHeight - 128;
  };

  const addPage = () => {
    page = pdf.addPage(pageSize);
    drawHeader();
  };

  const drawWrapped = (line: string, size: number, currentFont: typeof font | typeof bold, color = text) => {
    const words = line.split(/\s+/).filter(Boolean);
    let current = "";
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (currentFont.widthOfTextAtSize(test, size) > pageWidth - margin * 2 && current) {
        if (y < 80) addPage();
        page.drawText(current, { x: margin, y, size, font: currentFont, color });
        y -= lineHeight;
        current = word;
      } else {
        current = test;
      }
    }
    if (current) {
      if (y < 80) addPage();
      page.drawText(current, { x: margin, y, size, font: currentFont, color });
      y -= lineHeight;
    }
  };

  drawHeader();

  for (const rawLine of args.content.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      y -= 8;
      continue;
    }
    if (line.startsWith("# ")) {
      y -= 6;
      drawWrapped(line.replace(/^#\s+/, ""), 18, bold, brand);
      continue;
    }
    if (line.startsWith("## ")) {
      y -= 4;
      drawWrapped(line.replace(/^##\s+/, ""), 14, bold, brand);
      continue;
    }
    if (line.startsWith("### ")) {
      drawWrapped(line.replace(/^###\s+/, ""), 12, bold, muted);
      continue;
    }
    if (line.startsWith("- ")) {
      drawWrapped(`• ${line.slice(2)}`, fontSize, font, text);
      continue;
    }
    drawWrapped(line, fontSize, font, text);
  }

  return Buffer.from(await pdf.save());
}

async function ensureBucket(bucket: string) {
  const { data, error } = await supabaseAdmin.storage.getBucket(bucket);
  if (!data && error) {
    await supabaseAdmin.storage.createBucket(bucket, {
      public: false,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ["application/pdf", "application/json", "text/plain", "text/markdown", "image/png"],
    });
  }
}

export async function createSignedDownloadUrl(args: { path: string; downloadName?: string }) {
  const { data, error } = await supabaseAdmin.storage.from(EXPORT_BUCKET).createSignedUrl(args.path, 600, {
    download: args.downloadName,
  });
  if (error || !data?.signedUrl) throw new Error(error?.message ?? "Failed to create secure download URL.");
  return data.signedUrl;
}

async function uploadToStorage(args: { userId: string; fileName: string; contentType: string; body: Buffer | Uint8Array | ArrayBuffer }) {
  await ensureBucket(EXPORT_BUCKET);
  const date = new Date();
  const path = `${args.userId}/${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${Date.now()}-${slugify(args.fileName)}`;
  const { error } = await supabaseAdmin.storage.from(EXPORT_BUCKET).upload(path, args.body, { contentType: args.contentType, upsert: false });
  if (error) throw new Error(error.message);
  return path;
}

async function findExistingExport(args: { userId: string; toolUsageId: string; format: ExportFormat }) {
  const { data, error } = await supabaseAdmin
    .from("generation_history")
    .select("id,storage_path,file_type,metadata,created_at")
    .eq("user_id", args.userId)
    .eq("tool_usage_id", args.toolUsageId)
    .eq("file_type", args.format)
    .not("storage_path", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<ExistingExportRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
}

export async function createExportForToolUsage(args: { userId: string; toolUsageId: string; format: ExportFormat }) {
  const existingExport = await findExistingExport(args);
  if (existingExport?.storage_path) {
    const existingFileName =
      typeof existingExport.metadata === "object" && existingExport.metadata && "fileName" in existingExport.metadata
        ? String(existingExport.metadata.fileName)
        : `export.${existingExport.file_type ?? "bin"}`;

    return {
      id: existingExport.id,
      fileType: existingExport.file_type,
      storagePath: existingExport.storage_path,
      createdAt: existingExport.created_at,
      signedUrl: await createSignedDownloadUrl({ path: existingExport.storage_path, downloadName: existingFileName }),
      fileName: existingFileName,
    };
  }

  const { data: usage, error } = await supabaseAdmin
    .from("tool_usage")
    .select("id,user_id,tool_id,tool_name,output,created_at")
    .eq("id", args.toolUsageId)
    .eq("user_id", args.userId)
    .single<ToolUsageRow>();
  if (error || !usage) throw new Error(error?.message ?? "Generation not found.");

  const tool = getToolDefinition(usage.tool_id);
  const allowedFormats = tool?.exportFormats ?? ["json"];
  if (!allowedFormats.includes(args.format)) throw new Error("Requested export format is not supported for this tool.");

  const baseName = `${slugify(usage.tool_name || usage.tool_id)}-${usage.id}`;
  let bytes: Buffer;
  let contentType = "application/octet-stream";
  const extension = args.format;

  if (args.format === "json") {
    bytes = Buffer.from(JSON.stringify(usage.output, null, 2), "utf-8");
    contentType = "application/json";
  } else if (args.format === "txt") {
    bytes = Buffer.from(formatOutputAsText(usage.tool_id, usage.tool_name, usage.output), "utf-8");
    contentType = "text/plain; charset=utf-8";
  } else if (args.format === "md") {
    bytes = Buffer.from(formatOutputAsMarkdown(usage.tool_id, usage.tool_name, usage.output), "utf-8");
    contentType = "text/markdown; charset=utf-8";
  } else if (args.format === "pdf") {
    bytes = await buildProfessionalPdf({
      title: usage.tool_name,
      subtitle: `Professional export • ${new Date(usage.created_at).toLocaleString()}`,
      content: formatOutputAsMarkdown(usage.tool_id, usage.tool_name, usage.output),
    });
    contentType = "application/pdf";
  } else {
    throw new Error("PNG exports require generated image output.");
  }

  const storagePath = await uploadToStorage({
    userId: args.userId,
    fileName: `${baseName}.${extension}`,
    contentType,
    body: bytes,
  });

  const fileName = `${baseName}.${extension}`;
  const { data: record, error: recordError } = await supabaseAdmin
    .from("generation_history")
    .insert({
      user_id: args.userId,
      tool_usage_id: usage.id,
      tool_id: usage.tool_id,
      storage_path: storagePath,
      file_type: args.format,
      metadata: { bucket: EXPORT_BUCKET, fileName, generatedAt: new Date().toISOString() },
    })
    .select("id,storage_path,file_type,metadata,created_at")
    .single<{ id: string; storage_path: string | null; file_type: string | null; metadata: Json | null; created_at: string }>();
  if (recordError || !record?.storage_path) throw new Error(recordError?.message ?? "Failed to save export record.");

  return {
    id: record.id,
    fileType: record.file_type,
    storagePath: record.storage_path,
    createdAt: record.created_at,
    signedUrl: await createSignedDownloadUrl({ path: record.storage_path, downloadName: fileName }),
    fileName,
  };
}

export async function getSignedExportForUser(args: { userId: string; exportId: string }) {
  const { data, error } = await supabaseAdmin
    .from("generation_history")
    .select("id,user_id,storage_path,file_type,metadata")
    .eq("id", args.exportId)
    .eq("user_id", args.userId)
    .not("storage_path", "is", null)
    .single<{ id: string; user_id: string; storage_path: string | null; file_type: string | null; metadata: Json | null }>();
  if (error || !data?.storage_path) throw new Error(error?.message ?? "Export not found.");
  const fileName = typeof data.metadata === "object" && data.metadata && "fileName" in data.metadata ? String(data.metadata.fileName) : `export.${data.file_type ?? "bin"}`;
  return { signedUrl: await createSignedDownloadUrl({ path: data.storage_path, downloadName: fileName }), fileType: data.file_type, fileName };
}

export async function deleteExportForUser(args: { userId: string; exportId: string }) {
  const { data, error } = await supabaseAdmin
    .from("generation_history")
    .select("id,user_id,storage_path")
    .eq("id", args.exportId)
    .eq("user_id", args.userId)
    .single<{ id: string; user_id: string; storage_path: string | null }>();
  if (error || !data) throw new Error(error?.message ?? "Export not found.");
  if (data.storage_path) {
    const { error: storageError } = await supabaseAdmin.storage.from(EXPORT_BUCKET).remove([data.storage_path]);
    if (storageError) throw new Error(storageError.message);
  }
  const { error: deleteError } = await supabaseAdmin.from("generation_history").delete().eq("id", args.exportId).eq("user_id", args.userId);
  if (deleteError) throw new Error(deleteError.message);
}

export async function deleteGenerationForUser(args: { userId: string; generationId: string }) {
  const { data: files, error: filesError } = await supabaseAdmin
    .from("generation_history")
    .select("id,storage_path")
    .eq("user_id", args.userId)
    .eq("tool_usage_id", args.generationId)
    .not("storage_path", "is", null);
  if (filesError) throw new Error(filesError.message);
  for (const file of files ?? []) {
    if (file.storage_path) {
      const { error: storageError } = await supabaseAdmin.storage.from(EXPORT_BUCKET).remove([file.storage_path]);
      if (storageError) throw new Error(storageError.message);
    }
  }
  const { error: historyDeleteError } = await supabaseAdmin.from("generation_history").delete().eq("user_id", args.userId).eq("tool_usage_id", args.generationId);
  if (historyDeleteError) throw new Error(historyDeleteError.message);
  const { error: usageDeleteError } = await supabaseAdmin.from("tool_usage").delete().eq("id", args.generationId).eq("user_id", args.userId);
  if (usageDeleteError) throw new Error(usageDeleteError.message);
}
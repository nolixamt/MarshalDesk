import * as z from "zod";

export const sourceKindSchema = z.enum(["file", "text"]);
export type SourceKind = z.infer<typeof sourceKindSchema>;

export const sourceStatusSchema = z.enum([
  "uploaded",
  "processing",
  "ready",
  "failed",
]);
export type SourceStatus = z.infer<typeof sourceStatusSchema>;

export const SOURCE_FILE_MAX_BYTES = 10 * 1024 * 1024;

export const sourceFileTypes = ["pdf", "md", "txt"] as const;
export type SourceFileType = (typeof sourceFileTypes)[number];

export const sourceSchema = z.object({
  id: z.string(),
  kind: sourceKindSchema,
  name: z.string(),
  sizeBytes: z.number().int().nonnegative().nullable(),
  status: sourceStatusSchema,
  error: z.string().nullable(),
  createdAt: z.iso.datetime(),
});
export type Source = z.infer<typeof sourceSchema>;

export function sourceFileType(fileName: string): SourceFileType | null {
  const extension = fileName.split(".").pop()?.toLowerCase();
  return sourceFileTypes.find((type) => type === extension) ?? null;
}

// Re-checked on the server when the presigned URL is issued; this only gives instant feedback.
export function validateSourceFile(file: {
  name: string;
  size: number;
}): string | null {
  if (sourceFileType(file.name) === null) {
    return "Only PDF, Markdown and text files are supported.";
  }
  if (file.size === 0) {
    return "This file is empty.";
  }
  if (file.size > SOURCE_FILE_MAX_BYTES) {
    return "This file is larger than 10 MB.";
  }
  return null;
}

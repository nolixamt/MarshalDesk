import * as z from "zod";

export const widgetPositionSchema = z.enum(["bottom-left", "bottom-right"]);
export type WidgetPosition = z.infer<typeof widgetPositionSchema>;

export const accentColorSchema = z.enum([
  "blue",
  "indigo",
  "violet",
  "pink",
  "red",
  "orange",
  "green",
]);
export type AccentColor = z.infer<typeof accentColorSchema>;

// Every accent keeps white text at WCAG AA (4.5:1), so green and orange use their 700 shades.
export const accentColors: Record<
  AccentColor,
  { label: string; hex: string; foreground: string }
> = {
  blue: { label: "Blue", hex: "#2563eb", foreground: "#ffffff" },
  indigo: { label: "Indigo", hex: "#4f46e5", foreground: "#ffffff" },
  violet: { label: "Violet", hex: "#7c3aed", foreground: "#ffffff" },
  pink: { label: "Pink", hex: "#db2777", foreground: "#ffffff" },
  red: { label: "Red", hex: "#dc2626", foreground: "#ffffff" },
  orange: { label: "Orange", hex: "#c2410c", foreground: "#ffffff" },
  green: { label: "Green", hex: "#15803d", foreground: "#ffffff" },
};

export const AGENT_NAME_MAX_LENGTH = 40;
export const GREETING_MAX_LENGTH = 300;
export const MAX_SUGGESTED_QUESTIONS = 4;
export const MAX_ALLOWED_DOMAINS = 20;
export const DEFAULT_GREETING = "Hi there! How can we help you today?";

export function defaultAgentName(workspaceName: string): string {
  const suffix = " Agent";
  return `${workspaceName.slice(0, AGENT_NAME_MAX_LENGTH - suffix.length).trim()}${suffix}`;
}

export const hostnameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^(?=.{1,253}$)(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/,
    "Enter a domain like example.com, without https:// or a path",
  );

export const widgetSettingsSchema = z.object({
  position: widgetPositionSchema,
  color: accentColorSchema,
  agentName: z
    .string()
    .trim()
    .min(1, "Give your agent a name")
    .max(AGENT_NAME_MAX_LENGTH),
  agentAvatarUrl: z.url().nullable(),
  greeting: z
    .string()
    .trim()
    .min(1, "Write a greeting")
    .max(GREETING_MAX_LENGTH),
  allowedDomains: z
    .array(hostnameSchema)
    .max(MAX_ALLOWED_DOMAINS, `Add at most ${MAX_ALLOWED_DOMAINS} domains`)
    .refine(
      (domains) => new Set(domains).size === domains.length,
      "Each domain can only be added once",
    ),
});
export type WidgetSettings = z.infer<typeof widgetSettingsSchema>;

// The avatar is changed through the avatar procedures, never through a settings patch.
export const widgetSettingsPatchSchema = widgetSettingsSchema
  .omit({ agentAvatarUrl: true })
  .partial();
export type WidgetSettingsPatch = z.infer<typeof widgetSettingsPatchSchema>;

export const setupStepIdSchema = z.enum(["source", "domain", "snippet"]);
export type SetupStepId = z.infer<typeof setupStepIdSchema>;

export const setupProgressSchema = z.object({
  hasReadySource: z.boolean(),
  hasAllowedDomain: z.boolean(),
  snippetInstalled: z.boolean(),
});
export type SetupProgress = z.infer<typeof setupProgressSchema>;

export const widgetSettingsStateSchema = z.object({
  workspaceId: z.uuid(),
  settings: widgetSettingsSchema,
  setupProgress: setupProgressSchema,
});
export type WidgetSettingsState = z.infer<typeof widgetSettingsStateSchema>;

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export const avatarContentTypeSchema = z.enum([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);
export type AvatarContentType = z.infer<typeof avatarContentTypeSchema>;

export function avatarExtension(contentType: AvatarContentType): string {
  switch (contentType) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default: {
      const unreachable: never = contentType;
      return unreachable;
    }
  }
}

// Re-checked on the server twice: when the upload URL is issued and against the stored object.
export function validateAvatarFile(file: {
  type: string;
  size: number;
}): string | null {
  if (!avatarContentTypeSchema.safeParse(file.type).success) {
    return "Use a PNG, JPEG, WebP or GIF image.";
  }
  if (file.size === 0) {
    return "This image is empty.";
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return "This image is larger than 2 MB.";
  }
  return null;
}

export const createAvatarUploadInputSchema = z.object({
  contentType: avatarContentTypeSchema,
  size: z.number().int().positive().max(AVATAR_MAX_BYTES),
});
export type CreateAvatarUploadInput = z.infer<
  typeof createAvatarUploadInputSchema
>;

export const avatarUploadSchema = z.object({
  key: z.string(),
  uploadUrl: z.url(),
  // Sent with the PUT exactly as given: both are part of the signature.
  headers: z.object({
    "Content-Type": avatarContentTypeSchema,
    "Cache-Control": z.string(),
  }),
});
export type AvatarUpload = z.infer<typeof avatarUploadSchema>;

export const confirmAvatarUploadInputSchema = z.object({
  key: z.string().min(1).max(200),
});
export type ConfirmAvatarUploadInput = z.infer<
  typeof confirmAvatarUploadInputSchema
>;

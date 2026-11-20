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
  allowedDomains: z.array(hostnameSchema),
});
export type WidgetSettings = z.infer<typeof widgetSettingsSchema>;

export const setupStepIdSchema = z.enum(["source", "domain", "snippet"]);
export type SetupStepId = z.infer<typeof setupStepIdSchema>;

export const setupProgressSchema = z.object({
  hasReadySource: z.boolean(),
  hasAllowedDomain: z.boolean(),
  snippetInstalled: z.boolean(),
});
export type SetupProgress = z.infer<typeof setupProgressSchema>;

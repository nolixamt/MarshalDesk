"use client";

import { accentColors, type WidgetSettings } from "@marshaldesk/shared";
import { createContext, use, useMemo, useState } from "react";

import { mockWidgetSettings } from "@/lib/mock/widget-settings";

type WidgetSettingsContextValue = {
  settings: WidgetSettings;
  updateSettings: (patch: Partial<WidgetSettings>) => void;
};

const WidgetSettingsContext = createContext<WidgetSettingsContextValue | null>(
  null,
);

// Mock state shared by the dashboard pages until widget settings are persisted through oRPC.
export function WidgetSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState<WidgetSettings>(mockWidgetSettings);

  const value = useMemo<WidgetSettingsContextValue>(
    () => ({
      settings,
      updateSettings: (patch) =>
        setSettings((current) => ({ ...current, ...patch })),
    }),
    [settings],
  );

  return (
    <WidgetSettingsContext value={value}>{children}</WidgetSettingsContext>
  );
}

export function useWidgetSettings(): WidgetSettingsContextValue {
  const value = use(WidgetSettingsContext);
  if (!value) {
    throw new Error(
      "useWidgetSettings must be used inside WidgetSettingsProvider",
    );
  }
  return value;
}

export function DashboardAccentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings } = useWidgetSettings();
  const accent = accentColors[settings.color];

  const style = {
    "--brand": accent.hex,
    "--brand-foreground": accent.foreground,
    "--primary": "var(--brand)",
    "--primary-foreground": "var(--brand-foreground)",
    "--ring": "var(--brand)",
    "--sidebar-primary": "var(--brand)",
    "--sidebar-primary-foreground": "var(--brand-foreground)",
    "--sidebar-ring": "var(--brand)",
  } as React.CSSProperties;

  return (
    <div className="contents" style={style}>
      {children}
    </div>
  );
}

export function DashboardAccentWash() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 rounded-t-[inherit] bg-[radial-gradient(ellipse_70%_100%_at_70%_0%,color-mix(in_oklab,var(--brand)_14%,transparent),transparent_70%)] transition-[background] duration-300"
    />
  );
}

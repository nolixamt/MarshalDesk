"use client";

import {
  accentColors,
  type SetupProgress,
  type WidgetSettings,
  type WidgetSettingsPatch,
} from "@marshaldesk/shared";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { client, orpc } from "@/lib/orpc/client";

const TEXT_SAVE_DELAY_MS = 800;

export type SaveStatus = "idle" | "saving" | "saved" | "error";

type UpdateOptions = { debounce?: boolean };

type WidgetSettingsContextValue = {
  workspaceId: string;
  settings: WidgetSettings;
  setupProgress: SetupProgress;
  saveStatus: SaveStatus;
  updateSettings: (patch: WidgetSettingsPatch, options?: UpdateOptions) => void;
  discardUnsaved: (fields: (keyof WidgetSettingsPatch)[]) => void;
  retrySave: () => void;
};

const WidgetSettingsContext = createContext<WidgetSettingsContextValue | null>(
  null,
);

function isEmptyPatch(patch: WidgetSettingsPatch): boolean {
  return Object.keys(patch).length === 0;
}

function patchKeys(patch: WidgetSettingsPatch): (keyof WidgetSettingsPatch)[] {
  return Object.keys(patch).filter((key): key is keyof WidgetSettingsPatch =>
    Object.hasOwn(patch, key),
  );
}

function omitKeys(
  patch: WidgetSettingsPatch,
  keys: (keyof WidgetSettingsPatch)[],
): WidgetSettingsPatch {
  const next = { ...patch };
  for (const key of keys) {
    delete next[key];
  }
  return next;
}

export function WidgetSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const { data: saved } = useSuspenseQuery(
    orpc.widgetSettings.get.queryOptions(),
  );

  // Edits the server hasn't confirmed yet. They sit on top of the cached state,
  // so the preview and accent update before the save finishes.
  const [unsaved, setUnsaved] = useState<WidgetSettingsPatch>({});
  const unsavedRef = useRef<WidgetSettingsPatch>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  // One request in flight at a time; later edits wait in `pending` and are sent
  // together afterwards, so a slow earlier save never lands after a newer one.
  const pendingRef = useRef<WidgetSettingsPatch>({});
  const inFlightRef = useRef(false);
  const failedRef = useRef(false);
  const savedOnceRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const writeUnsaved = useCallback((next: WidgetSettingsPatch) => {
    unsavedRef.current = next;
    setUnsaved(next);
  }, []);

  const syncStatus = useCallback(() => {
    if (failedRef.current) {
      setSaveStatus("error");
    } else if (
      inFlightRef.current ||
      timerRef.current !== null ||
      !isEmptyPatch(pendingRef.current)
    ) {
      setSaveStatus("saving");
    } else {
      setSaveStatus(savedOnceRef.current ? "saved" : "idle");
    }
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const flush = useCallback(async () => {
    clearTimer();
    if (inFlightRef.current) {
      return;
    }
    while (!isEmptyPatch(pendingRef.current)) {
      const sent = pendingRef.current;
      pendingRef.current = {};
      inFlightRef.current = true;
      failedRef.current = false;
      syncStatus();

      try {
        const state = await client.widgetSettings.update(sent);
        // Avatars only change through the avatar procedures, whose responses update the cache;
        // an autosave that started before an upload would otherwise put the old avatar back.
        queryClient.setQueryData(
          orpc.widgetSettings.get.queryKey(),
          (cached) =>
            cached
              ? {
                  ...state,
                  settings: {
                    ...state.settings,
                    agentAvatarUrl: cached.settings.agentAvatarUrl,
                  },
                }
              : state,
        );
        // Keep anything edited after this request started: only drop values the
        // server now holds exactly as sent.
        const confirmed = patchKeys(sent).filter(
          (key) => unsavedRef.current[key] === sent[key],
        );
        writeUnsaved(omitKeys(unsavedRef.current, confirmed));
        savedOnceRef.current = true;
      } catch {
        pendingRef.current = { ...sent, ...pendingRef.current };
        failedRef.current = true;
        break;
      } finally {
        inFlightRef.current = false;
      }
    }
    syncStatus();
  }, [clearTimer, queryClient, syncStatus, writeUnsaved]);

  const updateSettings = useCallback(
    (patch: WidgetSettingsPatch, options?: UpdateOptions) => {
      writeUnsaved({ ...unsavedRef.current, ...patch });
      pendingRef.current = { ...pendingRef.current, ...patch };
      failedRef.current = false;
      if (options?.debounce) {
        clearTimer();
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          void flush();
        }, TEXT_SAVE_DELAY_MS);
        syncStatus();
      } else {
        void flush();
      }
    },
    [clearTimer, flush, syncStatus, writeUnsaved],
  );

  // Drops edits that never reached the server, e.g. when a field turns invalid,
  // so the last saved value shows again and nothing half-typed is sent.
  const discardUnsaved = useCallback(
    (fields: (keyof WidgetSettingsPatch)[]) => {
      pendingRef.current = omitKeys(pendingRef.current, fields);
      writeUnsaved(omitKeys(unsavedRef.current, fields));
      if (isEmptyPatch(pendingRef.current)) {
        clearTimer();
        failedRef.current = false;
      }
      syncStatus();
    },
    [clearTimer, syncStatus, writeUnsaved],
  );

  const retrySave = useCallback(() => {
    failedRef.current = false;
    void flush();
  }, [flush]);

  useEffect(() => clearTimer, [clearTimer]);

  const settings = useMemo<WidgetSettings>(
    () => ({ ...saved.settings, ...unsaved }),
    [saved.settings, unsaved],
  );

  const value = useMemo<WidgetSettingsContextValue>(
    () => ({
      workspaceId: saved.workspaceId,
      settings,
      setupProgress: saved.setupProgress,
      saveStatus,
      updateSettings,
      discardUnsaved,
      retrySave,
    }),
    [
      saved.workspaceId,
      saved.setupProgress,
      settings,
      saveStatus,
      updateSettings,
      discardUnsaved,
      retrySave,
    ],
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

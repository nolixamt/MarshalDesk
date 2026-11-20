"use client";

import type { Source, SourceStatus } from "@marshaldesk/shared";
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { mockSources } from "@/lib/mock/knowledge";

type KnowledgeContextValue = {
  sources: Source[];
  hasReadySource: boolean;
  addFiles: (files: File[]) => void;
  removeSource: (id: string) => void;
};

const KnowledgeContext = createContext<KnowledgeContextValue | null>(null);

const PROCESSING_AFTER_MS = 700;
const READY_AFTER_MS = 3200;

// Mock state: it walks a dropped file through uploaded, processing and ready like the ingest function will.
export function KnowledgeProvider({ children }: { children: React.ReactNode }) {
  const [sources, setSources] = useState<Source[]>(mockSources);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const setStatus = useCallback((id: string, status: SourceStatus) => {
    setSources((current) =>
      current.map((source) =>
        source.id === id ? { ...source, status } : source,
      ),
    );
  }, []);

  const addFiles = useCallback(
    (files: File[]) => {
      const added: Source[] = files.map((file) => ({
        id: crypto.randomUUID(),
        kind: "file",
        name: file.name,
        sizeBytes: file.size,
        status: "uploaded",
        error: null,
        createdAt: new Date().toISOString(),
      }));

      // A file with the same name replaces the old version (PRD K-5).
      setSources((current) => [
        ...added,
        ...current.filter(
          (source) =>
            source.kind !== "file" ||
            !added.some((item) => item.name === source.name),
        ),
      ]);

      for (const source of added) {
        timers.current.push(
          window.setTimeout(
            () => setStatus(source.id, "processing"),
            PROCESSING_AFTER_MS,
          ),
          window.setTimeout(
            () => setStatus(source.id, "ready"),
            READY_AFTER_MS,
          ),
        );
      }
    },
    [setStatus],
  );

  const removeSource = useCallback((id: string) => {
    setSources((current) => current.filter((source) => source.id !== id));
  }, []);

  const value = useMemo<KnowledgeContextValue>(
    () => ({
      sources,
      hasReadySource: sources.some((source) => source.status === "ready"),
      addFiles,
      removeSource,
    }),
    [sources, addFiles, removeSource],
  );

  return <KnowledgeContext value={value}>{children}</KnowledgeContext>;
}

export function useKnowledge(): KnowledgeContextValue {
  const value = use(KnowledgeContext);
  if (!value) {
    throw new Error("useKnowledge must be used inside KnowledgeProvider");
  }
  return value;
}

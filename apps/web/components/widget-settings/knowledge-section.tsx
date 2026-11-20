"use client";

import {
  SOURCE_FILE_MAX_BYTES,
  sourceFileType,
  validateSourceFile,
  type Source,
  type SourceStatus,
} from "@marshaldesk/shared";
import { cn } from "cn";
import {
  CheckIcon,
  CircleAlertIcon,
  FileTextIcon,
  LoaderCircleIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";

import { Dropzone, type RejectedFile } from "@/components/dashboard/dropzone";
import { IconButton } from "@/components/dashboard/icon-button";
import { useKnowledge } from "@/components/dashboard/knowledge-context";
import { SettingsSection } from "@/components/dashboard/settings-section";
import { Badge } from "@/components/ui/badge";

const ACCEPT = ".pdf,.md,.txt,application/pdf,text/markdown,text/plain";

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StatusBadge({ status }: { status: SourceStatus }) {
  switch (status) {
    case "uploaded":
      return <Badge variant="secondary">Uploaded</Badge>;
    case "processing":
      return (
        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400">
          <LoaderCircleIcon className="animate-spin motion-reduce:animate-none" />
          Processing
        </Badge>
      );
    case "ready":
      return (
        <Badge className="bg-green-600/15 text-green-700 dark:text-green-400">
          <CheckIcon />
          Ready
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive">
          <CircleAlertIcon />
          Failed
        </Badge>
      );
    default: {
      const unreachable: never = status;
      return unreachable;
    }
  }
}

function SourceRow({
  source,
  onDelete,
}: {
  source: Source;
  onDelete: () => void;
}) {
  const type = sourceFileType(source.name);
  const meta = [
    source.sizeBytes === null ? null : formatBytes(source.sizeBytes),
    source.status === "failed" ? source.error : null,
  ].filter(Boolean);

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span
        aria-hidden
        className="flex size-10 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg bg-muted text-muted-foreground"
      >
        <FileTextIcon className="size-4" />
        <span className="text-[10px] leading-none font-medium">
          {type ?? "file"}
        </span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{source.name}</p>
        <p
          className={cn(
            "truncate text-xs text-muted-foreground",
            source.status === "failed" && "text-destructive",
          )}
        >
          {meta.join(" · ")}
        </p>
      </div>
      <StatusBadge status={source.status} />
      <IconButton
        label={`Delete ${source.name}`}
        onClick={onDelete}
        className="text-muted-foreground"
      >
        <Trash2Icon />
      </IconButton>
    </li>
  );
}

export function KnowledgeSection() {
  const { sources, addFiles, removeSource } = useKnowledge();
  const [rejected, setRejected] = useState<RejectedFile[]>([]);

  const readyCount = sources.filter(
    (source) => source.status === "ready",
  ).length;

  return (
    <SettingsSection
      id="knowledge"
      title="Knowledge base"
      description={
        readyCount > 0
          ? `The agent is on and answers from ${readyCount} ready ${readyCount === 1 ? "source" : "sources"}.`
          : "The agent is off until one source is ready. Visitors reach you instead."
      }
    >
      <div className="flex flex-col gap-3 p-4">
        <Dropzone
          accept={ACCEPT}
          validate={validateSourceFile}
          title="Drop files here"
          hint={`PDF, Markdown or text · up to ${SOURCE_FILE_MAX_BYTES / (1024 * 1024)} MB each`}
          onFiles={(accepted, rejectedFiles) => {
            setRejected(rejectedFiles);
            if (accepted.length > 0) {
              addFiles(accepted);
            }
          }}
        />
        {rejected.length > 0 && (
          <ul
            role="alert"
            className="flex flex-col gap-1 text-sm text-destructive"
          >
            {rejected.map((file) => (
              <li key={file.name}>
                <span className="font-medium">{file.name}</span>: {file.reason}
              </li>
            ))}
          </ul>
        )}
      </div>
      {sources.length > 0 ? (
        <ul className="divide-y divide-foreground/10">
          {sources.map((source) => (
            <SourceRow
              key={source.id}
              source={source}
              onDelete={() => removeSource(source.id)}
            />
          ))}
        </ul>
      ) : (
        <p className="px-4 py-3 text-sm text-muted-foreground">
          No sources yet. Add a file and your agent starts answering from it.
        </p>
      )}
    </SettingsSection>
  );
}

"use client";

import { cn } from "cn";
import { UploadIcon } from "lucide-react";
import { useId, useState } from "react";

export type RejectedFile = { name: string; reason: string };

export function Dropzone({
  accept,
  validate,
  onFiles,
  title = "Drop files here",
  hint,
  compact = false,
  multiple = true,
  disabled = false,
  className,
}: {
  accept: string;
  validate: (file: File) => string | null;
  onFiles: (accepted: File[], rejected: RejectedFile[]) => void;
  title?: string;
  hint?: string;
  compact?: boolean;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const inputId = useId();
  const [dragging, setDragging] = useState(false);

  function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) {
      return;
    }
    const accepted: File[] = [];
    const rejected: RejectedFile[] = [];
    for (const file of Array.from(list)) {
      const reason = validate(file);
      if (reason) {
        rejected.push({ name: file.name, reason });
      } else {
        accepted.push(file);
      }
    }
    onFiles(accepted, rejected);
  }

  return (
    <label
      htmlFor={inputId}
      aria-disabled={disabled || undefined}
      onDragEnter={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (!disabled) handleFiles(event.dataTransfer.files);
      }}
      className={cn(
        "flex cursor-pointer rounded-lg border border-dashed border-foreground/20 transition-colors *:pointer-events-none hover:bg-muted/60 has-focus-visible:ring-3 has-focus-visible:ring-ring/50 aria-disabled:cursor-not-allowed aria-disabled:opacity-60 aria-disabled:hover:bg-transparent",
        compact
          ? "items-center gap-3 px-3 py-2.5 text-left"
          : "flex-col items-center gap-1.5 px-4 py-8 text-center",
        dragging && "border-primary bg-muted",
        className,
      )}
    >
      <input
        id={inputId}
        type="file"
        multiple={multiple}
        disabled={disabled}
        accept={accept}
        className="sr-only"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
      {compact ? (
        <>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <UploadIcon className="size-4" />
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm font-medium">
              {dragging ? "Drop to add" : title}{" "}
              <span className="font-normal text-muted-foreground">
                or{" "}
                <span className="text-foreground underline">
                  {multiple ? "choose files" : "choose a file"}
                </span>
              </span>
            </span>
            {hint && (
              <span className="text-xs text-muted-foreground">{hint}</span>
            )}
          </span>
        </>
      ) : (
        <>
          <span className="mb-1 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <UploadIcon className="size-5" />
          </span>
          <span className="text-sm font-medium">
            {dragging ? "Drop to add" : title}{" "}
            <span className="font-normal text-muted-foreground">
              or{" "}
              <span className="text-foreground underline">
                {multiple ? "choose files" : "choose a file"}
              </span>
            </span>
          </span>
          {hint && (
            <span className="text-xs text-muted-foreground">{hint}</span>
          )}
        </>
      )}
    </label>
  );
}

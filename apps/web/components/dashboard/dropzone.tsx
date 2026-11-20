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
  className,
}: {
  accept: string;
  validate: (file: File) => string | null;
  onFiles: (accepted: File[], rejected: RejectedFile[]) => void;
  title?: string;
  hint?: string;
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
      onDragEnter={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        handleFiles(event.dataTransfer.files);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-dashed border-foreground/20 px-4 py-8 text-center transition-colors *:pointer-events-none hover:bg-muted/60 has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
        dragging && "border-primary bg-muted",
        className,
      )}
    >
      <input
        id={inputId}
        type="file"
        multiple
        accept={accept}
        className="sr-only"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <span className="mb-1 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <UploadIcon className="size-5" />
      </span>
      <span className="text-sm font-medium">
        {dragging ? "Drop to add" : title}{" "}
        <span className="font-normal text-muted-foreground">
          or <span className="text-foreground underline">choose files</span>
        </span>
      </span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  accentColors,
  AGENT_NAME_MAX_LENGTH,
  AVATAR_MAX_BYTES,
  avatarContentTypeSchema,
  GREETING_MAX_LENGTH,
  validateAvatarFile,
  widgetSettingsSchema,
  type WidgetSettingsState,
} from "@marshaldesk/shared";
import { ORPCError } from "@orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LoaderCircleIcon } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type * as z from "zod";

import { Dropzone } from "@/components/dashboard/dropzone";
import {
  SettingsRow,
  SettingsSection,
} from "@/components/dashboard/settings-section";
import { useWidgetSettings } from "@/components/dashboard/widget-settings-context";
import { resolveAgentAvatarUrl } from "@/components/widget/widget-theme";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { client, orpc } from "@/lib/orpc/client";

const agentFormSchema = widgetSettingsSchema.pick({
  agentName: true,
  greeting: true,
});
type AgentFormInput = z.input<typeof agentFormSchema>;
type AgentFormOutput = z.output<typeof agentFormSchema>;

const AVATAR_ACCEPT = avatarContentTypeSchema.options.join(",");
const AVATAR_HINT = `PNG, JPEG, WebP or GIF · up to ${AVATAR_MAX_BYTES / (1024 * 1024)} MB`;

class AvatarUploadFailed extends Error {}

async function uploadAvatarFile(file: File): Promise<WidgetSettingsState> {
  const contentType = avatarContentTypeSchema.parse(file.type);
  const upload = await client.widgetSettings.createAvatarUpload({
    contentType,
    size: file.size,
  });
  const response = await fetch(upload.uploadUrl, {
    method: "PUT",
    headers: upload.headers,
    body: file,
  });
  if (!response.ok) {
    throw new AvatarUploadFailed(`Upload failed with ${response.status}`);
  }
  return client.widgetSettings.confirmAvatarUpload({ key: upload.key });
}

function avatarErrorMessage(error: unknown): string {
  if (error instanceof ORPCError && error.code === "AVATAR_INVALID") {
    return error.message;
  }
  return "Couldn't upload this image. Check your connection and try again.";
}

function AvatarField() {
  const { settings } = useWidgetSettings();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  function saveState(state: WidgetSettingsState) {
    queryClient.setQueryData(orpc.widgetSettings.get.queryKey(), state);
  }

  const upload = useMutation({
    mutationFn: uploadAvatarFile,
    onMutate: () => setError(null),
    onSuccess: saveState,
    onError: (cause) => setError(avatarErrorMessage(cause)),
  });
  const remove = useMutation({
    mutationFn: () => client.widgetSettings.removeAvatar(),
    onMutate: () => setError(null),
    onSuccess: saveState,
    onError: () =>
      setError(
        "Couldn't remove the photo. Check your connection and try again.",
      ),
  });
  const busy = upload.isPending || remove.isPending;

  const avatarUrl = resolveAgentAvatarUrl(
    settings.agentName,
    settings.agentAvatarUrl,
    accentColors[settings.color],
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <Avatar size="lg" aria-busy={busy || undefined}>
          <AvatarImage src={avatarUrl} alt="" />
          <AvatarFallback>
            {settings.agentName.slice(0, 1).toUpperCase()}
          </AvatarFallback>
          {busy && (
            <span className="absolute inset-0 z-10 flex items-center justify-center rounded-full bg-background/70">
              <LoaderCircleIcon className="size-4 animate-spin text-muted-foreground motion-reduce:animate-none" />
            </span>
          )}
        </Avatar>
        <Dropzone
          compact
          multiple={false}
          disabled={busy}
          accept={AVATAR_ACCEPT}
          validate={validateAvatarFile}
          title={upload.isPending ? "Uploading…" : "Drop an image"}
          hint={AVATAR_HINT}
          className="min-w-0 flex-1"
          onFiles={(accepted, rejected) => {
            const [file] = accepted;
            if (file) {
              upload.mutate(file);
            } else if (rejected[0]) {
              setError(rejected[0].reason);
            }
          }}
        />
      </div>
      {(error || settings.agentAvatarUrl) && (
        <div className="flex items-start justify-between gap-3">
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : (
            <span />
          )}
          {settings.agentAvatarUrl && (
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => remove.mutate()}
              className="shrink-0 text-muted-foreground"
            >
              {remove.isPending ? "Removing…" : "Remove photo"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function Counter({ length, max }: { length: number; max: number }) {
  return (
    <span className="text-xs text-muted-foreground tabular-nums">
      {length}/{max}
    </span>
  );
}

export function AgentSection() {
  const { settings, updateSettings, discardUnsaved } = useWidgetSettings();

  const form = useForm<AgentFormInput, unknown, AgentFormOutput>({
    resolver: zodResolver(agentFormSchema),
    mode: "onChange",
    defaultValues: {
      agentName: settings.agentName,
      greeting: settings.greeting,
    },
  });
  const { errors } = form.formState;

  const agentName = useWatch({ control: form.control, name: "agentName" });
  const greeting = useWatch({ control: form.control, name: "greeting" });

  const agentNameField = form.register("agentName", {
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = agentFormSchema.shape.agentName.safeParse(
        event.target.value,
      );
      if (parsed.success) {
        updateSettings({ agentName: parsed.data }, { debounce: true });
      } else {
        discardUnsaved(["agentName"]);
      }
    },
  });
  const greetingField = form.register("greeting", {
    onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const parsed = agentFormSchema.shape.greeting.safeParse(
        event.target.value,
      );
      if (parsed.success) {
        updateSettings({ greeting: parsed.data }, { debounce: true });
      } else {
        discardUnsaved(["greeting"]);
      }
    },
  });

  return (
    <SettingsSection
      id="agent"
      title="Agent"
      description="Who visitors talk to when they open the widget."
    >
      <SettingsRow
        label="Name"
        htmlFor="agent-name"
        description="Shown above every answer the agent gives."
      >
        <div className="flex flex-col gap-1.5">
          <Input
            id="agent-name"
            maxLength={AGENT_NAME_MAX_LENGTH}
            autoComplete="off"
            aria-invalid={!!errors.agentName}
            aria-describedby="agent-name-meta"
            {...agentNameField}
          />
          <div
            id="agent-name-meta"
            className="flex items-start justify-between gap-3"
          >
            <FieldError errors={[errors.agentName]} />
            <span className="ml-auto">
              <Counter length={agentName.length} max={AGENT_NAME_MAX_LENGTH} />
            </span>
          </div>
        </div>
      </SettingsRow>
      <SettingsRow
        label="Avatar"
        description="Made from your agent's name until you upload a photo."
      >
        <AvatarField />
      </SettingsRow>
      <SettingsRow
        label="Greeting"
        htmlFor="greeting"
        description="The first message visitors see when they open the widget."
      >
        <div className="flex flex-col gap-1.5">
          <Textarea
            id="greeting"
            rows={3}
            maxLength={GREETING_MAX_LENGTH}
            aria-invalid={!!errors.greeting}
            aria-describedby="greeting-meta"
            className="resize-none"
            {...greetingField}
          />
          <div
            id="greeting-meta"
            className="flex items-start justify-between gap-3"
          >
            <FieldError errors={[errors.greeting]} />
            <span className="ml-auto">
              <Counter length={greeting.length} max={GREETING_MAX_LENGTH} />
            </span>
          </div>
        </div>
      </SettingsRow>
    </SettingsSection>
  );
}

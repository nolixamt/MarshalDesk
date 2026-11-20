"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  accentColors,
  AGENT_NAME_MAX_LENGTH,
  GREETING_MAX_LENGTH,
  widgetSettingsSchema,
} from "@marshaldesk/shared";
import { UploadIcon } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import type * as z from "zod";

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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const agentFormSchema = widgetSettingsSchema.pick({
  agentName: true,
  greeting: true,
});
type AgentFormInput = z.input<typeof agentFormSchema>;
type AgentFormOutput = z.output<typeof agentFormSchema>;

function Counter({ length, max }: { length: number; max: number }) {
  return (
    <span className="text-xs text-muted-foreground tabular-nums">
      {length}/{max}
    </span>
  );
}

export function AgentSection() {
  const { settings, updateSettings } = useWidgetSettings();

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
        updateSettings({ agentName: parsed.data });
      }
    },
  });
  const greetingField = form.register("greeting", {
    onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const parsed = agentFormSchema.shape.greeting.safeParse(
        event.target.value,
      );
      if (parsed.success) {
        updateSettings({ greeting: parsed.data });
      }
    },
  });
  const avatarUrl = resolveAgentAvatarUrl(
    settings.agentName,
    settings.agentAvatarUrl,
    accentColors[settings.color],
  );

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
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            <AvatarImage src={avatarUrl} alt="" />
            <AvatarFallback>
              {settings.agentName.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  focusableWhenDisabled
                  className="aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
                />
              }
            >
              <UploadIcon />
              Upload
            </TooltipTrigger>
            <TooltipContent>Coming soon</TooltipContent>
          </Tooltip>
        </div>
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

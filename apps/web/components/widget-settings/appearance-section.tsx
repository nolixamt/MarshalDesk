"use client";

import {
  accentColorSchema,
  accentColors,
  widgetPositionSchema,
  type WidgetPosition,
} from "@marshaldesk/shared";
import { cn } from "cn";

import {
  SettingsRow,
  SettingsSection,
} from "@/components/dashboard/settings-section";
import { useWidgetSettings } from "@/components/dashboard/widget-settings-context";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

function positionLabel(position: WidgetPosition): string {
  switch (position) {
    case "bottom-left":
      return "Bottom left";
    case "bottom-right":
      return "Bottom right";
    default: {
      const unreachable: never = position;
      return unreachable;
    }
  }
}

function PositionSketch({ position }: { position: WidgetPosition }) {
  return (
    <span
      aria-hidden
      className="relative block h-16 w-24 overflow-hidden rounded-md bg-muted ring-1 ring-foreground/10"
    >
      <span className="absolute inset-x-0 top-0 flex h-3 items-center gap-0.5 border-b border-foreground/10 px-1.5">
        <span className="size-1 rounded-full bg-foreground/20" />
        <span className="size-1 rounded-full bg-foreground/20" />
        <span className="size-1 rounded-full bg-foreground/20" />
      </span>
      <span className="absolute top-5 left-2 h-1.5 w-10 rounded-full bg-foreground/10" />
      <span className="absolute top-8 left-2 h-1.5 w-14 rounded-full bg-foreground/10" />
      <span
        className={cn(
          "absolute bottom-1.5 size-3.5 rounded-full bg-primary",
          position === "bottom-left" ? "left-1.5" : "right-1.5",
        )}
      />
    </span>
  );
}

export function AppearanceSection() {
  const { settings, updateSettings } = useWidgetSettings();

  return (
    <SettingsSection
      id="appearance"
      title="Appearance"
      description="How the widget looks on your website."
    >
      <SettingsRow
        label="Position"
        labelId="position-label"
        description="The corner where the chat bubble sits."
      >
        <RadioGroup
          aria-labelledby="position-label"
          value={settings.position}
          onValueChange={(value) => {
            const parsed = widgetPositionSchema.safeParse(value);
            if (parsed.success) {
              updateSettings({ position: parsed.data });
            }
          }}
          className="flex flex-wrap gap-3"
        >
          {widgetPositionSchema.options.map((position) => (
            <label
              key={position}
              className="flex cursor-pointer flex-col items-start gap-2 rounded-lg p-2.5 ring-1 ring-foreground/10 transition-colors hover:bg-muted/50 has-focus-visible:ring-3 has-focus-visible:ring-ring/50 has-data-checked:ring-2 has-data-checked:ring-primary"
            >
              <PositionSketch position={position} />
              <span className="flex items-center gap-2 text-sm">
                <RadioGroupItem
                  value={position}
                  aria-label={positionLabel(position)}
                />
                {positionLabel(position)}
              </span>
            </label>
          ))}
        </RadioGroup>
      </SettingsRow>
      <SettingsRow
        label="Color"
        labelId="color-label"
        description="Used for the chat bubble, the visitor's messages and buttons. It colors your dashboard too."
      >
        <div className="flex flex-col gap-2">
          <RadioGroup
            aria-labelledby="color-label"
            value={settings.color}
            onValueChange={(value) => {
              const parsed = accentColorSchema.safeParse(value);
              if (parsed.success) {
                updateSettings({ color: parsed.data });
              }
            }}
            className="flex flex-wrap gap-2.5"
          >
            {accentColorSchema.options.map((color) => {
              const accent = accentColors[color];
              return (
                <RadioGroupItem
                  key={color}
                  value={color}
                  aria-label={accent.label}
                  className="size-7 border-0 transition-shadow duration-150 after:-inset-1 dark:bg-(--swatch) data-checked:shadow-[0_0_0_2px_var(--card),0_0_0_4px_var(--swatch)] dark:data-checked:bg-(--swatch) [&_[data-slot=radio-group-indicator]]:size-7"
                  style={
                    {
                      "--swatch": accent.hex,
                      backgroundColor: accent.hex,
                    } as React.CSSProperties
                  }
                />
              );
            })}
          </RadioGroup>
          <p className="text-sm text-muted-foreground">
            {accentColors[settings.color].label}
          </p>
        </div>
      </SettingsRow>
    </SettingsSection>
  );
}

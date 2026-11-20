"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { hostnameSchema } from "@marshaldesk/shared";
import { GlobeIcon, XIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { IconButton } from "@/components/dashboard/icon-button";
import {
  SettingsRow,
  SettingsSection,
} from "@/components/dashboard/settings-section";
import { useWidgetSettings } from "@/components/dashboard/widget-settings-context";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const domainFormSchema = z.object({ domain: hostnameSchema });
type DomainFormInput = z.input<typeof domainFormSchema>;
type DomainFormOutput = z.output<typeof domainFormSchema>;

export function AllowedDomainsSection() {
  const { settings, updateSettings } = useWidgetSettings();
  const domains = settings.allowedDomains;

  const form = useForm<DomainFormInput, unknown, DomainFormOutput>({
    resolver: zodResolver(domainFormSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: { domain: "" },
  });
  const { errors } = form.formState;

  function addDomain({ domain }: DomainFormOutput) {
    if (domains.includes(domain)) {
      form.setError("domain", { message: `${domain} is already on the list` });
      return;
    }
    updateSettings({ allowedDomains: [...domains, domain] });
    form.reset();
  }

  function removeDomain(domain: string) {
    updateSettings({
      allowedDomains: domains.filter((item) => item !== domain),
    });
  }

  const domainField = form.register("domain", {
    onChange: () => form.clearErrors("domain"),
  });

  return (
    <SettingsSection
      id="allowed-domains"
      title="Allowed domains"
      description="The widget only loads on these websites."
    >
      <SettingsRow
        label="Domains"
        htmlFor="new-domain"
        description={
          <>
            Add each domain and subdomain separately, like example.com and
            www.example.com.{" "}
            <code className="font-mono text-xs">localhost</code> works
            automatically during development.
          </>
        }
      >
        <div className="flex flex-col gap-3">
          {domains.length > 0 ? (
            <ul className="divide-y divide-foreground/10 rounded-lg ring-1 ring-foreground/10">
              {domains.map((domain) => (
                <li
                  key={domain}
                  className="flex items-center gap-2.5 py-1 pr-1 pl-3 text-sm"
                >
                  <GlobeIcon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{domain}</span>
                  <IconButton
                    label={`Remove ${domain}`}
                    onClick={() => removeDomain(domain)}
                    side="left"
                  >
                    <XIcon />
                  </IconButton>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg border border-dashed border-foreground/15 px-3 py-2.5 text-sm text-muted-foreground">
              No allowed domains yet. Add one so the widget can load on your
              website.
            </p>
          )}
          <form
            noValidate
            onSubmit={form.handleSubmit(addDomain)}
            className="flex flex-col gap-1.5"
          >
            <div className="flex gap-2">
              <Input
                id="new-domain"
                placeholder="example.com"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                aria-invalid={!!errors.domain}
                aria-describedby="new-domain-error"
                {...domainField}
              />
              <Button type="submit" variant="outline">
                Add
              </Button>
            </div>
            <FieldError id="new-domain-error" errors={[errors.domain]} />
          </form>
        </div>
      </SettingsRow>
    </SettingsSection>
  );
}

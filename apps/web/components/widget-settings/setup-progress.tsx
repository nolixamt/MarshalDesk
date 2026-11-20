"use client";

import type { SetupStepId } from "@marshaldesk/shared";
import { cn } from "cn";
import { CheckIcon, ChevronRightIcon } from "lucide-react";

import { useKnowledge } from "@/components/dashboard/knowledge-context";
import { useWidgetSettings } from "@/components/dashboard/widget-settings-context";
import { mockSetupProgress } from "@/lib/mock/widget-settings";

type Step = { id: SetupStepId; title: string; href: string; done: boolean };

function stepCopy(id: SetupStepId): { title: string; href: string } {
  switch (id) {
    case "source":
      return {
        title: "Add a source to your knowledge base",
        href: "#knowledge",
      };
    case "domain":
      return { title: "Add an allowed domain", href: "#allowed-domains" };
    case "snippet":
      return { title: "Install the snippet on your website", href: "#install" };
    default: {
      const unreachable: never = id;
      return unreachable;
    }
  }
}

export function SetupProgress() {
  const { settings } = useWidgetSettings();
  const { hasReadySource } = useKnowledge();

  const done: Record<SetupStepId, boolean> = {
    source: hasReadySource,
    domain: settings.allowedDomains.length > 0,
    snippet: mockSetupProgress.snippetInstalled,
  };
  const steps: Step[] = (["source", "domain", "snippet"] as const).map(
    (id) => ({ id, ...stepCopy(id), done: done[id] }),
  );
  const doneCount = steps.filter((step) => step.done).length;
  const nextId = steps.find((step) => !step.done)?.id;

  if (!nextId) {
    return null;
  }

  return (
    <section
      aria-labelledby="setup-progress-heading"
      className="rounded-xl bg-card ring-1 ring-foreground/10"
    >
      <div className="flex items-center justify-between gap-4 px-4 pt-4 pb-3">
        <div>
          <h2
            id="setup-progress-heading"
            className="font-semibold tracking-[-0.01em]"
          >
            Finish setting up
          </h2>
          <p className="text-sm text-muted-foreground">
            {doneCount} of {steps.length} done. A few steps until your agent
            answers visitors on your website.
          </p>
        </div>
        <div aria-hidden className="flex shrink-0 gap-1.5">
          {steps.map((step) => (
            <span
              key={step.id}
              className={cn(
                "size-2 rounded-full transition-colors duration-300",
                step.done ? "bg-primary" : "bg-foreground/15",
              )}
            />
          ))}
        </div>
      </div>
      <ol className="flex flex-col gap-1 px-2 pb-2">
        {steps.map((step, index) => {
          const isNext = step.id === nextId;
          return (
            <li key={step.id}>
              <a
                href={step.href}
                aria-current={isNext ? "step" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
                  isNext && "bg-muted font-medium",
                )}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full text-xs",
                    step.done && "bg-primary text-primary-foreground",
                    isNext && "text-primary ring-2 ring-primary",
                    !step.done &&
                      !isNext &&
                      "text-muted-foreground ring-1 ring-foreground/20",
                  )}
                >
                  {step.done ? <CheckIcon className="size-3" /> : index + 1}
                </span>
                <span
                  className={cn(
                    "flex-1",
                    step.done &&
                      "text-muted-foreground line-through decoration-foreground/30",
                  )}
                >
                  {step.title}
                  {step.done && <span className="sr-only"> (done)</span>}
                </span>
                <ChevronRightIcon
                  className={cn(
                    "size-4 text-muted-foreground transition-opacity",
                    isNext
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100",
                  )}
                />
              </a>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

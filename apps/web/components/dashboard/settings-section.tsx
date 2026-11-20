import { cn } from "cn";

export function SettingsSection({
  id,
  title,
  description,
  children,
  className,
}: {
  id?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const headingId = id ? `${id}-heading` : undefined;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn("flex scroll-mt-6 flex-col gap-3", className)}
    >
      <div>
        <h2 id={headingId} className="font-semibold tracking-[-0.01em]">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="@container/settings divide-y divide-foreground/10 rounded-xl bg-card ring-1 ring-foreground/10">
        {children}
      </div>
    </section>
  );
}

export function SettingsRow({
  label,
  labelId,
  htmlFor,
  description,
  children,
  className,
}: {
  label: string;
  labelId?: string;
  htmlFor?: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 p-4 @xl/settings:flex-row @xl/settings:items-start @xl/settings:justify-between @xl/settings:gap-8",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5 @xl/settings:max-w-64 @xl/settings:shrink-0">
        {htmlFor ? (
          <label id={labelId} htmlFor={htmlFor} className="text-sm font-medium">
            {label}
          </label>
        ) : (
          <p id={labelId} className="text-sm font-medium">
            {label}
          </p>
        )}
        {description && (
          <div className="text-sm text-muted-foreground">{description}</div>
        )}
      </div>
      <div className="min-w-0 @xl/settings:max-w-md @xl/settings:flex-1">
        {children}
      </div>
    </div>
  );
}

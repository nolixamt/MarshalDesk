import { cn } from "@/lib/utils";

export function FormAlert({
  message,
  className,
}: {
  message: string | null | undefined;
  className?: string;
}) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className={cn(
        "text-center text-sm text-balance text-destructive",
        className,
      )}
    >
      {message}
    </p>
  );
}

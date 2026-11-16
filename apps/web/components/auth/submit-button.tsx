import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SubmitButton({
  pending,
  pendingLabel,
  children,
  className,
  disabled,
  ...props
}: React.ComponentProps<typeof Button> & {
  pending: boolean;
  pendingLabel: string;
}) {
  return (
    <Button
      type="submit"
      variant="form-primary"
      size="field"
      disabled={pending || disabled}
      aria-busy={pending || undefined}
      className={cn("w-full", className)}
      {...props}
    >
      {pending ? (
        <>
          <LoaderCircle aria-hidden="true" className="animate-spin" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

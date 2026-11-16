"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PasswordInput(
  props: Omit<React.ComponentProps<typeof Input>, "type" | "variant">,
) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        variant="ink"
        type={visible ? "text" : "password"}
        className="pr-12"
      />
      <Button
        type="button"
        variant="form-ghost"
        size="icon"
        className="absolute top-1/2 right-2 -translate-y-1/2"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? <EyeOff /> : <Eye />}
      </Button>
    </div>
  );
}

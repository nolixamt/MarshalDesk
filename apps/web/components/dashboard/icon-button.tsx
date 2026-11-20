"use client";

import type { VariantProps } from "class-variance-authority";

import { Button, type buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type IconButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "aria-label" | "children"
> & {
  label: string;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  size?: VariantProps<typeof buttonVariants>["size"];
};

export function IconButton({
  label,
  children,
  side = "bottom",
  variant = "ghost",
  size = "icon-sm",
  ...props
}: IconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant={variant} size={size} aria-label={label} {...props} />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side={side} className="data-instant:animate-none">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

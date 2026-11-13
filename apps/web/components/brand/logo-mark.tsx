import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("size-8", className)}
    >
      <path
        d="M16 4C8.82 4 3 8.92 3 15c0 3.13 1.55 5.96 4.03 7.96L6 28l5.86-2.84A15 15 0 0 0 16 26c7.18 0 13-4.92 13-11S23.18 4 16 4Z"
        fill="currentColor"
      />
      <g fill="var(--logo-dots, #fff)">
        <circle cx="10.5" cy="15" r="2" />
        <circle cx="16" cy="15" r="2" />
        <circle cx="21.5" cy="15" r="2" />
      </g>
    </svg>
  );
}

"use client";

import { OTP_LENGTH } from "@marshaldesk/shared";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import type { Ref } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const half = OTP_LENGTH / 2;
const firstGroup = Array.from({ length: half }, (_, i) => i);
const secondGroup = Array.from(
  { length: OTP_LENGTH - half },
  (_, i) => i + half,
);

export function CodeInput({
  ref,
  id,
  value,
  onChange,
  onComplete,
  onBlur,
  invalid,
  disabled,
}: {
  ref?: Ref<HTMLInputElement>;
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  onBlur?: () => void;
  invalid?: boolean;
  disabled?: boolean;
}) {
  return (
    <InputOTP
      ref={ref}
      id={id}
      maxLength={OTP_LENGTH}
      pattern={REGEXP_ONLY_DIGITS}
      inputMode="numeric"
      autoComplete="one-time-code"
      autoFocus
      value={value}
      onChange={onChange}
      onComplete={onComplete}
      onBlur={onBlur}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      containerClassName="justify-center gap-1.5 xs:gap-2"
    >
      <InputOTPGroup className="gap-1 has-aria-invalid:ring-0 xs:gap-2">
        {firstGroup.map((index) => (
          <InputOTPSlot
            key={index}
            index={index}
            variant="ink"
            aria-invalid={invalid || undefined}
          />
        ))}
      </InputOTPGroup>
      <InputOTPSeparator className="text-ink-foreground/50" />
      <InputOTPGroup className="gap-1 has-aria-invalid:ring-0 xs:gap-2">
        {secondGroup.map((index) => (
          <InputOTPSlot
            key={index}
            index={index}
            variant="ink"
            aria-invalid={invalid || undefined}
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}

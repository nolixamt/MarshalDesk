"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  emailSchema,
  verifyEmailSchema,
  type VerifyEmailInput,
} from "@marshaldesk/shared";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { authClient } from "@/lib/auth/client";
import { authCall, authErrorMessage, isCodeError } from "./auth-errors";
import { AuthHeading } from "./auth-heading";
import { CodeInput } from "./code-input";
import { FormAlert } from "./form-alert";
import { ResendCode } from "./resend-code";
import { SubmitButton } from "./submit-button";

export function VerifyEmailForm() {
  const parsed = emailSchema.safeParse(useSearchParams().get("email") ?? "");

  if (!parsed.success) {
    return (
      <FieldGroup>
        <AuthHeading
          title="Verify your email"
          description="We couldn't tell which email to verify."
        />
        <FieldDescription className="text-center">
          <Link href="/auth/sign-in">Back to sign in</Link>
        </FieldDescription>
      </FieldGroup>
    );
  }

  return <VerifyEmailCode email={parsed.data} />;
}

function VerifyEmailCode({ email }: { email: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<VerifyEmailInput>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { otp: "" },
  });
  const { errors, isSubmitting } = form.formState;
  const otpError = errors.otp?.message;

  // The code input is disabled while submitting, so focus once it's enabled again.
  useEffect(() => {
    if (otpError && !isSubmitting) form.setFocus("otp");
  }, [form, otpError, isSubmitting]);

  async function onSubmit({ otp }: VerifyEmailInput) {
    setServerError(null);
    const { error } = await authCall(
      authClient.emailOtp.verifyEmail({ email, otp }),
    );
    if (error) {
      if (isCodeError(error)) form.setValue("otp", "");
      form.setError("otp", { message: authErrorMessage(error) });
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  async function resend() {
    setServerError(null);
    form.clearErrors("otp");
    const { error } = await authCall(
      authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      }),
    );
    if (error) {
      setServerError(authErrorMessage(error));
      return false;
    }
    form.setValue("otp", "");
    return true;
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <AuthHeading
          title="Check your email"
          description={
            <>
              Enter the 6-digit code we sent to{" "}
              <span className="font-medium text-white">{email}</span>
            </>
          }
        />

        <Field data-invalid={!!errors.otp} className="items-center">
          <FieldLabel htmlFor="otp" className="sr-only">
            Verification code
          </FieldLabel>
          <Controller
            control={form.control}
            name="otp"
            render={({ field }) => (
              <CodeInput
                ref={field.ref}
                id="otp"
                value={field.value}
                onChange={(value) => {
                  form.clearErrors("otp");
                  field.onChange(value);
                }}
                onBlur={field.onBlur}
                onComplete={() => void form.handleSubmit(onSubmit)()}
                invalid={!!errors.otp}
                disabled={isSubmitting}
              />
            )}
          />
          <FieldError errors={[errors.otp]} className="text-center" />
        </Field>

        <FormAlert message={serverError} />

        <Field>
          <SubmitButton pending={isSubmitting} pendingLabel="Verifying…">
            Verify email
          </SubmitButton>
        </Field>

        <ResendCode onResend={resend} />

        <FieldDescription className="text-center">
          Wrong email? <Link href="/auth/sign-up">Start over</Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}

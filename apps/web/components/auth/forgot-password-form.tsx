"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  emailOnlySchema,
  PASSWORD_MIN_LENGTH,
  resetPasswordSchema,
  type EmailOnlyInput,
  type ResetPasswordInput,
} from "@marshaldesk/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";
import { authCall, authErrorMessage, isCodeError } from "./auth-errors";
import { AuthHeading } from "./auth-heading";
import { CodeInput } from "./code-input";
import { FormAlert } from "./form-alert";
import { PasswordInput } from "./password-input";
import { ResendCode } from "./resend-code";
import { SubmitButton } from "./submit-button";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState<string | null>(null);

  return email ? (
    <ResetPasswordStep email={email} onChangeEmail={() => setEmail(null)} />
  ) : (
    <RequestCodeStep onSent={setEmail} />
  );
}

function RequestCodeStep({ onSent }: { onSent: (email: string) => void }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<EmailOnlyInput>({
    resolver: zodResolver(emailOnlySchema),
    defaultValues: { email: "" },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit({ email }: EmailOnlyInput) {
    setServerError(null);
    const { error } = await authCall(
      authClient.emailOtp.requestPasswordReset({ email }),
    );
    if (error) {
      setServerError(authErrorMessage(error));
      return;
    }
    onSent(email);
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <AuthHeading
          title="Reset your password"
          description="Enter your email and we'll send you a code"
        />

        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            variant="ink"
            autoComplete="email"
            placeholder="you@business.com"
            aria-invalid={!!errors.email}
            {...form.register("email")}
          />
          <FieldError errors={[errors.email]} />
        </Field>

        <FormAlert message={serverError} />

        <Field>
          <SubmitButton pending={isSubmitting} pendingLabel="Sending code…">
            Send reset code
          </SubmitButton>
          <FieldDescription className="text-center">
            Remembered it? <Link href="/auth/sign-in">Back to sign in</Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}

function ResetPasswordStep({
  email,
  onChangeEmail,
}: {
  email: string;
  onChangeEmail: () => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onTouched",
    defaultValues: { otp: "", password: "" },
  });
  const { errors, isSubmitting } = form.formState;
  const otpError = errors.otp?.message;

  // The code input is disabled while submitting, so focus once it's enabled again.
  useEffect(() => {
    if (otpError && !isSubmitting) form.setFocus("otp");
  }, [form, otpError, isSubmitting]);

  async function onSubmit({ otp, password }: ResetPasswordInput) {
    setServerError(null);
    const { error } = await authCall(
      authClient.emailOtp.resetPassword({ email, otp, password }),
    );
    if (error) {
      if (isCodeError(error)) {
        form.setValue("otp", "");
        form.setError("otp", { message: authErrorMessage(error) });
      } else {
        setServerError(authErrorMessage(error));
      }
      return;
    }
    router.replace("/auth/sign-in?reset=1");
  }

  async function resend() {
    setServerError(null);
    form.clearErrors("otp");
    const { error } = await authCall(
      authClient.emailOtp.requestPasswordReset({ email }),
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
              Enter the code we sent to{" "}
              <span className="font-medium text-white">{email}</span> and choose
              a new password
            </>
          }
        />

        <Field data-invalid={!!errors.otp} className="items-center">
          <FieldLabel htmlFor="otp" className="sr-only">
            Reset code
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
                invalid={!!errors.otp}
                disabled={isSubmitting}
              />
            )}
          />
          <FieldError errors={[errors.otp]} className="text-center" />
        </Field>

        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">New password</FieldLabel>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...form.register("password")}
          />
          {errors.password ? (
            <FieldError errors={[errors.password]} />
          ) : (
            <FieldDescription>
              Use at least {PASSWORD_MIN_LENGTH} characters.
            </FieldDescription>
          )}
        </Field>

        <FormAlert message={serverError} />

        <Field>
          <SubmitButton
            pending={isSubmitting}
            pendingLabel="Updating password…"
          >
            Update password
          </SubmitButton>
        </Field>

        <ResendCode onResend={resend} />

        <Button
          type="button"
          variant="link"
          className="mx-auto h-auto p-0 text-muted-foreground hover:text-white"
          onClick={onChangeEmail}
        >
          Use a different email
        </Button>
      </FieldGroup>
    </form>
  );
}

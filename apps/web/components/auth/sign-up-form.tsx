"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  PASSWORD_MIN_LENGTH,
  signUpSchema,
  type SignUpInput,
} from "@marshaldesk/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";
import { authCall, authErrorMessage } from "./auth-errors";
import { verifyEmailHref } from "./auth-links";
import { AuthHeading } from "./auth-heading";
import { FormAlert } from "./form-alert";
import { GoogleButton } from "./google-button";
import { PasswordInput } from "./password-input";
import { SubmitButton } from "./submit-button";

export function SignUpForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    mode: "onTouched",
    defaultValues: { name: "", email: "", password: "" },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: SignUpInput) {
    setServerError(null);
    const { error } = await authCall(authClient.signUp.email(values));
    if (error) {
      setServerError(authErrorMessage(error));
      return;
    }
    router.push(verifyEmailHref(values.email));
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <AuthHeading
          title="Create your account"
          description="Set up your agent in a few minutes"
        />

        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="name">Your name</FieldLabel>
          <Input
            id="name"
            variant="ink"
            autoComplete="name"
            placeholder="Alex Rivera"
            aria-invalid={!!errors.name}
            {...form.register("name")}
          />
          <FieldError errors={[errors.name]} />
        </Field>

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

        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
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
          <SubmitButton pending={isSubmitting} pendingLabel="Creating account…">
            Create account
          </SubmitButton>
        </Field>

        <FieldSeparator>Or continue with</FieldSeparator>

        <Field className="gap-3">
          <GoogleButton disabled={isSubmitting} onError={setServerError} />
          <FieldDescription className="text-center">
            Already have an account? <Link href="/auth/sign-in">Sign in</Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}

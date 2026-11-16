"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  emailSchema,
  signInSchema,
  type SignInInput,
} from "@marshaldesk/shared";
import { CircleCheck, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient, dashboardCallbackUrl } from "@/lib/auth/client";
import { authCall, authErrorMessage } from "./auth-errors";
import { magicLinkErrorCallbackUrl, verifyEmailHref } from "./auth-links";
import { AuthHeading } from "./auth-heading";
import { FormAlert } from "./form-alert";
import { GoogleButton } from "./google-button";
import { PasswordInput } from "./password-input";
import { SubmitButton } from "./submit-button";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const passwordReset = searchParams.get("reset") === "1";
  const magicLinkFailed =
    searchParams.get("link") === "expired" || searchParams.has("error");

  const [serverError, setServerError] = useState<string | null>(null);
  const [magicPending, setMagicPending] = useState(false);
  const [magicLinkSentTo, setMagicLinkSentTo] = useState<string | null>(null);

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });
  const { errors, isSubmitting } = form.formState;
  const busy = isSubmitting || magicPending;

  async function onSubmit(values: SignInInput) {
    setServerError(null);
    const { error } = await authCall(authClient.signIn.email(values));

    if (!error) {
      router.replace("/dashboard");
      router.refresh();
      return;
    }

    if (error.code === "EMAIL_NOT_VERIFIED") {
      const sent = await authCall(
        authClient.emailOtp.sendVerificationOtp({
          email: values.email,
          type: "email-verification",
        }),
      );
      if (sent.error) {
        setServerError(authErrorMessage(sent.error));
        return;
      }
      router.push(verifyEmailHref(values.email));
      return;
    }

    setServerError(authErrorMessage(error));
  }

  async function sendMagicLink() {
    setServerError(null);
    form.clearErrors("password");
    const valid = await form.trigger("email");
    if (!valid) return;

    const email = emailSchema.parse(form.getValues("email"));
    setMagicPending(true);
    const { error } = await authCall(
      authClient.signIn.magicLink({
        email,
        callbackURL: dashboardCallbackUrl,
        errorCallbackURL: magicLinkErrorCallbackUrl,
      }),
    );
    setMagicPending(false);

    if (error) {
      setServerError(authErrorMessage(error));
      return;
    }
    setMagicLinkSentTo(email);
  }

  if (magicLinkSentTo) {
    return (
      <FieldGroup>
        <AuthHeading
          title="Check your email"
          description={
            <>
              We sent a sign-in link to{" "}
              <span className="font-medium text-white">{magicLinkSentTo}</span>.
              Open it on this device to sign in.
            </>
          }
        />
        <Button
          type="button"
          variant="form-secondary"
          size="field"
          className="w-full"
          onClick={() => setMagicLinkSentTo(null)}
        >
          Back to sign in
        </Button>
      </FieldGroup>
    );
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <AuthHeading
          title="Welcome back"
          description="Sign in to your MarshalDesk workspace"
        />

        {passwordReset && (
          <p className="flex items-center justify-center gap-2 text-center text-sm text-ink-muted">
            <CircleCheck aria-hidden="true" className="size-4 shrink-0" />
            Password updated. Sign in with your new password.
          </p>
        )}

        {magicLinkFailed && (
          <FormAlert message="That sign-in link has expired or was already used. Send a new one." />
        )}

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
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Link
              href="/auth/forgot-password"
              className="ml-auto text-sm text-muted-foreground underline-offset-4 outline-none hover:text-white hover:underline focus-visible:underline"
            >
              Forgot your password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            {...form.register("password")}
          />
          <FieldError errors={[errors.password]} />
        </Field>

        <FormAlert message={serverError} />

        <Field>
          <SubmitButton
            pending={isSubmitting}
            pendingLabel="Signing in…"
            disabled={busy}
          >
            Sign in
          </SubmitButton>
        </Field>

        <FieldSeparator>Or continue with</FieldSeparator>

        <Field className="gap-3">
          <Button
            type="button"
            variant="form-secondary"
            size="field"
            className="w-full"
            disabled={busy}
            onClick={sendMagicLink}
          >
            {magicPending && (
              <LoaderCircle aria-hidden="true" className="animate-spin" />
            )}
            {magicPending ? "Sending link…" : "Email me a sign-in link"}
          </Button>
          <GoogleButton disabled={busy} onError={setServerError} />
          <FieldDescription className="text-center">
            Don&apos;t have an account?{" "}
            <Link href="/auth/sign-up">Sign up</Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}

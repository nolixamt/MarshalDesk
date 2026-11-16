"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  personNameSchema,
  welcomeSchema,
  type WelcomeInput,
} from "@marshaldesk/shared";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";
import { orpc } from "@/lib/orpc/client";
import { authCall, authErrorMessage } from "./auth-errors";
import { AuthHeading } from "./auth-heading";
import { FormAlert } from "./form-alert";
import { SubmitButton } from "./submit-button";

const withNameSchema = welcomeSchema.extend({ name: personNameSchema });

type WelcomeFormProps = { needsName: boolean; email: string };

export function WelcomeForm({ needsName, email }: WelcomeFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const createWorkspace = useMutation(orpc.workspace.create.mutationOptions());

  const form = useForm<WelcomeInput>({
    resolver: zodResolver(needsName ? withNameSchema : welcomeSchema),
    mode: "onTouched",
    defaultValues: needsName
      ? { workspaceName: "", name: "" }
      : { workspaceName: "" },
  });
  const { errors, isSubmitting } = form.formState;
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    const { error } = await authCall(authClient.signOut());
    if (error) {
      setSigningOut(false);
      setServerError(authErrorMessage(error));
      return;
    }
    window.location.assign(new URL("/auth/sign-in", window.location.origin));
  }

  async function onSubmit({ workspaceName, name }: WelcomeInput) {
    setServerError(null);

    if (needsName && name) {
      const { error } = await authCall(authClient.updateUser({ name }));
      if (error) {
        setServerError(authErrorMessage(error));
        return;
      }
    }

    try {
      await createWorkspace.mutateAsync({ name: workspaceName });
    } catch {
      setServerError("We couldn't create your workspace. Please try again.");
      return;
    }
    router.replace("/dashboard");
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <AuthHeading
          title="Welcome to MarshalDesk"
          description="Let's set up your workspace"
        />

        {needsName && (
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
        )}

        <Field data-invalid={!!errors.workspaceName}>
          <FieldLabel htmlFor="workspaceName">
            What&apos;s your business called?
          </FieldLabel>
          <Input
            id="workspaceName"
            variant="ink"
            autoComplete="organization"
            placeholder="Acme Bakery"
            aria-invalid={!!errors.workspaceName}
            {...form.register("workspaceName")}
          />
          <FieldError errors={[errors.workspaceName]} />
        </Field>

        <FormAlert message={serverError} />

        <Field>
          <SubmitButton
            pending={isSubmitting}
            pendingLabel="Creating workspace…"
          >
            Continue
          </SubmitButton>
          <FieldDescription className="text-center">
            Signed in as {email}.{" "}
            <button
              type="button"
              onClick={() => void signOut()}
              disabled={signingOut || isSubmitting}
              className="underline underline-offset-4 hover:text-primary disabled:opacity-50"
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}

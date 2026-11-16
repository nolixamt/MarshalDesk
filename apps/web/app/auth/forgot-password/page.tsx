import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFormSkeleton } from "@/components/auth/auth-form-skeleton";
import { AuthGate } from "@/components/auth/auth-gate";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset your password · MarshalDesk",
};

export default function Page() {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <AuthGate page="forgot-password">
        <ForgotPasswordForm />
      </AuthGate>
    </Suspense>
  );
}

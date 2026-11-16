import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFormSkeleton } from "@/components/auth/auth-form-skeleton";
import { AuthGate } from "@/components/auth/auth-gate";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";

export const metadata: Metadata = { title: "Verify your email · MarshalDesk" };

export default function Page() {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <AuthGate page="verify-email">
        <VerifyEmailForm />
      </AuthGate>
    </Suspense>
  );
}

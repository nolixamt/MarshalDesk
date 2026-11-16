import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFormSkeleton } from "@/components/auth/auth-form-skeleton";
import { AuthGate } from "@/components/auth/auth-gate";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = { title: "Sign in · MarshalDesk" };

export default function Page() {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <AuthGate page="sign-in">
        <SignInForm />
      </AuthGate>
    </Suspense>
  );
}

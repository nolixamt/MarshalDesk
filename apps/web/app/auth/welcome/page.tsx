import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFormSkeleton } from "@/components/auth/auth-form-skeleton";
import { AuthGate } from "@/components/auth/auth-gate";

export const metadata: Metadata = { title: "Welcome · MarshalDesk" };

export default function Page() {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <AuthGate page="welcome" />
    </Suspense>
  );
}

import { redirect } from "next/navigation";
import { WelcomeForm } from "@/components/auth/welcome-form";
import { getViewer, verifyEmailPath } from "@/lib/auth/viewer";

export type AuthPage =
  "sign-in" | "sign-up" | "verify-email" | "forgot-password" | "welcome";

type AuthGateProps = {
  page: AuthPage;
  children?: React.ReactNode;
};

export async function AuthGate({ page, children }: AuthGateProps) {
  const viewer = await getViewer();

  switch (viewer.status) {
    case "ready":
      redirect("/dashboard");
    case "needs-workspace":
      if (page !== "welcome") redirect("/auth/welcome");
      return (
        <WelcomeForm
          needsName={viewer.user.name.trim() === ""}
          email={viewer.user.email}
        />
      );
    case "unverified":
      if (page === "welcome") redirect(verifyEmailPath(viewer.user.email));
      return children;
    case "signed-out":
      if (page === "welcome") redirect("/auth/sign-in");
      return children;
    default: {
      const unreachable: never = viewer;
      return unreachable;
    }
  }
}

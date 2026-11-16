import Link from "next/link";
import { AuthShowcase } from "@/components/auth/auth-showcase";
import { LogoMark } from "@/components/brand/logo-mark";

export default function AuthLayout({ children }: LayoutProps<"/auth">) {
  return (
    <div className="dark flex min-h-dvh flex-1 bg-black text-foreground [color-scheme:dark]">
      <div className="flex min-w-0 flex-1 flex-col px-4 py-5 sm:px-8 lg:max-w-[50%] lg:px-10">
        <Link
          href="/"
          className="flex w-fit animate-slide-down items-center gap-3 rounded-full text-[15px] font-semibold tracking-[-0.01em] text-white outline-none focus-visible:ring-3 focus-visible:ring-white/50 motion-reduce:animate-none"
        >
          <span className="grid size-10 place-items-center rounded-full bg-white text-black shadow-soft">
            <LogoMark className="size-[72%]" />
          </span>
          MarshalDesk
        </Link>
        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[400px] animate-reveal rounded-2xl border border-white/10 bg-background p-6 shadow-sheet [animation-delay:0.05s] motion-reduce:animate-none sm:p-8">
            {children}
          </div>
        </main>
      </div>
      <AuthShowcase />
    </div>
  );
}

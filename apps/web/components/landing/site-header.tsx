import Link from "next/link";
import { LogoMark } from "@/components/brand/logo-mark";
import { Button } from "@/components/ui/button";
import { navLinks, signIn } from "./content";
import { MobileMenu } from "./mobile-menu";

export function SiteHeader() {
  return (
    <header className="relative z-60 flex w-full max-w-[720px] shrink-0 animate-slide-down items-center justify-center gap-[clamp(18px,2.8vw,28px)] motion-reduce:animate-none max-nav:justify-between">
      <Link
        href="/"
        aria-label="MarshalDesk home"
        className="grid size-[clamp(40px,4.4vw,46px)] shrink-0 place-items-center rounded-full bg-white text-black shadow-soft transition-[scale] duration-300 ease-out-expo outline-none hover:scale-[1.04] focus-visible:ring-3 focus-visible:ring-white/50 max-nav:size-12"
      >
        <LogoMark className="size-[72%]" />
      </Link>

      <nav
        aria-label="Main"
        className="flex h-[clamp(44px,5.2vw,48px)] max-w-[430px] flex-1 items-center justify-around rounded-full bg-white px-2 py-1 shadow-soft max-nav:hidden"
      >
        {navLinks.map((link, i) => (
          <Button
            key={link.href}
            variant="nav"
            size="nav"
            nativeButton={false}
            aria-current={i === 0 ? "page" : undefined}
            render={<Link href={link.href} />}
          >
            {link.label}
          </Button>
        ))}
      </nav>

      <Button
        variant="ink"
        size="pill"
        nativeButton={false}
        className="max-nav:hidden"
        render={<Link href={signIn.href} />}
      >
        {signIn.label}
      </Button>

      <MobileMenu />
    </header>
  );
}

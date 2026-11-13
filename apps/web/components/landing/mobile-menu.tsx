"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { navLinks, signIn } from "./content";

const desktopQuery = "(min-width: 721px)";

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(desktopQuery);
    const close = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };
    media.addEventListener("change", close);
    return () => media.removeEventListener("change", close);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ink"
            size="icon-pill"
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex-col gap-[5px] data-popup-open:bg-white data-popup-open:hover:bg-white nav:hidden"
          />
        }
      >
        {[
          "group-data-popup-open/button:translate-y-[6.5px] group-data-popup-open/button:rotate-45",
          "group-data-popup-open/button:opacity-0",
          "group-data-popup-open/button:-translate-y-[6.5px] group-data-popup-open/button:-rotate-45",
        ].map((state) => (
          <span
            key={state}
            className={`block h-[1.5px] w-[18px] rounded-full bg-white transition-[translate,rotate,opacity,background-color] duration-300 ease-out-expo group-data-popup-open/button:bg-black ${state}`}
          />
        ))}
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/62 backdrop-blur-[6px] supports-backdrop-filter:backdrop-blur-[6px] data-open:animate-overlay-in motion-reduce:data-open:animate-none"
        className="top-[clamp(84px,11vh,96px)] w-[calc(100%-28px)] max-w-sm -translate-y-0 gap-1 rounded-[28px] bg-white px-[18px] pt-[22px] pb-5 text-nav-foreground shadow-sheet ring-0 sm:max-w-sm data-open:animate-menu-in motion-reduce:data-open:animate-none"
      >
        <DialogTitle className="sr-only">Menu</DialogTitle>
        <nav aria-label="Mobile" className="flex flex-col">
          {navLinks.map((link, i) => (
            <Button
              key={link.href}
              variant="nav"
              size="nav"
              nativeButton={false}
              aria-current={i === 0 ? "page" : undefined}
              onClick={() => setOpen(false)}
              style={{ animationDelay: `${0.06 + i * 0.05}s` }}
              className="h-12 animate-link-in text-base after:bottom-2 motion-reduce:animate-none"
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
          onClick={() => setOpen(false)}
          style={{ animationDelay: `${0.06 + navLinks.length * 0.05}s` }}
          className="mt-3 h-12 w-full animate-link-in text-[15px] motion-reduce:animate-none"
          render={<Link href={signIn.href} />}
        >
          {signIn.label}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

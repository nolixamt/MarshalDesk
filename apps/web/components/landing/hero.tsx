import Link from "next/link";
import { Button } from "@/components/ui/button";
import { hero } from "./content";
import { TrustRow } from "./trust-row";

const lineDelays = ["0.12s", "0.3s"];

export function Hero() {
  return (
    <section className="relative z-1 flex w-full max-w-[900px] flex-1 flex-col items-center justify-center text-center">
      <TrustRow className="mb-[clamp(16px,2.5vh,26px)] animate-reveal [animation-delay:0.05s] motion-reduce:animate-none [@media(max-height:700px)]:mb-3" />

      <h1 className="w-full overflow-hidden font-display text-[clamp(30px,10.2vw,80px)] leading-[1.12] font-normal tracking-[-0.04em] whitespace-nowrap text-white max-nav:leading-[1.05] max-nav:tracking-[-0.03em] max-xs:leading-[1.04] max-xs:tracking-[-0.04em] nav:text-[clamp(28px,6.2vw,80px)]">
        {hero.headline.map((line, i) => (
          <span
            key={line}
            className="block animate-headline motion-reduce:animate-none"
            style={{ animationDelay: lineDelays[i] }}
          >
            {line}
          </span>
        ))}
      </h1>

      <p className="mt-[clamp(14px,2.2vh,22px)] max-w-[min(500px,92%)] animate-reveal text-[clamp(calc(13.5px+2pt),calc(1.55vw+2pt),calc(16.5px+2pt))] leading-[1.55] text-hero-subhead/80 [animation-delay:0.28s] motion-reduce:animate-none [@media(max-height:700px)]:mt-2.5">
        {hero.subhead}
      </p>

      <Button
        variant="glow"
        size="cta"
        nativeButton={false}
        className="mt-[clamp(20px,3.4vh,34px)] animate-reveal-pulse [animation-delay:0.4s] motion-reduce:animate-none [@media(max-height:700px)]:mt-4"
        render={<Link href={hero.cta.href} />}
      >
        {hero.cta.label}
      </Button>
    </section>
  );
}

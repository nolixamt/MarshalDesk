import { authShowcase } from "@/components/landing/content";
import { BackgroundVideo } from "@/components/landing/background-video";
import { TrustRow } from "@/components/landing/trust-row";

const lineDelays = ["0.12s", "0.3s"];

export function AuthShowcase() {
  return (
    <aside className="relative m-3 hidden flex-1 overflow-hidden rounded-2xl bg-black lg:flex">
      <BackgroundVideo media="(min-width: 64rem)" />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/85 via-black/45 to-transparent"
      />
      <div className="relative mt-auto flex flex-col items-start gap-5 p-[clamp(28px,3.5vw,48px)]">
        <TrustRow className="animate-reveal [animation-delay:0.05s] motion-reduce:animate-none" />
        <h2 className="font-display text-[clamp(32px,3.6vw,56px)] leading-[1.08] font-normal tracking-[-0.04em] whitespace-nowrap text-white">
          {authShowcase.headline.map((line, i) => (
            <span
              key={line}
              className="block animate-headline motion-reduce:animate-none"
              style={{ animationDelay: lineDelays[i] }}
            >
              {line}
            </span>
          ))}
        </h2>
        <p className="max-w-[440px] animate-reveal text-base leading-[1.55] text-hero-subhead/80 [animation-delay:0.28s] motion-reduce:animate-none">
          {authShowcase.subhead}
        </p>
      </div>
    </aside>
  );
}

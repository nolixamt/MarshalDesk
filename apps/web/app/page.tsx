import { BackgroundVideo } from "@/components/landing/background-video";
import { Hero } from "@/components/landing/hero";
import { SiteHeader } from "@/components/landing/site-header";
import { Stats } from "@/components/landing/stats";

export default function HomePage() {
  return (
    <div className="relative h-dvh overflow-hidden bg-black text-white">
      <BackgroundVideo />
      <main className="flex h-full flex-col items-center px-[clamp(14px,3vw,32px)] py-[clamp(16px,2.4vh,28px)]">
        <SiteHeader />
        <Hero />
        <Stats />
      </main>
    </div>
  );
}

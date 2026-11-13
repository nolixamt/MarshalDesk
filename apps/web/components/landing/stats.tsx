"use client";

import { useEffect, useRef } from "react";
import { stats, type Stat } from "./content";

const format = (value: number, stat: Stat) =>
  `${value.toFixed(stat.decimals)}${stat.suffix}`;

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

function CountUp({ stat, index }: { stat: Stat; index: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    node.textContent = format(0, stat);
    const duration = 1500 + index * 80;
    const offset = 480 + index * 90;
    let frame = 0;
    let timer = 0;

    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        node.textContent = format(stat.value * easeOutCubic(t), stat);
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        timer = window.setTimeout(run, offset);
      },
      { threshold: 0.25 },
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [stat, index]);

  return (
    <span
      ref={ref}
      className="text-[clamp(18px,2.2vw,26px)] font-medium tracking-[-0.025em] text-white tabular-nums"
    >
      {format(stat.value, stat)}
    </span>
  );
}

export function Stats() {
  return (
    <section
      aria-label="MarshalDesk at a glance"
      className="relative z-1 grid w-full max-w-[920px] shrink-0 grid-cols-4 gap-x-4 gap-y-6 max-nav:grid-cols-2"
    >
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className="flex animate-reveal flex-col items-center gap-1.5 text-center motion-reduce:animate-none"
          style={{ animationDelay: `${0.5 + i * 0.08}s` }}
        >
          <span
            aria-hidden="true"
            className="font-display text-[clamp(22px,3vw,33px)] leading-none text-white"
          >
            {stat.glyph}
          </span>
          <CountUp stat={stat} index={i} />
          <span className="text-[clamp(11px,1.2vw,12.5px)] text-stat-label">
            {stat.label}
          </span>
        </div>
      ))}
    </section>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { backgroundVideoUrl } from "./content";
import { MediaQueryGate } from "./media-query-gate";

function LoopingVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  // Next keeps hidden routes mounted in an Activity; its effect cleanup is the
  // only signal, so pause there or the video keeps playing off-screen.
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.play().catch(() => {});
    return () => video.pause();
  }, []);

  return (
    <video
      ref={ref}
      className="pointer-events-none absolute inset-0 size-full object-cover"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
    >
      <source src={backgroundVideoUrl} type="video/mp4" />
    </video>
  );
}

export function BackgroundVideo({
  media,
  className,
}: {
  /** Mounts the video only while this media query matches, so other screens never download it. */
  media?: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("absolute inset-0 overflow-hidden bg-black", className)}
    >
      {media ? (
        <MediaQueryGate query={media}>
          <LoopingVideo />
        </MediaQueryGate>
      ) : (
        <LoopingVideo />
      )}
    </div>
  );
}

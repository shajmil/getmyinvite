"use client";

import { useEffect, useRef } from "react";

// The editor renders into an iframe. Measure and listen in the element's own
// window, rather than attaching a global scroll controller to the dashboard.
export function useJourneyMotion(revision: unknown) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    const view = element?.ownerDocument.defaultView;
    if (!element || !view) return;
    const media = view.matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false;
    let generation = 0;
    let cleanup = () => {};

    async function setup() {
      const currentGeneration = ++generation;
      cleanup();
      cleanup = () => {};
      if (media.matches || disposed) return;
      const { gsap } = await import("gsap");
      if (disposed || media.matches || currentGeneration !== generation) return;
      let frame = 0;
      const hero = element!.querySelector<HTMLElement>("[data-opening]")!;
      const photos = Array.from(element!.querySelectorAll<HTMLElement>("[data-floating]"));
      const reveals = Array.from(element!.querySelectorAll<HTMLElement>("[data-reveal]"));
      const timeline = element!.querySelector<HTMLElement>("[data-timeline]");
      const track = element!.querySelector<HTMLElement>("[data-timeline-track]");
      let travel = 0;
      let opening: gsap.core.Timeline;
      const context = gsap.context(() => {
        opening = gsap.timeline({ paused: true, defaults: { ease: "none" } })
          .to("[data-envelope]", { rotateX: 0, rotateY: 0, scale: 1.08, duration: 1 }, 0)
          .to("[data-seal]", { y: 65, opacity: 0, duration: .2 }, .05)
          .to("[data-flap]", { rotateX: -175, duration: .4 }, .15)
          .to("[data-card]", { yPercent: -62, z: 30, duration: .45 }, .5);
      }, element!);
      element!.dataset.motion = "true";
      function measure() {
        if (timeline && track) {
          travel = view!.innerWidth >= 900 ? Math.max(0, track.scrollWidth - track.clientWidth) : 0;
          timeline.style.height = travel ? `${view!.innerHeight + travel}px` : "";
        }
        schedule();
      }

      function draw() {
        frame = 0;
        if (element!.ownerDocument.hidden) return;
        const height = view!.innerHeight;
        const rect = hero.getBoundingClientRect();
        opening.progress(gsap.utils.clamp(0, 1, -rect.top / Math.max(1, rect.height - height)));
        if (timeline && track) {
          const progress = travel ? gsap.utils.clamp(0, 1, -timeline.getBoundingClientRect().top / travel) : 0;
          gsap.set(track, { x: -progress * travel });
        }
        const mobile = view!.innerWidth < 700;
        photos.forEach((photo, index) => {
          const bounds = photo.parentElement!.getBoundingClientRect();
          if (bounds.bottom < -100 || bounds.top > height + 100) return;
          const progress = gsap.utils.clamp(-1, 1, (height / 2 - bounds.top - bounds.height / 2) / height);
          const direction = index % 2 ? 1 : -1;
          gsap.set(photo, { y: progress * (mobile ? 18 : 65), rotationY: direction * progress * (mobile ? 3 : 9), rotation: direction * (mobile ? 2 : 5), z: mobile ? 0 : progress * 65 });
        });
        reveals.forEach(node => {
          const rect = node.getBoundingClientRect();
          const progress = gsap.utils.clamp(0, 1, (height - rect.top) / (height * .3));
          // Content always remains readable, including without JavaScript.
          gsap.set(node, { y: (1 - progress) * 24, opacity: .45 + progress * .55 });
        });
      }
      function schedule() {
        if (!frame && !element!.ownerDocument.hidden) frame = view!.requestAnimationFrame(draw);
      }
      function visibility() {
        if (element!.ownerDocument.hidden) { view!.cancelAnimationFrame(frame); frame = 0; }
        else schedule();
      }
      view!.addEventListener("scroll", schedule, { passive: true });
      view!.addEventListener("resize", measure);
      element!.ownerDocument.addEventListener("visibilitychange", visibility);
      measure();
      cleanup = () => {
        view!.cancelAnimationFrame(frame);
        view!.removeEventListener("scroll", schedule);
        view!.removeEventListener("resize", measure);
        element!.ownerDocument.removeEventListener("visibilitychange", visibility);
        context.revert();
        gsap.set([...photos, ...reveals], { clearProps: "transform,opacity" });
        if (track) gsap.set(track, { clearProps: "transform" });
        if (timeline) timeline.style.height = "";
        delete element!.dataset.motion;
      };
    }
    const change = () => { void setup(); };
    media.addEventListener("change", change);
    void setup();
    return () => { disposed = true; media.removeEventListener("change", change); cleanup(); };
  }, [root, revision]);
  return root;
}

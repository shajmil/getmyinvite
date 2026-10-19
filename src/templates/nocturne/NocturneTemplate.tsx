"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import type { InvitationData } from "@/lib/zod-schemas";
import { AureliaRSVP } from "../aurelia/AureliaRSVP";
import { nocturnePalettes } from "./palettes";
import styles from "./nocturne.module.css";

function dateText(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}
function timeText(value: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  return match ? `${Number(match[1]) % 12 || 12}:${match[2]} ${Number(match[1]) >= 12 ? "PM" : "AM"}` : value;
}
function smooth(start: number, end: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
}
function Still({ src, alt, eager = false, preview = false }: { src?: string; alt: string; eager?: boolean; preview?: boolean }) {
  if (!src) return <div className={styles.emptyStill} aria-hidden="true" />;
  return <Image src={src} alt={alt} fill unoptimized={preview || eager} preload={eager} loading={preview && !eager ? "eager" : undefined} sizes="100vw" />;
}

export function NocturneTemplate({ data, colorSchemeId, isPreview = false }: { data: InvitationData & { invitationId?: string }; colorSchemeId: string; isPreview?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const palette = nocturnePalettes.find(item => item.id === colorSchemeId) || nocturnePalettes[0];
  const photos = [...data.gallery].sort((a, b) => a.order - b.order);
  const names = `${data.partner1.firstName} & ${data.partner2.firstName}`;
  const date = dateText(data.wedding.date);
  const stills = useMemo(() => {
    const frames = [...data.gallery].sort((a, b) => a.order - b.order);
    const first = data.hero.mainPhoto || frames[0]?.url || data.partner1.photo || data.partner2.photo;
    return [first, frames[0]?.url || data.partner1.photo || first, frames[1]?.url || data.partner2.photo || first, frames[2]?.url || data.wedding.venue.photo || first, frames[3]?.url || first];
  }, [data.gallery, data.hero.mainPhoto, data.partner1.photo, data.partner2.photo, data.wedding.venue.photo]);
  const mapUrl = /^https?:\/\//i.test(data.wedding.venue.mapUrl || "") ? data.wedding.venue.mapUrl : undefined;

  useEffect(() => {
    const element = root.current;
    const view = element?.ownerDocument.defaultView;
    if (!element || !view) return;
    const media = view.matchMedia("(prefers-reduced-motion: reduce)");
    const stage = element.querySelector<HTMLElement>("[data-film]");
    const canvas = element.querySelector<HTMLCanvasElement>("[data-film-canvas]");
    const context = canvas?.getContext("2d", { alpha: false });
    const shots = [...element.querySelectorAll<HTMLElement>("[data-shot]")];
    const progressBar = element.querySelector<HTMLElement>("[data-film-progress]");
    if (!stage) return;
    let raf = 0;
    let progress = 0;
    let disposed = false;
    const frames = stills.map(src => {
      if (!src) return null;
      const image = element.ownerDocument.createElement("img");
      image.decoding = "async";
      image.onload = () => { if (!disposed) schedule(); };
      return image;
    });
    const loadFrame = (index: number) => {
      const image = frames[index];
      if (image && stills[index] && !image.getAttribute("src")) image.src = stills[index]!;
    };
    const nearest = (index: number) => {
      for (let offset = 0; offset < frames.length; offset++) {
        for (const candidate of [index - offset, index + offset]) {
          const frame = frames[candidate];
          if (frame?.complete && frame.naturalWidth) return frame;
        }
      }
      return null;
    };
    const paint = () => {
      if (!canvas || !context) return;
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(view.devicePixelRatio || 1, view.innerWidth < 700 ? 1.5 : 2);
      const width = Math.max(1, Math.round(rect.width * ratio));
      const height = Math.max(1, Math.round(rect.height * ratio));
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
      const position = progress * 4;
      const first = Math.min(4, Math.floor(position));
      const second = Math.min(4, first + 1);
      loadFrame(first);
      loadFrame(second);
      if (second < 4) loadFrame(second + 1);
      const mix = smooth(0, 1, position - first);
      const a = nearest(first);
      const b = nearest(second);
      if (!a && !b) return;
      context.fillStyle = "#111";
      context.fillRect(0, 0, width, height);
      const drawImage = (image: HTMLImageElement, alpha: number, index: number) => {
        const zoom = 1.08 + Math.abs(position - index) * .06;
        const cropWidth = Math.min(image.naturalWidth, image.naturalHeight * width / height) / zoom;
        const cropHeight = cropWidth * height / width;
        context.globalAlpha = alpha;
        context.drawImage(image, (image.naturalWidth - cropWidth) / 2, (image.naturalHeight - cropHeight) / 2, cropWidth, cropHeight, 0, 0, width, height);
      };
      if (a) drawImage(a, 1, first);
      if (b && second !== first) drawImage(b, mix, second);
      context.globalAlpha = 1;
      element.dataset.canvasReady = "true";
    };
    const draw = () => {
      raf = 0;
      if (disposed || media.matches || element.ownerDocument.hidden) return;
      const rect = stage.getBoundingClientRect();
      const target = Math.max(0, Math.min(1, -rect.top / Math.max(1, rect.height - view.innerHeight)));
      progress += (target - progress) * .14;
      paint();
      shots.forEach((shot, index) => {
        const center = index / 4;
        const opacity = index === 0 ? 1 - smooth(.07, .17, progress) : index === 4 ? smooth(.83, .95, progress) : Math.min(smooth(center - .13, center - .02, progress), 1 - smooth(center + .02, center + .13, progress));
        shot.style.opacity = String(Math.max(0, opacity));
        shot.style.pointerEvents = opacity > .55 ? "auto" : "none";
        shot.style.setProperty("--local", String(Math.max(-1, Math.min(1, (progress - center) * 3))));
      });
      if (progressBar) progressBar.style.transform = `scaleX(${progress})`;
      if (Math.abs(target - progress) > .001) raf = view.requestAnimationFrame(draw);
    };
    const schedule = () => { if (!raf) raf = view.requestAnimationFrame(draw); };
    const change = () => { progress = 0; schedule(); };
    view.addEventListener("scroll", schedule, { passive: true });
    view.addEventListener("resize", schedule);
    media.addEventListener("change", change);
    loadFrame(0);
    loadFrame(1);
    schedule();
    return () => { disposed = true; view.cancelAnimationFrame(raf); view.removeEventListener("scroll", schedule); view.removeEventListener("resize", schedule); media.removeEventListener("change", change); };
  }, [stills]);

  return <div ref={root} className={styles.template} style={palette.cssVars as CSSProperties}>
    <noscript><style>{`[data-film]{height:auto!important}[data-film]>.${styles.screen}{position:relative!important;height:auto!important;overflow:visible!important}[data-shot]{position:relative!important;min-height:100vh!important;opacity:1!important}[data-film-canvas]{display:none!important}`}</style></noscript>
    <main>
      <section id="nocturne-home" data-film className={styles.film} aria-label="Our wedding film"><div className={styles.screen}>
        <canvas data-film-canvas className={styles.filmCanvas} aria-hidden="true" />
        <div className={styles.filmTop}><a href="#nocturne-home" aria-label="Start of invitation" className={styles.mark}>{data.partner1.firstName[0]} / {data.partner2.firstName[0]}</a><span>A film about us</span><a href="#nocturne-ticket">The invitation</a></div>
        <div className={styles.sprockets} aria-hidden="true" />
        <div data-shot className={`${styles.shot} ${styles.openingShot}`}><div className={styles.still}><Still src={stills[0]} alt={`${names} wedding setting`} eager preview={isPreview} /></div><div className={styles.scrim} /><div className={styles.titleCard}><span className={styles.sceneLabel}>Presenting a love story</span><h1>{data.partner1.firstName}<span>&</span>{data.partner2.firstName}</h1><p>{date} <b>·</b> {data.wedding.venue.city}</p></div><span className={styles.sceneNumber}>Scene 01 / 05</span></div>
        <div data-shot className={styles.shot}><div className={styles.still}><Still src={stills[1]} alt={photos[0]?.alt || "A photograph from our story"} preview={isPreview} /></div><div className={styles.scrim} /><div className={`${styles.caption} ${styles.captionLeft}`}><span className={styles.sceneLabel}>The first frame</span><h2>One ordinary day.<br /><em>Everything changed.</em></h2><p>{data.story?.howWeMet || data.hero.quote || "Of all the places, we found each other."}</p></div><span className={styles.sceneNumber}>Scene 02 / 05</span></div>
        <div data-shot className={styles.shot}><div className={styles.still}><Still src={stills[2]} alt={photos[1]?.alt || "A treasured photograph"} preview={isPreview} /></div><div className={styles.scrim} /><div className={`${styles.caption} ${styles.captionRight}`}><span className={styles.sceneLabel}>The turning point</span><h2>And then<br />came <em>yes.</em></h2><p>{data.story?.proposal || "A little word that changed the rest of our lives."}</p></div><span className={styles.sceneNumber}>Scene 03 / 05</span></div>
        <div data-shot className={styles.shot}><div className={styles.still}><Still src={stills[3]} alt={photos[2]?.alt || "A moment together"} preview={isPreview} /></div><div className={styles.scrim} /><div className={`${styles.caption} ${styles.captionCenter}`}><span className={styles.sceneLabel}>The next chapter</span><h2>A date. A place.<br /><em>A promise.</em></h2><p>{date} · {data.wedding.venue.name}</p></div><span className={styles.sceneNumber}>Scene 04 / 05</span></div>
        <div data-shot className={styles.shot}><div className={styles.still}><Still src={stills[4]} alt={photos[3]?.alt || "Our favourite memory"} preview={isPreview} /></div><div className={styles.scrim} /><div className={`${styles.caption} ${styles.captionCenter}`}><span className={styles.sceneLabel}>The final scene needs you</span><h2>Come be part<br />of <em>our story.</em></h2><a href="#nocturne-ticket" className={styles.filmLink}>Open your invitation <span aria-hidden="true">↘</span></a></div><span className={styles.sceneNumber}>Scene 05 / 05</span></div>
        <div className={styles.filmBottom}><span>Scroll to play</span><div className={styles.progressTrack}><span data-film-progress /></div><span>01:00</span></div>
      </div></section>

      <section id="nocturne-ticket" className={styles.ticketSection}><div className={styles.ticketIntro}><span className={styles.kicker}>Admit one to the beginning of forever</span><h2>We saved you<br /><em>a seat.</em></h2><p>With so much love, we invite you to celebrate the wedding of {names}.</p></div><div className={styles.ticket}><div className={styles.ticketMain}><div className={styles.ticketTop}><span>GetMyInvite presents</span><span>Invitation № 001</span></div><h3>{data.partner1.firstName}<i>&</i>{data.partner2.firstName}</h3><div className={styles.ticketFacts}><div><span>When</span><strong>{date}</strong><small>{timeText(data.wedding.time)} · {data.wedding.timezone}</small></div><div><span>Where</span><strong>{data.wedding.venue.name}</strong><small>{data.wedding.venue.address}, {data.wedding.venue.city}</small></div></div></div><div className={styles.ticketStub}><span>Keep this moment</span><strong>{new Date(`${data.wedding.date}T12:00:00Z`).getUTCDate() || ""}</strong><span>{new Date(`${data.wedding.date}T12:00:00Z`).toLocaleDateString("en", { month: "short", year: "numeric", timeZone: "UTC" })}</span><div className={styles.barcode} aria-hidden="true" /></div></div>{mapUrl && <a className={styles.directions} href={mapUrl} target="_blank" rel="noopener noreferrer">Find the venue <span aria-hidden="true">↗</span></a>}</section>

      {data.events.length > 0 && <section className={styles.programme}><div><span className={styles.kicker}>The programme</span><h2>What happens<br /><em>next.</em></h2></div><div className={styles.programmeList}>{data.events.map((event, index) => <article key={event.id}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{event.name}</h3><p>{dateText(event.date)} · {timeText(event.time)}<br />{event.venue}</p>{event.note && <small>{event.note}</small>}</div></article>)}</div></section>}

      {photos.length > 0 && <section className={styles.contactSheet}><div className={styles.contactHeading}><span className={styles.kicker}>Outtakes from our story</span><h2>Keep these<br /><em>close.</em></h2></div><div className={styles.photoRail}>{photos.slice(0, 6).map((photo, index) => <figure key={`${photo.url}-${index}`}><Image src={photo.url} alt={photo.alt || `Memory ${index + 1}`} fill unoptimized={isPreview} loading={isPreview ? "eager" : "lazy"} sizes="(max-width: 700px) 66vw, 25vw" /><figcaption>{String(index + 1).padStart(2, "0")} / {photo.alt || "Us, together"}</figcaption></figure>)}</div></section>}

      {data.rsvpConfig.enabled && <section id="nocturne-rsvp" className={styles.rsvp}><div><span className={styles.kicker}>Your reply</span><h2>The story is better<br /><em>with you in it.</em></h2><p>Let us know if you can be there.{data.rsvpConfig.deadline && ` Please reply by ${dateText(data.rsvpConfig.deadline)}.`}</p></div><AureliaRSVP config={data.rsvpConfig} invitationId={data.invitationId} isPreview={isPreview} /></section>}
    </main>
    <footer className={styles.footer}><p>The beginning of our forever</p><h2>{names}</h2><span>{data.extras.footerMessage || "We can’t wait to celebrate with you."}</span><Link href="/">GetMyInvite</Link></footer>
  </div>;
}

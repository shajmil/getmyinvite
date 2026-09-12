"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type CSSProperties } from "react";
import type { InvitationData } from "@/lib/zod-schemas";
import { AureliaRSVP } from "../aurelia/AureliaRSVP";
import { eternalJourneyPalettes } from "./palettes";
import { useJourneyMotion } from "./useJourneyMotion";
import styles from "./eternal-journey.module.css";

function dateLabel(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}
function timeLabel(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  return match ? `${Number(match[1]) % 12 || 12}:${match[2]} ${Number(match[1]) >= 12 ? "PM" : "AM"}` : value;
}
function Photo({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  return <div className={`${styles.photo} ${className}`}>
    {failed === src ? <span className={styles.photoFallback}>A memory held close</span> : <Image src={src} alt={alt} fill sizes="(max-width: 700px) 90vw, 50vw" onError={() => setFailed(src)} />}
  </div>;
}

export function EternalJourneyTemplate({ data, colorSchemeId, isPreview = false }: { data: InvitationData & { invitationId?: string }; colorSchemeId: string; isPreview?: boolean }) {
  const root = useJourneyMotion(data);
  const dialog = useRef<HTMLDialogElement>(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const palette = eternalJourneyPalettes.find(scheme => scheme.id === colorSchemeId) || eternalJourneyPalettes[0];
  const names = `${data.partner1.firstName} & ${data.partner2.firstName}`;
  const date = dateLabel(data.wedding.date);
  const gallery = [...data.gallery].sort((a, b) => a.order - b.order);
  const timeline = data.story?.timeline || [];
  const venue = data.wedding.venue;
  const mapUrl = venue.mapUrl && /^https?:\/\//i.test(venue.mapUrl) ? venue.mapUrl : undefined;
  function movePhoto(direction: number) { setActivePhoto(current => (current + direction + gallery.length) % gallery.length); }

  return <div ref={root} className={styles.template} style={palette.cssVars as CSSProperties}>
    <header className={styles.header}>
      <a href="#journey-opening" aria-label="Back to the invitation">{data.partner1.firstName.charAt(0)} <i>&</i> {data.partner2.firstName.charAt(0)}</a>
      <nav aria-label="Invitation navigation"><a href="#journey-day">The wedding</a>{data.rsvpConfig.enabled && <a href="#journey-rsvp">RSVP ↗</a>}</nav>
    </header>
    <main>
      <section id="journey-opening" data-opening className={styles.opening} aria-label="Your invitation">
        <div className={styles.pinned}>
          <p className={styles.eyebrow}>You are invited</p>
          <div className={styles.stage}>
            <div className={styles.envelope} data-envelope>
              <div className={styles.card} data-card><span className={styles.eyebrow}>Together, forever</span><span className={styles.cardNames}>{data.partner1.firstName}<i>&</i>{data.partner2.firstName}</span><span className={styles.cardDate}>{date}</span></div>
              <div className={styles.pocket} aria-hidden="true" />
              <div className={styles.flap} data-flap aria-hidden="true" />
              <span className={styles.seal} data-seal aria-hidden="true">{data.partner1.firstName.charAt(0)}<i>&</i>{data.partner2.firstName.charAt(0)}</span>
            </div>
          </div>
          <div className={styles.openingCaption}><h1>{names}</h1><p>{date}</p><a href="#journey-couple">Scroll to begin <span aria-hidden="true">↓</span></a></div>
          <span className={styles.sideNote} aria-hidden="true">A letter. A promise. A lifetime.</span>
        </div>
      </section>

      <section id="journey-couple" className={`${styles.section} ${styles.introduction}`}>
        <div data-reveal><p className={styles.eyebrow}>{data.coupleTagline || "The beginning of our forever"}</p><h2>{data.partner1.firstName}<br /><i>&</i> {data.partner2.firstName}</h2><p>{date} · {venue.city}</p>{data.hero.quote && <blockquote>“{data.hero.quote}”</blockquote>}</div>
        {data.hero.mainPhoto && <div className={styles.heroPhoto} data-reveal><Photo src={data.hero.mainPhoto} alt={names} /><span className={styles.photoCaption}>Two lives. One beautiful journey.</span></div>}
        <div className={styles.partners}>{[data.partner1, data.partner2].map((partner, index) => <article key={index} data-reveal>{partner.photo && <Photo src={partner.photo} alt={`${partner.firstName} ${partner.lastName}`} className={styles.portrait} />}<p className={styles.eyebrow}>{partner.roleTitle}</p><h3>{partner.firstName} {partner.lastName}</h3>{partner.parents && <p>{partner.relationPrefix} {partner.parents}</p>}</article>)}</div>
      </section>

      {(data.story?.howWeMet || data.story?.proposal) && <section className={`${styles.section} ${styles.story}`}>
        <div data-reveal><p className={styles.eyebrow}>Our story</p><h2>Of all the paths,<br /><i>we found ours.</i></h2>{timeline.find(point => point.photo)?.photo && <Photo src={timeline.find(point => point.photo)!.photo!} alt="A moment from our story" />}</div>
        <div>{data.story.howWeMet && <article data-reveal><p className={styles.eyebrow}>01 / The first hello</p><h3>How we met</h3><p>{data.story.howWeMet}</p></article>}{data.story.proposal && <article data-reveal><p className={styles.eyebrow}>02 / A beautiful yes</p><h3>The proposal</h3><p>{data.story.proposal}</p></article>}</div>
      </section>}

      {timeline.length > 0 && <section className={`${styles.section} ${styles.timelineSection}`} aria-label="Love story timeline" data-timeline><div className={styles.timelinePin}><p className={styles.eyebrow}>The moments that led us here</p><h2>A love, <i>unfolding.</i></h2><ol className={styles.timeline} data-timeline-track>{timeline.map(point => <li key={point.id} data-reveal><p className={styles.eyebrow}>{point.date}</p><span className={styles.timelineDot} aria-hidden="true" />{point.photo && <Photo src={point.photo} alt={point.title} />}<h3>{point.title}</h3><p>{point.text}</p></li>)}</ol></div></section>}

      {gallery.length > 0 && <section className={`${styles.section} ${styles.memories}`} aria-label="Photo gallery"><div className={styles.memoryTitle} data-reveal><p className={styles.eyebrow}>Collected along the way</p><h2>A little world<br /><i>of us.</i></h2><p>Touch a memory. Stay a little longer.</p></div><div className={styles.gallery}>{gallery.map((photo, index) => <div key={`${photo.url}-${index}`} className={styles.memorySlot}><button className={styles.floating} data-floating onClick={() => { setActivePhoto(index); dialog.current?.showModal(); }} aria-label={`View photograph ${index + 1}: ${photo.alt || "Our memory"}`}><Photo src={photo.url} alt={photo.alt || `Memory ${index + 1}`} /><span>{String(index + 1).padStart(2, "0")} <i>{photo.alt || "A moment, forever"}</i> ↗</span></button></div>)}</div>
        <dialog ref={dialog} className={styles.lightbox} aria-label="Wedding photographs" onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }} onKeyDown={event => { if (event.key === "ArrowRight") movePhoto(1); if (event.key === "ArrowLeft") movePhoto(-1); }}><button autoFocus className={styles.close} onClick={() => dialog.current?.close()} aria-label="Close photograph">×</button><Photo src={gallery[activePhoto % gallery.length].url} alt={gallery[activePhoto % gallery.length].alt || "Our memory"} /><div className={styles.controls}><button onClick={() => movePhoto(-1)} aria-label="Previous photograph">←</button><span aria-live="polite">{activePhoto % gallery.length + 1} / {gallery.length}</span><button onClick={() => movePhoto(1)} aria-label="Next photograph">→</button></div></dialog>
      </section>}

      <section id="journey-day" className={styles.day}><div data-reveal><p className={styles.eyebrow}>The wedding</p><h2>One day.<br /><i>All our tomorrows.</i></h2><p className={styles.weddingDate}>{date}</p><p>{timeLabel(data.wedding.time)} · {data.wedding.timezone}</p><p>{venue.name}<br />{venue.city}</p></div></section>
      {data.events.length > 0 && <section className={`${styles.section} ${styles.events}`}><p className={styles.eyebrow}>Come celebrate with us</p><h2>The <i>celebrations.</i></h2>{data.events.map((event, index) => <article key={event.id} data-reveal><span className={styles.eventNumber}>{String(index + 1).padStart(2, "0")}</span><div><p className={styles.eyebrow}>{dateLabel(event.date)} · {timeLabel(event.time)}</p><h3>{event.name}</h3><p>{event.venue}</p>{event.note && <p>{event.note}</p>}{event.dressCode && <p>Dress code · {event.dressCode}</p>}</div>{event.photo && <Photo src={event.photo} alt={event.name} />}</article>)}</section>}
      <section className={`${styles.section} ${styles.venue}`}><div data-reveal>{venue.photo && <Photo src={venue.photo} alt={venue.name} />}</div><div data-reveal><p className={styles.eyebrow}>The place we’ll remember</p><h2>{venue.name}</h2><p>{venue.address}<br />{venue.city}</p>{mapUrl && <a className={styles.button} href={mapUrl} target="_blank" rel="noopener noreferrer">Find your way ↗</a>}</div></section>
      {data.extras.keyGuests.length > 0 && <section className={styles.section}><p className={styles.eyebrow}>By our side</p><h2>Our favourite <i>people.</i></h2><div className={styles.people}>{data.extras.keyGuests.map(guest => <article key={guest.id} data-reveal>{guest.photo && <Photo src={guest.photo} alt={guest.name} />}<h3>{guest.name}</h3><p>{guest.relationship}</p></article>)}</div></section>}
      {(data.extras.giftNote || data.extras.dressCode) && <section className={`${styles.section} ${styles.notes}`}>{data.extras.dressCode && <div><h3>A note on attire</h3><p>{data.extras.dressCode}</p></div>}{data.extras.giftNote && <div><h3>Your presence, our present</h3><p>{data.extras.giftNote}</p></div>}</section>}
      {data.rsvpConfig.enabled && <section id="journey-rsvp" className={`${styles.section} ${styles.rsvp}`}><div data-reveal><p className={styles.eyebrow}>The next chapter includes you</p><h2>Will you<br /><i>join us?</i></h2><p>We’ve saved a place for you.</p>{data.rsvpConfig.deadline && <p>Kindly reply by {dateLabel(data.rsvpConfig.deadline)}</p>}</div><AureliaRSVP config={data.rsvpConfig} invitationId={data.invitationId} isPreview={isPreview} /></section>}
      {data.extras.contactPersons.length > 0 && <section className={`${styles.section} ${styles.contacts}`} aria-label="Contact our families">{data.extras.contactPersons.map(contact => <article key={contact.id}><p className={styles.eyebrow}>{contact.role}</p><h3>{contact.name}</h3><a href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}>{contact.phone}</a></article>)}</section>}
    </main>
    <footer className={styles.footer}><p className={styles.eyebrow}>And so, our forever begins</p><h2>{names}</h2><p>{data.extras.footerMessage || "We can’t wait to celebrate with you."}</p><p>{date}</p>{data.extras.hashtag && <p>{data.extras.hashtag}</p>}<Link href="/">GetMyInvite</Link></footer>
  </div>;
}

"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { InvitationData } from "@/lib/zod-schemas";
import { aureliaPalettes } from "./palettes";
import { AureliaRSVP } from "./AureliaRSVP";
import styles from "./aurelia.module.css";

function dateLabel(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}
function timeLabel(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  return match ? `${Number(match[1]) % 12 || 12}:${match[2]} ${Number(match[1]) >= 12 ? "PM" : "AM"}` : value;
}
function safeLink(value?: string) {
  return value && /^https?:\/\//i.test(value) ? value : undefined;
}
function Photo({ src, alt, className = "", hero = false }: { src?: string; alt: string; className?: string; hero?: boolean }) {
  const [failed, setFailed] = useState<string | null>(null);
  return <div className={`${styles.photo} ${className}`}>
    <span className={styles.photoFallback} aria-hidden="true">✧</span>
    {src && failed !== src && <Image src={src} alt={alt} fill sizes={hero ? "100vw" : "(max-width: 700px) 90vw, 50vw"} preload={hero} onError={() => setFailed(src)} />}
  </div>;
}

export function AureliaTemplate({ data, colorSchemeId, isPreview = false }: { data: InvitationData & { invitationId?: string }; colorSchemeId: string; isPreview?: boolean }) {
  const scheme = aureliaPalettes.find(item => item.id === colorSchemeId) || aureliaPalettes[0];
  const root = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const gallery = [...data.gallery].sort((a, b) => a.order - b.order);
  const hasStory = !!(data.story?.howWeMet || data.story?.proposal || data.story?.timeline.length);
  const names = `${data.partner1.firstName} & ${data.partner2.firstName}`;
  const monogram = `${data.partner1.firstName.charAt(0)} / ${data.partner2.firstName.charAt(0)}`;
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const view = element.ownerDocument.defaultView;
    if (!view || view.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in view)) return;
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add(styles.revealed); observer.unobserve(entry.target); }
    }), { threshold: 0.08 });
    element.querySelectorAll(`.${styles.reveal}`).forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, [data]);
  function movePhoto(direction: number) { setActivePhoto(current => (current + direction + gallery.length) % gallery.length); }
  return <div ref={root} className={styles.template} style={scheme.cssVars as CSSProperties}>
    <header className={styles.header}><a href="#aurelia-home" aria-label="Back to invitation opening" className={styles.monogram}>{monogram}</a><nav aria-label="Invitation navigation"><a href="#aurelia-day">The day</a>{gallery.length > 0 && <a href="#aurelia-memories">Memories</a>}{data.rsvpConfig.enabled && <a href="#aurelia-rsvp">RSVP ↗</a>}</nav></header>
    <main>
      <section id="aurelia-home" className={styles.hero}>
        <Photo src={data.hero.mainPhoto} alt={`${names}, celebrating their wedding`} hero className={styles.heroPhoto} />
        <div className={styles.heroShade} />
        <div className={styles.heroContent}><p className={styles.eyebrow}>{data.coupleTagline || "TOGETHER WITH OUR FAMILIES"}</p><h1><span>{data.partner1.firstName}</span><em>&amp;</em><span>{data.partner2.firstName}</span></h1><div className={styles.heroDate}><span>{dateLabel(data.wedding.date)}</span><span>{data.wedding.venue.city}</span></div><a href="#aurelia-invitation" className={styles.openLink}>Our next chapter <span aria-hidden="true">↓</span></a></div>
        <span className={styles.heroSide} aria-hidden="true">A CELEBRATION OF LOVE & TOGETHERNESS</span>
      </section>
      <section id="aurelia-invitation" className={`${styles.introduction} ${styles.reveal}`}><span className={styles.ornament} aria-hidden="true">✧</span><p className={styles.eyebrow}>WITH FULL HEARTS & OPEN ARMS</p><h2>Some things are<br /><em>meant to be.</em></h2><p className={styles.inviteText}>Two lives, one beautiful beginning. We would be honoured to have you with us as we celebrate our love and the journey ahead.</p>{data.hero.quote && <blockquote>“{data.hero.quote}”</blockquote>}<span className={styles.fineLine} /></section>
      <section className={`${styles.couple} ${styles.section}`} aria-label="Meet the couple">{[data.partner1, data.partner2].map((partner, index) => <article key={index} className={styles.reveal}><Photo src={partner.photo} alt={`${partner.firstName} ${partner.lastName}`} className={styles.portrait} /><p className={styles.eyebrow}>{partner.roleTitle || (index === 0 ? "ONE HALF OF FOREVER" : "THE OTHER HALF")}</p><h2>{partner.firstName}<span>{partner.lastName}</span></h2>{partner.parents && <p className={styles.parents}>{partner.relationPrefix && <span>{partner.relationPrefix}<br /></span>}{partner.parents}</p>}<div className={styles.socials}>{safeLink(partner.instagramUrl) && <a href={partner.instagramUrl} target="_blank" rel="noopener noreferrer">Instagram ↗</a>}{safeLink(partner.facebookUrl) && <a href={partner.facebookUrl} target="_blank" rel="noopener noreferrer">Facebook ↗</a>}</div></article>)}<span className={styles.coupleAmp} aria-hidden="true">&amp;</span></section>
      {hasStory && <section className={`${styles.story} ${styles.section}`}><div className={styles.sectionTitle}><p className={styles.eyebrow}>THE LITTLE MOMENTS, THE BIG FEELINGS</p><h2>And then,<br /><em>there was us.</em></h2></div><div className={styles.storyBody}>{data.story?.howWeMet && <article className={styles.reveal}><span className={styles.eyebrow}>THE FIRST HELLO</span><h3>How we met</h3><p>{data.story.howWeMet}</p></article>}{data.story?.proposal && <article className={styles.reveal}><span className={styles.eyebrow}>A QUESTION. A YES. A FOREVER.</span><h3>The proposal</h3><p>{data.story.proposal}</p></article>}{data.story?.timeline.map(point => <article key={point.id} className={styles.reveal}>{point.photo && <Photo src={point.photo} alt={point.title} className={styles.storyPhoto} />}<span className={styles.eyebrow}>{point.date}</span><h3>{point.title}</h3><p>{point.text}</p></article>)}</div></section>}
      <section id="aurelia-day" className={styles.day}><div className={styles.sectionTitle}><p className={styles.eyebrow}>PLEASE SAVE THE DATE</p><h2>A day for<br /><em>our kind of magic.</em></h2><p>{dateLabel(data.wedding.date)} · {timeLabel(data.wedding.time)}<br /><span className={styles.timezone}>{data.wedding.timezone}</span></p></div><div className={styles.venue}><Photo src={data.wedding.venue.photo} alt={data.wedding.venue.name} className={styles.venuePhoto} /><div><p className={styles.eyebrow}>WHERE WE SAY “I DO”</p><h3>{data.wedding.venue.name}</h3><p>{data.wedding.venue.address}<br />{data.wedding.venue.city}</p>{safeLink(data.wedding.venue.mapUrl) && <a className={styles.lightButton} href={data.wedding.venue.mapUrl} target="_blank" rel="noopener noreferrer">Find your way ↗</a>}</div></div>{data.events.length > 0 && <div className={styles.events}>{data.events.map((event, index) => <article key={event.id} className={styles.reveal}><span className={styles.eventNumber}>0{index + 1}</span><div><p className={styles.eyebrow}>{dateLabel(event.date)} · {timeLabel(event.time)}</p><h3>{event.name}</h3><p>{event.venue}</p>{event.note && <p>{event.note}</p>}{event.dressCode && <p className={styles.dressCode}>Dress code · {event.dressCode}</p>}</div>{event.photo && <Photo src={event.photo} alt={event.name} className={styles.eventPhoto} />}</article>)}</div>}</section>
      {gallery.length > 0 && <section id="aurelia-memories" className={`${styles.memories} ${styles.section}`}><div className={styles.sectionTitle}><p className={styles.eyebrow}>THE WAY WE REMEMBER</p><h2>A thousand little<br /><em>reasons to love.</em></h2><p>Our moments, held close. Tap a photograph to linger.</p></div><div className={styles.gallery}>{gallery.map((photo, index) => <button key={`${photo.url}-${index}`} className={styles.galleryButton} onClick={() => { setActivePhoto(index); dialog.current?.showModal(); }} aria-label={`View photo ${index + 1}: ${photo.alt || "A memory together"}`}><Photo src={photo.url} alt={photo.alt || `Memory ${index + 1}`} /><span aria-hidden="true">↗</span></button>)}</div><dialog ref={dialog} className={styles.lightbox} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }} onKeyDown={event => { if (event.key === "ArrowRight") movePhoto(1); if (event.key === "ArrowLeft") movePhoto(-1); }}><button autoFocus className={styles.close} onClick={() => dialog.current?.close()} aria-label="Close photograph">×</button><Photo src={gallery[activePhoto]?.url} alt={gallery[activePhoto]?.alt || "Wedding memory"} className={styles.fullPhoto} /><div className={styles.galleryControls}><button onClick={() => movePhoto(-1)} aria-label="Previous photograph">←</button><p aria-live="polite">{activePhoto + 1} / {gallery.length}</p><button onClick={() => movePhoto(1)} aria-label="Next photograph">→</button></div></dialog></section>}
      {data.extras.keyGuests.length > 0 && <section className={`${styles.people} ${styles.section}`}><div className={styles.sectionTitle}><p className={styles.eyebrow}>LOVE IS BETTER SHARED</p><h2>Our favourite <em>people.</em></h2></div><div className={styles.peopleGrid}>{data.extras.keyGuests.map(person => <article key={person.id}><Photo src={person.photo} alt={person.name} className={styles.personPhoto} /><h3>{person.name}</h3>{person.relationship && <p>{person.relationship}</p>}</article>)}</div></section>}
      {(data.extras.dressCode || data.extras.giftNote) && <section className={`${styles.notes} ${styles.section}`}>{data.extras.dressCode && <div><p className={styles.eyebrow}>A LITTLE NOTE ON ATTIRE</p><h3>The dress code</h3><p>{data.extras.dressCode}</p></div>}{data.extras.giftNote && <div><p className={styles.eyebrow}>YOUR PRESENCE MEANS EVERYTHING</p><h3>A note on gifts</h3><p>{data.extras.giftNote}</p></div>}</section>}
      {data.rsvpConfig.enabled && <section id="aurelia-rsvp" className={`${styles.rsvp} ${styles.section}`}><div className={styles.sectionTitle}><p className={styles.eyebrow}>A SEAT SAVED, JUST FOR YOU</p><h2>Will you<br /><em>be there?</em></h2><p>It wouldn’t be the same without you.</p>{data.rsvpConfig.deadline && <p className={styles.deadline}>Kindly reply by {dateLabel(data.rsvpConfig.deadline)}</p>}</div><AureliaRSVP config={data.rsvpConfig} invitationId={data.invitationId} isPreview={isPreview} /></section>}
      {data.extras.contactPersons.length > 0 && <section className={`${styles.contacts} ${styles.section}`}><p className={styles.eyebrow}>NEED A HAND WITH YOUR PLANS?</p><h2>We’re here <em>for you.</em></h2><div>{data.extras.contactPersons.map(contact => <article key={contact.id}><h3>{contact.name}</h3><p>{contact.role}</p><a href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}>{contact.phone}</a></article>)}</div></section>}
    </main>
    <footer className={styles.footer}><p className={styles.eyebrow}>WITH LOVE, ALWAYS</p><p className={styles.signature}>{names}</p><p>{data.extras.footerMessage || "We can’t wait to share this beautiful day with you."}</p>{data.extras.hashtag && <p>{data.extras.hashtag}</p>}<span aria-hidden="true">✧</span><a href="/">Invitation by GetMyInvite ↗</a></footer>
  </div>;
}

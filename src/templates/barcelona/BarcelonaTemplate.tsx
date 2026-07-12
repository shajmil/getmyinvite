"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { InvitationData } from "@/lib/zod-schemas";
import { templateRegistry } from "../registry";
import { cormorant, josefin, greatVibes } from "../fonts";

interface BarcelonaTemplateProps {
  data: InvitationData;
  colorSchemeId: string;
  isPreview?: boolean;
}

// -------------------------------------------------------------
// Helper Component: ScrollReveal
// -------------------------------------------------------------
function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
}: {
  children: React.ReactNode;
  direction?: "up" | "left" | "right";
  delay?: number;
}) {
  const prefersReducedMotion = useReducedMotion();
  if (prefersReducedMotion) return <>{children}</>;

  const variants = {
    hidden: {
      opacity: 0,
      y: direction === "up" ? 40 : 0,
      x: direction === "left" ? -40 : direction === "right" ? 40 : 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.8, 0.25, 1] as const,
        delay,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10% 0px" }}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}

// -------------------------------------------------------------
// Helper Component: ParallaxBanner
// -------------------------------------------------------------
function ParallaxBanner({ image, children }: { image: string; children: React.ReactNode }) {
  const containerRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);

  return (
    <div ref={containerRef} className="relative overflow-hidden h-[350px] md:h-[450px] flex items-center justify-center">
      <motion.div
        style={{
          backgroundImage: `url(${image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          y: prefersReducedMotion ? "0%" : y,
        }}
        className="absolute inset-0 z-0 bg-no-repeat"
      />
      <div className="absolute inset-0 bg-black/40 z-10" />
      <div className="relative z-20 w-full text-center px-4">
        {children}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Barcelona Main Component
// -------------------------------------------------------------
export function BarcelonaTemplate({ data, colorSchemeId, isPreview = false }: BarcelonaTemplateProps) {
  const scheme =
    templateRegistry.barcelona.colorSchemes.find((s) => s.id === colorSchemeId) ||
    templateRegistry.barcelona.colorSchemes[0];

  // Mobile Menu State
  const [menuOpen, setMenuOpen] = useState(false);

  // Countdown State
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // RSVP Form States
  const [guestName, setGuestName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [attending, setAttending] = useState<"yes" | "no" | "maybe">("yes");
  const [guestCount, setGuestCount] = useState(1);
  const [mealChoice, setMealChoice] = useState("");
  const [message, setMessage] = useState("");
  const [rsvpStatus, setRsvpStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [rsvpErrorMsg, setRsvpErrorMsg] = useState("");

  // Gallery Carousel State
  const [activeSlide, setActiveSlide] = useState(0);

  // Parse wedding date & time
  const weddingDateTimeStr = `${data.wedding.date}T${data.wedding.time || "00:00"}:00`;

  useEffect(() => {
    const calculateTime = () => {
      const difference = +new Date(weddingDateTimeStr) - +new Date();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [weddingDateTimeStr]);

  const handleRSVPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPreview) {
      setRsvpStatus("success");
      return;
    }

    setRsvpStatus("loading");
    setRsvpErrorMsg("");

    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitationId: (data as any).invitationId || "preview",
          guestName,
          email,
          phone,
          attending,
          guestCount: Number(guestCount),
          mealChoice,
          message,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Failed to submit RSVP");
      }

      setRsvpStatus("success");
    } catch (err: any) {
      setRsvpStatus("error");
      setRsvpErrorMsg(err.message || "Something went wrong.");
    }
  };

  const nextSlide = () => {
    if (data.gallery.length > 0) {
      setActiveSlide((prev) => (prev + 1) % data.gallery.length);
    }
  };

  const prevSlide = () => {
    if (data.gallery.length > 0) {
      setActiveSlide((prev) => (prev - 1 + data.gallery.length) % data.gallery.length);
    }
  };

  const initials = `${data.partner1.firstName.charAt(0)}${data.partner2.firstName.charAt(0)}`;

  return (
    <div
      style={scheme.cssVars as React.CSSProperties}
      className={`min-h-screen text-var(--text) bg-var(--bg-light) overflow-x-hidden ${cormorant.variable} ${josefin.variable} ${greatVibes.variable} font-sans selection:bg-[#eae6df] selection:text-[#855f18]`}
    >
      {/* -------------------- NAVBAR -------------------- */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-[#eae6df] z-50 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#home" className="font-serif text-2xl font-semibold tracking-wider text-var(--dark) hover:opacity-80">
            {data.partner1.firstName.charAt(0)} <span className="text-var(--gold)">&amp;</span> {data.partner2.firstName.charAt(0)}
          </a>

          {/* Desktop Nav */}
          <ul className="hidden md:flex items-center space-x-8 text-sm font-semibold uppercase tracking-wider text-var(--dark)">
            <li><a href="#home" className="hover:text-var(--gold) transition-colors">Home</a></li>
            <li><a href="#couple" className="hover:text-var(--gold) transition-colors">Couple</a></li>
            <li><a href="#events" className="hover:text-var(--gold) transition-colors">Events</a></li>
            {data.gallery && data.gallery.length > 0 && (
              <li><a href="#gallery" className="hover:text-var(--gold) transition-colors">Gallery</a></li>
            )}
            {data.rsvpConfig.enabled && (
              <li>
                <a
                  href="#rsvp"
                  className="px-4 py-2 bg-var(--gold) text-white hover:bg-var(--dark) transition-all duration-300 rounded"
                >
                  RSVP
                </a>
              </li>
            )}
          </ul>

          {/* Hamburger Menu Toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-var(--dark) focus:outline-none"
            aria-label="Toggle Menu"
          >
            <div className="space-y-2">
              <span className={`block w-6 h-0.5 bg-var(--dark) transition-all ${menuOpen ? "rotate-45 translate-y-2.5" : ""}`} />
              <span className={`block w-6 h-0.5 bg-var(--dark) transition-all ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`block w-6 h-0.5 bg-var(--dark) transition-all ${menuOpen ? "-rotate-45 -translate-y-2.5" : ""}`} />
            </div>
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {menuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-[#eae6df] py-6 shadow-xl flex flex-col items-center space-y-6 text-sm font-semibold uppercase tracking-wider text-var(--dark) z-40">
            <a href="#home" onClick={() => setMenuOpen(false)} className="hover:text-var(--gold) transition-colors">Home</a>
            <a href="#couple" onClick={() => setMenuOpen(false)} className="hover:text-var(--gold) transition-colors">Couple</a>
            <a href="#events" onClick={() => setMenuOpen(false)} className="hover:text-var(--gold) transition-colors">Events</a>
            {data.gallery && data.gallery.length > 0 && (
              <a href="#gallery" onClick={() => setMenuOpen(false)} className="hover:text-var(--gold) transition-colors">Gallery</a>
            )}
            {data.rsvpConfig.enabled && (
              <a
                href="#rsvp"
                onClick={() => setMenuOpen(false)}
                className="w-[80%] text-center px-4 py-2.5 bg-var(--gold) text-white rounded font-bold hover:bg-var(--dark) transition-all"
              >
                RSVP
              </a>
            )}
          </div>
        )}
      </nav>

      {/* -------------------- HERO -------------------- */}
      <header
        id="home"
        className="h-screen w-full relative flex items-center justify-center flex-col text-white text-center px-4 overflow-hidden"
        style={{ position: "relative" }}
      >
        <Image
          src={data.hero.mainPhoto || "/templates/barcelona/background.jpeg"}
          alt="Wedding Hero Background"
          fill
          priority
          sizes="100vw"
          className="object-cover -z-10"
        />
        {/* Dark overlay to make white text highly readable */}
        <div className="absolute inset-0 bg-black/45 -z-10" />
        
        <div className="relative z-10 space-y-6 max-w-2xl">
          <p className="font-serif italic text-lg md:text-xl tracking-wider text-var(--gold-light) drop-shadow">
            {data.coupleTagline || "Save The Date"}
          </p>
          <h1 className="font-serif text-5xl md:text-7xl font-bold tracking-wide drop-shadow-lg">
            {data.partner1.firstName} <span className="font-script text-6xl md:text-8xl text-var(--gold-light) block my-4">{`&`}</span> {data.partner2.firstName}
          </h1>
          <p className="font-sans text-sm md:text-base font-semibold tracking-[0.2em] uppercase drop-shadow-md">
            {new Date(data.wedding.date).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>

          {/* Countdown Clock */}
          <div className="flex justify-center items-center gap-4 md:gap-8 pt-8">
            {[
              { label: "Days", val: timeLeft.days },
              { label: "Hours", val: timeLeft.hours },
              { label: "Minutes", val: timeLeft.minutes },
              { label: "Seconds", val: timeLeft.seconds },
            ].map((box, i) => (
              <div key={i} className="flex flex-col items-center bg-white/10 backdrop-blur-md rounded-xl p-3 md:p-4 w-16 md:w-24 border border-white/20">
                <span className="text-xl md:text-3xl font-bold">{box.val}</span>
                <span className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-[#eae6df] mt-1">{box.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll mouse wheel visual indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center p-1.5 opacity-70">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
          </div>
        </div>
      </header>

      {/* -------------------- COUPLE -------------------- */}
      <section id="couple" className="py-24 max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 relative">
        {/* Bride */}
        <ScrollReveal direction="left">
          <div className="flex flex-col items-center md:items-end text-center md:text-right space-y-6">
            <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden shadow-2xl border-4 border-white" style={{ position: "relative" }}>
              {data.partner1.photo ? (
                <Image
                  src={data.partner1.photo}
                  alt={data.partner1.firstName}
                  fill
                  sizes="(max-width: 768px) 256px, 320px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#f0ebd9] flex items-center justify-center font-serif italic text-4xl text-[#855f18]">
                  {data.partner1.firstName.charAt(0)}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <h3 className="font-serif text-3xl md:text-4xl text-var(--dark)">
                {data.partner1.firstName} {data.partner1.lastName}
              </h3>
              <h6 className="font-sans text-xs tracking-widest uppercase font-semibold text-var(--gold)">
                The Bride
              </h6>
              {data.partner1.parents && (
                <p className="text-sm font-serif italic text-[#777] mt-2">
                  Daughter of {data.partner1.parents}
                </p>
              )}
              <div className="flex justify-center md:justify-end gap-4 pt-3 text-[#777]">
                {data.partner1.facebookUrl && (
                  <a href={data.partner1.facebookUrl} target="_blank" rel="noopener noreferrer" className="hover:text-var(--gold)">
                    Facebook
                  </a>
                )}
                {data.partner1.instagramUrl && (
                  <a href={data.partner1.instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-var(--gold)">
                    Instagram
                  </a>
                )}
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Groom */}
        <ScrollReveal direction="right">
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-6">
            <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden shadow-2xl border-4 border-white" style={{ position: "relative" }}>
              {data.partner2.photo ? (
                <Image
                  src={data.partner2.photo}
                  alt={data.partner2.firstName}
                  fill
                  sizes="(max-width: 768px) 256px, 320px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#f0ebd9] flex items-center justify-center font-serif italic text-4xl text-[#855f18]">
                  {data.partner2.firstName.charAt(0)}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <h3 className="font-serif text-3xl md:text-4xl text-var(--dark)">
                {data.partner2.firstName} {data.partner2.lastName}
              </h3>
              <h6 className="font-sans text-xs tracking-widest uppercase font-semibold text-var(--gold)">
                The Groom
              </h6>
              {data.partner2.parents && (
                <p className="text-sm font-serif italic text-[#777] mt-2">
                  Son of {data.partner2.parents}
                </p>
              )}
              <div className="flex justify-center md:justify-start gap-4 pt-3 text-[#777]">
                {data.partner2.facebookUrl && (
                  <a href={data.partner2.facebookUrl} target="_blank" rel="noopener noreferrer" className="hover:text-var(--gold)">
                    Facebook
                  </a>
                )}
                {data.partner2.instagramUrl && (
                  <a href={data.partner2.instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-var(--gold)">
                    Instagram
                  </a>
                )}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* -------------------- EVENT LOCATION 1 PARALLAX -------------------- */}
      <ParallaxBanner image={data.wedding.venue.photo || "/templates/barcelona/church.jpeg"}>
        <ScrollReveal>
          <h2 className="font-serif text-3xl md:text-5xl font-semibold text-white drop-shadow-md mb-6">
            {data.wedding.venue.name}
          </h2>
          {data.wedding.venue.mapUrl && (
            <a
              href={data.wedding.venue.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-3 border-2 border-white text-white font-semibold rounded tracking-wider hover:bg-white hover:text-var(--dark) transition-all duration-300"
            >
              VIEW ON MAP
            </a>
          )}
        </ScrollReveal>
      </ParallaxBanner>

      {/* -------------------- EVENTS TIMELINE -------------------- */}
      <section id="events" className="py-24 max-w-4xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-16 space-y-2">
            <h6 className="text-xs font-semibold tracking-widest text-var(--gold) uppercase">Schedule</h6>
            <h2 className="font-serif text-4xl md:text-5xl text-var(--dark)">Our Celebrations</h2>
          </div>
        </ScrollReveal>

        <div className="space-y-16">
          {data.events.map((event, idx) => (
            <ScrollReveal key={event.id} direction={idx % 2 === 0 ? "left" : "right"}>
              <div className={`flex flex-col md:flex-row items-center gap-8 ${idx % 2 !== 0 ? "md:flex-row-reverse" : ""}`}>
                {/* Event Photo */}
                <div className="w-full md:w-1/2 aspect-video relative rounded-xl overflow-hidden shadow-lg" style={{ position: "relative" }}>
                  {event.photo ? (
                    <Image
                      src={event.photo}
                      alt={event.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#f0ebd9] flex items-center justify-center font-serif italic text-2xl text-[#855f18]">
                      {event.name}
                    </div>
                  )}
                </div>

                {/* Event Details */}
                <div className="w-full md:w-1/2 space-y-4 text-center md:text-left">
                  <h3 className="font-serif text-2xl md:text-3xl text-var(--dark)">{event.name}</h3>
                  <div className="font-sans text-xs tracking-wider uppercase font-semibold text-var(--gold) space-y-1">
                    <div>{event.time}</div>
                    <div className="text-var(--text-light)">{event.venue}</div>
                  </div>
                  {event.note && <p className="text-sm italic text-[#777]">{event.note}</p>}
                  {event.dressCode && (
                    <p className="text-xs font-semibold uppercase tracking-wider text-var(--dark)">
                      Dress Code: <span className="text-var(--gold)">{event.dressCode}</span>
                    </p>
                  )}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* -------------------- EVENT LOCATION 2 PARALLAX -------------------- */}
      {data.events.length > 1 && (
        <ParallaxBanner image={data.events[1].photo || "/templates/barcelona/couple_pic2.jpeg"}>
          <ScrollReveal>
            <h2 className="font-serif text-3xl md:text-5xl font-semibold text-white drop-shadow-md mb-6">
              {data.events[1].venue}
            </h2>
          </ScrollReveal>
        </ParallaxBanner>
      )}

      {/* -------------------- GALLERY CAROUSEL -------------------- */}
      {data.gallery && data.gallery.length > 0 && (
        <section id="gallery" className="py-24 bg-var(--bg-cream)">
          <ScrollReveal>
            <div className="text-center mb-16 space-y-2">
              <h6 className="text-xs font-semibold tracking-widest text-var(--gold) uppercase">Gallery</h6>
              <h2 className="font-serif text-4xl md:text-5xl text-var(--dark)">Sweet Moments</h2>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div className="max-w-4xl mx-auto px-6 relative group">
              <div className="aspect-[3/2] relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white" style={{ position: "relative" }}>
                <Image
                  src={data.gallery[activeSlide].url}
                  alt={data.gallery[activeSlide].alt || "Wedding Gallery"}
                  fill
                  className="object-cover transition-all duration-700"
                />
              </div>

              {/* Prev / Next controls */}
              <button
                onClick={prevSlide}
                className="absolute left-10 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white text-var(--dark) rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                aria-label="Previous image"
              >
                ←
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-10 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white text-var(--dark) rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                aria-label="Next image"
              >
                →
              </button>

              {/* Dots */}
              <div className="flex justify-center gap-2 mt-6">
                {data.gallery.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveSlide(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${activeSlide === i ? "bg-var(--gold) w-6" : "bg-[#ccc]"}`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </ScrollReveal>
        </section>
      )}

      {/* -------------------- SHARING HAPPINESS (KEY GUESTS) -------------------- */}
      {data.extras.keyGuests && data.extras.keyGuests.length > 0 && (
        <section className="py-24 max-w-6xl mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-16 space-y-2">
              <h6 className="text-xs font-semibold tracking-widest text-var(--gold) uppercase">Key Guests</h6>
              <h2 className="font-serif text-4xl md:text-5xl text-var(--dark)">Sharing Happiness</h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {data.extras.keyGuests.map((guest) => (
              <ScrollReveal key={guest.id}>
                <div className="flex flex-col items-center text-center bg-white border border-[#eae6df] rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300">
                  <div className="relative w-36 h-36 rounded-full overflow-hidden mb-4 border-2 border-var(--gold)" style={{ position: "relative" }}>
                    {guest.photo ? (
                      <Image
                        src={guest.photo}
                        alt={guest.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#f0ebd9] flex items-center justify-center font-serif italic text-2xl text-[#855f18]">
                        {guest.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h4 className="font-serif text-xl text-var(--dark) font-semibold">{guest.name}</h4>
                  {guest.relationship && (
                    <p className="text-xs font-semibold uppercase tracking-wider text-var(--gold) mt-1">
                      {guest.relationship}
                    </p>
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>
      )}

      {/* -------------------- RSVP FORM -------------------- */}
      {data.rsvpConfig.enabled && (
        <section id="rsvp" className="py-24 bg-var(--bg-cream) border-t border-[#eae6df]">
          <div className="max-w-md mx-auto px-6">
            <ScrollReveal>
              <div className="text-center mb-10 space-y-2">
                <h6 className="text-xs font-semibold tracking-widest text-var(--gold) uppercase">RSVP</h6>
                <h2 className="font-serif text-4xl text-var(--dark)">Are You Attending?</h2>
                {data.rsvpConfig.deadline && (
                  <p className="text-xs text-[#888] italic">
                    Please respond by {data.rsvpConfig.deadline}
                  </p>
                )}
              </div>
            </ScrollReveal>

            <ScrollReveal>
              {rsvpStatus === "success" ? (
                <div className="bg-white border-2 border-var(--gold) rounded-2xl p-8 text-center shadow-xl space-y-4">
                  <span className="text-4xl">🎉</span>
                  <h3 className="font-serif text-2xl text-var(--dark)">Thank you!</h3>
                  <p className="text-sm">Your response has been submitted successfully.</p>
                </div>
              ) : (
                <form
                  onSubmit={handleRSVPSubmit}
                  className="bg-white border border-[#eae6df] rounded-2xl p-8 shadow-xl space-y-5"
                >
                  {rsvpStatus === "error" && (
                    <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">
                      {rsvpErrorMsg}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-var(--dark) mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      required
                      className="w-full px-4 py-2 border border-[#eae6df] rounded text-sm focus:outline-none focus:border-var(--gold) transition-colors"
                      placeholder="Jane Doe"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-var(--dark) mb-2">
                        Email (Optional)
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 border border-[#eae6df] rounded text-sm focus:outline-none focus:border-var(--gold) transition-colors"
                        placeholder="jane@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-var(--dark) mb-2">
                        Phone (Optional)
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-2 border border-[#eae6df] rounded text-sm focus:outline-none focus:border-var(--gold) transition-colors"
                        placeholder="+123456789"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-var(--dark) mb-2">
                      Will You Attend?
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Yes", val: "yes" },
                        { label: "No", val: "no" },
                        { label: "Maybe", val: "maybe" },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setAttending(item.val as any)}
                          className={`py-2 text-xs font-bold uppercase rounded border transition-all ${
                            attending === item.val
                              ? "bg-var(--gold) text-white border-var(--gold)"
                              : "border-[#eae6df] hover:bg-[#faf8f5] text-var(--dark)"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {attending !== "no" && data.rsvpConfig.allowPlusOnes && (
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-var(--dark) mb-2">
                        Guests Attending
                      </label>
                      <select
                        value={guestCount}
                        onChange={(e) => setGuestCount(Number(e.target.value))}
                        className="w-full px-4 py-2 border border-[#eae6df] rounded text-sm focus:outline-none focus:border-var(--gold) bg-white"
                      >
                        {[1, 2, 3, 4, 5].map((num) => (
                          <option key={num} value={num}>
                            {num} {num === 1 ? "Guest" : "Guests"}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {attending !== "no" && data.rsvpConfig.mealChoices && data.rsvpConfig.mealChoices.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-var(--dark) mb-2">
                        Meal Choice
                      </label>
                      <select
                        value={mealChoice}
                        onChange={(e) => setMealChoice(e.target.value)}
                        className="w-full px-4 py-2 border border-[#eae6df] rounded text-sm focus:outline-none focus:border-var(--gold) bg-white"
                      >
                        <option value="">Select choice</option>
                        {data.rsvpConfig.mealChoices.map((choice) => (
                          <option key={choice} value={choice}>
                            {choice}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-var(--dark) mb-2">
                      Message to the couple
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-[#eae6df] rounded text-sm focus:outline-none focus:border-var(--gold) transition-colors"
                      placeholder="Congratulations!"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={rsvpStatus === "loading"}
                    className="w-full py-3 bg-var(--gold) text-white hover:bg-var(--dark) font-bold rounded uppercase tracking-wider transition-all shadow-md disabled:opacity-50"
                  >
                    {rsvpStatus === "loading" ? "Submitting..." : "Submit RSVP"}
                  </button>
                </form>
              )}
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* -------------------- FOOTER -------------------- */}
      <footer className="py-16 text-center border-t border-[#eae6df] relative z-10 bg-white">
        <div className="max-w-xl mx-auto px-6 space-y-4">
          <h2 className="font-serif text-3xl font-semibold text-var(--dark)">
            {data.partner1.firstName} {`&`} {data.partner2.firstName}
          </h2>
          {data.extras.hashtag && (
            <p className="text-var(--gold) font-semibold tracking-wider font-sans text-sm">
              #{data.extras.hashtag}
            </p>
          )}
          {data.extras.footerMessage && (
            <p className="text-sm text-[#777] italic font-serif max-w-sm mx-auto">
              "{data.extras.footerMessage}"
            </p>
          )}
          <div className="text-[11px] text-[#999] tracking-wider pt-6 font-semibold uppercase space-y-1">
            <p>&copy; {new Date().getFullYear()} GetMyInvite. All rights reserved.</p>
            <p className="text-xs mt-2 italic">Created via GetMyInvite Wedding Builder</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

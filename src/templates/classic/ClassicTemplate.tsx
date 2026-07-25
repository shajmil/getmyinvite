"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { InvitationData } from "@/lib/zod-schemas";
import { templateRegistry } from "../registry";
import { meddon, lavishly, merienda, pinyon } from "../fonts";

// In case lavishly or other custom fonts are imported in layout, we can fall back to standard serifs
const lavishlyClass = typeof lavishly !== "undefined" ? lavishly.variable : "";

interface ClassicTemplateProps {
  data: InvitationData;
  colorSchemeId: string;
  isPreview?: boolean;
}

export function ClassicTemplate({ data, colorSchemeId, isPreview = false }: ClassicTemplateProps) {
  const scheme =
    templateRegistry.classic.colorSchemes.find((s) => s.id === colorSchemeId) ||
    templateRegistry.classic.colorSchemes[0];

  // Active modal tab state: null | 'invitation' | 'location' | 'contact' | 'rsvp'
  const [activeTab, setActiveTab] = useState<string | null>(null);

  // Background audio music states
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  // Attempt to play music on interaction
  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (musicPlaying) {
      audioRef.current.pause();
      setMusicPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setMusicPlaying(true);
      }).catch((e) => {
        console.log("Audio play blocked by browser", e);
      });
    }
  };

  useEffect(() => {
    // Attempt autoplay if music is configured
    if (data.hero.musicUrl) {
      const audio = new Audio(data.hero.musicUrl);
      audio.loop = true;
      audioRef.current = audio;

      const handleUserInteraction = () => {
        audio.play().then(() => {
          setMusicPlaying(true);
          document.removeEventListener("click", handleUserInteraction);
        }).catch(() => {});
      };

      document.addEventListener("click", handleUserInteraction);

      return () => {
        audio.pause();
        document.removeEventListener("click", handleUserInteraction);
      };
    }
  }, [data.hero.musicUrl]);

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

  return (
    <div
      style={scheme.cssVars as React.CSSProperties}
      className={`min-h-screen text-var(--body-color) overflow-hidden flex items-center justify-center relative py-12 px-4 select-none ${meddon.variable} ${merienda.variable} ${pinyon.variable} ${lavishlyClass} font-sans`}
    >
      {/* Background Loop Video / Photo */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-black">
        {data.hero.videoUrl ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover opacity-60"
            src={data.hero.videoUrl}
          />
        ) : (
          <Image
            src={data.hero.mainPhoto || "/templates/classic/bg.jpg"}
            alt="Wedding Background"
            fill
            priority
            className="object-cover opacity-50"
          />
        )}
        {/* Visual Overlay Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(transparent_50%,rgba(0,0,0,0.4))]" />
      </div>

      {/* Floating Audio Controller */}
      {data.hero.musicUrl && (
        <button
          onClick={toggleMusic}
          className="fixed top-6 right-6 z-50 p-3 bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-white rounded-full transition-all shadow-lg flex items-center justify-center"
          title={musicPlaying ? "Mute Background Music" : "Play Background Music"}
        >
          {musicPlaying ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          )}
        </button>
      )}

      {/* Main Container */}
      <div className="w-full max-w-2xl relative z-10 flex flex-col items-center">
        {/* Header Displayed when NO Active Tab */}
        <AnimatePresence mode="wait">
          {!activeTab && (
            <motion.header
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="text-center flex flex-col items-center"
            >
              {/* Elegant Ring/Heart Icon */}
              <div className="w-16 h-16 border-2 border-white/40 rounded-full flex items-center justify-center mb-6">
                <span className="text-white text-2xl font-serif">❦</span>
              </div>

              {/* Tagline */}
              <p className="font-serif italic text-sm md:text-base uppercase tracking-[0.25em] text-var(--accent-color) max-w-md leading-relaxed mb-6 px-4">
                {data.coupleTagline || "Save Our Date"}
              </p>

              {/* Names */}
              <h1 className="font-serif text-3xl md:text-5xl font-bold tracking-wide text-var(--header-color) mb-4 uppercase drop-shadow-md">
                {data.partner1.firstName} &amp; {data.partner2.firstName}
              </h1>

              {/* Date */}
              <span className="font-mono text-sm tracking-[0.3em] uppercase text-white/80 border-y border-white/20 py-2 px-6 mb-12">
                {new Date(data.wedding.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>

              {/* Tab Navigation */}
              <nav className="w-full">
                <ul className="flex flex-wrap items-center justify-center gap-1 border border-white/20 bg-black/30 rounded-xl overflow-hidden backdrop-blur-md">
                  <li>
                    <button
                      onClick={() => setActiveTab("invitation")}
                      className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-white hover:bg-white/10 hover:text-var(--accent-color) transition-all"
                    >
                      Invitation
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab("location")}
                      className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-white hover:bg-white/10 hover:text-var(--accent-color) transition-all"
                    >
                      Location
                    </button>
                  </li>
                  {((data.extras.contactPersons && data.extras.contactPersons.length > 0) || (data.extras.keyGuests && data.extras.keyGuests.length > 0)) && (
                    <li>
                      <button
                        onClick={() => setActiveTab("contact")}
                        className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-white hover:bg-white/10 hover:text-var(--accent-color) transition-all"
                      >
                        Contact
                      </button>
                    </li>
                  )}
                  {data.rsvpConfig.enabled && (
                    <li>
                      <button
                        onClick={() => setActiveTab("rsvp")}
                        className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-white hover:bg-white/10 hover:text-var(--accent-color) transition-all"
                      >
                        RSVP
                      </button>
                    </li>
                  )}
                </ul>
              </nav>
            </motion.header>
          )}
        </AnimatePresence>

        {/* Tab Article Cards Wrapper */}
        <AnimatePresence>
          {activeTab && (
            <motion.article
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              style={{ backgroundColor: "var(--bg-color)" }}
              className="w-full border border-white/20 rounded-2xl p-8 backdrop-blur-lg shadow-2xl relative"
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveTab(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full border border-white/20 hover:border-white/40 flex items-center justify-center text-white hover:bg-white/10 active:scale-90 transition-all font-sans text-sm font-bold"
                aria-label="Close Tab"
              >
                ✕
              </button>

              {/* -------------------- INVITATION TAB -------------------- */}
              {activeTab === "invitation" && (
                <div className="space-y-6">
                  <h2 className="font-serif text-2xl font-semibold tracking-wider text-var(--header-color) border-b border-white/20 pb-3 uppercase">
                    Invitation
                  </h2>
                  <div className="relative aspect-[3/4] w-full max-w-sm mx-auto rounded-xl overflow-hidden border border-white/20 shadow-lg">
                    <Image
                      src={data.hero.invitationCardUrl || "/templates/classic/invitation.jpg"}
                      alt="Wedding Invitation"
                      fill
                      priority
                      className="object-cover"
                    />
                  </div>
                </div>
              )}

              {/* -------------------- LOCATION TAB -------------------- */}
              {activeTab === "location" && (
                <div className="space-y-6">
                  <h2 className="font-serif text-2xl font-semibold tracking-wider text-var(--header-color) border-b border-white/20 pb-3 uppercase">
                    Venue Location
                  </h2>
                  <div className="relative h-48 w-full rounded-xl overflow-hidden border border-white/20 shadow-md">
                    <Image
                      src={data.wedding.venue.photo || "/templates/classic/hall.png"}
                      alt={data.wedding.venue.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="space-y-2 text-center md:text-left">
                    <h3 className="font-serif text-xl text-var(--header-color) font-bold">{data.wedding.venue.name}</h3>
                    <p className="text-sm text-white/80">{data.wedding.venue.address}</p>
                    <p className="text-sm text-white/80">{data.wedding.venue.city}</p>
                  </div>
                  {data.wedding.venue.mapUrl && (
                    <div className="pt-2 text-center">
                      <a
                        href={data.wedding.venue.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-6 py-3 border border-white/30 text-white rounded font-bold hover:bg-white hover:text-black transition-all"
                      >
                        GET DIRECTIONS
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* -------------------- CONTACT TAB -------------------- */}
              {activeTab === "contact" && (
                <div className="space-y-6">
                  <h2 className="font-serif text-2xl font-semibold tracking-wider text-var(--header-color) border-b border-white/20 pb-3 uppercase">
                    Contacts &amp; Special Guests
                  </h2>
                  {data.extras.contactPersons && data.extras.contactPersons.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-var(--accent-color)">Event Contacts</h3>
                      <div className="flex flex-wrap justify-center gap-4">
                        {data.extras.contactPersons.map((contact) => (
                          <div
                            key={contact.id}
                            className="w-full sm:w-[260px] flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-4 shadow"
                          >
                            <div className="relative w-14 h-14 rounded-full overflow-hidden border border-var(--accent-color) flex-shrink-0">
                              {contact.photo ? (
                                <Image src={contact.photo} alt={contact.name} fill className="object-cover" />
                              ) : (
                                <div className="w-full h-full bg-[#f0ebd9] flex items-center justify-center font-serif text-[#1a1a1a] text-xl font-bold">
                                  {contact.name ? contact.name.charAt(0) : "C"}
                                </div>
                              )}
                            </div>
                            <div className="space-y-1 overflow-hidden">
                              <h4 className="font-serif text-md text-white font-bold truncate">{contact.name || "Contact"}</h4>
                              <p className="text-xs uppercase tracking-wider text-var(--accent-color)">{contact.role}</p>
                              {contact.phone && (
                                <a href={`tel:${contact.phone}`} className="text-xs text-white/60 hover:text-white block font-mono">
                                  📞 {contact.phone}
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.extras.keyGuests && data.extras.keyGuests.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-white/10">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-var(--accent-color)">Special Guests</h3>
                      <div className="flex flex-wrap justify-center gap-4">
                        {data.extras.keyGuests.map((guest) => (
                          <div
                            key={guest.id}
                            className="w-full sm:w-[260px] flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-4 shadow"
                          >
                            <div className="relative w-14 h-14 rounded-full overflow-hidden border border-var(--accent-color) flex-shrink-0">
                              {guest.photo ? (
                                <Image src={guest.photo} alt={guest.name} fill className="object-cover" />
                              ) : (
                                <div className="w-full h-full bg-[#f0ebd9] flex items-center justify-center font-serif text-[#1a1a1a] text-xl font-bold">
                                  {guest.name ? guest.name.charAt(0) : "G"}
                                </div>
                              )}
                            </div>
                            <div className="space-y-1 overflow-hidden">
                              <h4 className="font-serif text-md text-white font-bold truncate">{guest.name || "Special Guest"}</h4>
                              {guest.relationship && (
                                <p className="text-xs uppercase tracking-wider text-var(--accent-color)">{guest.relationship}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* -------------------- RSVP TAB -------------------- */}
              {activeTab === "rsvp" && (
                <div className="space-y-6">
                  <h2 className="font-serif text-2xl font-semibold tracking-wider text-var(--header-color) border-b border-white/20 pb-3 uppercase">
                    Attend RSVP
                  </h2>

                  {rsvpStatus === "success" ? (
                    <div className="bg-white/5 border border-var(--accent-color)/40 rounded-xl p-8 text-center shadow space-y-4">
                      <span className="text-4xl">🎉</span>
                      <h3 className="font-serif text-xl text-white">Confirmation Sent</h3>
                      <p className="text-sm text-white/80">Thank you for submitting your response!</p>
                    </div>
                  ) : (
                    <form onSubmit={handleRSVPSubmit} className="space-y-4 font-sans text-sm">
                      {rsvpStatus === "error" && (
                        <div className="p-3 bg-red-950/50 text-red-300 text-xs rounded border border-red-800">
                          {rsvpErrorMsg}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-2">
                            Name
                          </label>
                          <input
                            type="text"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded focus:outline-none focus:border-var(--accent-color) text-white"
                            placeholder="Your name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-2">
                            Email (Optional)
                          </label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded focus:outline-none focus:border-var(--accent-color) text-white"
                            placeholder="email@example.com"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-2">
                            Phone (Optional)
                          </label>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded focus:outline-none focus:border-var(--accent-color) text-white"
                            placeholder="+12345678"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-2">
                            Will you attend?
                          </label>
                          <select
                            value={attending}
                            onChange={(e) => setAttending(e.target.value as any)}
                            className="w-full px-4 py-2.5 bg-black/40 border border-white/20 rounded focus:outline-none focus:border-var(--accent-color) text-white"
                          >
                            <option value="yes" className="bg-neutral-800">Yes, attending</option>
                            <option value="no" className="bg-neutral-800">No, cannot attend</option>
                            <option value="maybe" className="bg-neutral-800">Maybe</option>
                          </select>
                        </div>
                      </div>

                      {attending !== "no" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {data.rsvpConfig.allowPlusOnes && (
                            <div>
                              <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-2">
                                Number of Guests
                              </label>
                              <select
                                value={guestCount}
                                onChange={(e) => setGuestCount(Number(e.target.value))}
                                className="w-full px-4 py-2.5 bg-black/40 border border-white/20 rounded focus:outline-none focus:border-var(--accent-color) text-white"
                              >
                                {[1, 2, 3, 4, 5].map((num) => (
                                  <option key={num} value={num} className="bg-neutral-800">
                                    {num} {num === 1 ? "Guest" : "Guests"}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {data.rsvpConfig.mealChoices && data.rsvpConfig.mealChoices.length > 0 && (
                            <div>
                              <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-2">
                                Meal Preference
                              </label>
                              <select
                                value={mealChoice}
                                onChange={(e) => setMealChoice(e.target.value)}
                                className="w-full px-4 py-2.5 bg-black/40 border border-white/20 rounded focus:outline-none focus:border-var(--accent-color) text-white"
                              >
                                <option value="" className="bg-neutral-800">Select choice</option>
                                {data.rsvpConfig.mealChoices.map((choice) => (
                                  <option key={choice} value={choice} className="bg-neutral-800">
                                    {choice}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-2">
                          Message
                        </label>
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          rows={2}
                          className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded focus:outline-none focus:border-var(--accent-color) text-white"
                          placeholder="Congratulations!"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={rsvpStatus === "loading"}
                        className="w-full py-3 bg-white text-black hover:bg-var(--accent-color) hover:text-black font-bold uppercase tracking-wider rounded transition-all disabled:opacity-50"
                      >
                        {rsvpStatus === "loading" ? "Sending..." : "Submit RSVP"}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </motion.article>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

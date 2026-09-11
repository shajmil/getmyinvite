"use client";

import { useRef, useState, type FormEvent } from "react";
import type { InvitationData } from "@/lib/zod-schemas";
import styles from "./aurelia.module.css";

export function AureliaRSVP({ config, invitationId, isPreview }: { config: InvitationData["rsvpConfig"]; invitationId?: string; isPreview: boolean }) {
  const [attending, setAttending] = useState("yes");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const pending = useRef(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const form = new FormData(event.currentTarget);
    if (!String(form.get("guestName") || "").trim()) { setError("Please enter your name."); setStatus("error"); return; }
    if (isPreview) { setStatus("success"); return; }
    if (!invitationId) { setError("This invitation is not ready to receive responses yet."); setStatus("error"); return; }
    pending.current = true;
    setStatus("loading");
    setError("");
    try {
      const answer = String(form.get("customAnswer") || "").trim();
      const message = [String(form.get("message") || ""), answer ? `${config.customQuestion}: ${answer}` : ""].filter(Boolean).join("\n\n");
      const response = await fetch("/api/rsvp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId, guestName: String(form.get("guestName")).trim(), email: form.get("email"), phone: form.get("phone"), attending, guestCount: attending !== "no" && config.allowPlusOnes ? Number(form.get("guestCount")) || 1 : 1, mealChoice: attending !== "no" ? form.get("mealChoice") : "", message, botField: form.get("website") }),
      });
      if (!response.ok) throw new Error("Your response could not be sent. Please try again in a moment.");
      setStatus("success");
    } catch { setError("Your response could not be sent. Please check your connection and try again."); setStatus("error"); }
    finally { pending.current = false; }
  }
  return <div className={styles.rsvpPanel}>
    {status === "success" ? <div className={styles.success} role="status"><span aria-hidden="true">✧</span><h3>{isPreview ? "A little preview of your reply." : "Thank you for letting us know."}</h3><p>{isPreview ? "This is a demo. No response has been sent." : "Your response has been received with love."}</p>{isPreview && <button className={styles.button} onClick={() => setStatus("idle")}>Try the form again</button>}</div> : <form onSubmit={submit}>
      {isPreview && <p className={styles.formNote}>Preview mode — responses are not sent.</p>}
      <div className={styles.formGrid}>
        <label>Your name <span aria-hidden="true">*</span><input name="guestName" autoComplete="name" required maxLength={150} /></label>
        <label>Email address<input name="email" type="email" autoComplete="email" maxLength={254} /></label>
        <label>Phone number<input name="phone" type="tel" autoComplete="tel" maxLength={40} /></label>
        <label>Will you join us?<select value={attending} onChange={e => setAttending(e.target.value)}><option value="yes">Joyfully attending</option><option value="no">Sadly unable to attend</option><option value="maybe">Still making plans</option></select></label>
        {attending !== "no" && config.allowPlusOnes && <label>Number of guests, including you<input type="number" name="guestCount" min={1} max={100} defaultValue={1} required /></label>}
        {attending !== "no" && !!config.mealChoices?.length && <label>Meal preference<select name="mealChoice"><option value="">Select a preference</option>{config.mealChoices.map((meal, index) => <option key={`${meal}-${index}`}>{meal}</option>)}</select></label>}
      </div>
      {config.customQuestion && <label>{config.customQuestion}<input name="customAnswer" maxLength={1000} /></label>}
      <label>A note for the couple<textarea name="message" rows={3} maxLength={2000} /></label>
      <div hidden aria-hidden="true"><label>Leave this empty<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      {status === "error" && <p role="alert" className={styles.error}>{error}</p>}
      <button className={styles.button} disabled={status === "loading"} type="submit">{status === "loading" ? "Sending your reply…" : "Send with love"}<span aria-hidden="true">↗</span></button>
    </form>}
  </div>;
}

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./marketing.module.css";

const palettes = [
  { name: "Vintage Gold", color: "#855f18", paper: "#faf8f5" },
  { name: "Imperial Wine", color: "#5c061e", paper: "#f9f5f0" },
];

export function InvitationShowcase() {
  const [palette, setPalette] = useState(0);
  return (
    <div className={styles.showcase}>
      <div className={styles.orbit} aria-hidden="true" />
      <div className={styles.saveDate} aria-hidden="true"><span>THE BEGINNING OF FOREVER</span><p>Save<br />the date.</p><span>24 · 12 · 2026</span><i>A &amp; A</i></div>
      <Link href="/test-templates?template=barcelona" className={styles.invitation} style={{ backgroundColor: palettes[palette].paper, color: palettes[palette].color }} aria-label="Explore the Barcelona invitation live preview">
        <span className={styles.cardEyebrow}>TOGETHER WITH OUR FAMILIES</span>
        <h2>Aarav <em>&amp;</em> Ananya</h2>
        <div className={styles.heroPhoto}><Image src="/templates/barcelona/ai-couple1.png" alt="Couple standing together in the green hills at sunset" fill sizes="(max-width: 600px) 65vw, 300px" preload /></div>
        <p>Our forever starts with you.</p><span className={styles.cardEyebrow}>24 DECEMBER 2026 · KERALA</span>
        <span className={styles.cardLink}>Open invitation ↗</span>
      </Link>
      <div className={styles.seal} aria-hidden="true">with<br /><em>love</em></div>
      <fieldset className={styles.palette}><legend>Make it your colour</legend>{palettes.map((item, index) => <button key={item.name} type="button" aria-label={item.name} aria-pressed={palette === index} onClick={() => setPalette(index)} style={{ background: item.color }} />)}<span aria-live="polite">{palettes[palette].name}</span></fieldset>
    </div>
  );
}

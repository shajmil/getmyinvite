import Image from "next/image";
import { ArrowUpRight, MapPin } from "lucide-react";
import type { AdditionalVenue } from "@/lib/zod-schemas";
import styles from "./additional-venues.module.css";

export function AdditionalVenues({ venues, variant = "eternal-journey" }: {
  venues?: AdditionalVenue[];
  variant?: "barcelona" | "aurelia" | "eternal-journey" | "nocturne" | "classic";
}) {
  const namedVenues = venues?.filter((venue) => venue.name.trim());
  if (!namedVenues?.length) return null;

  return (
    <section aria-label="Additional venues" className={`${styles.venues} ${styles[variant]}`}>
      {namedVenues.map((venue) => (
        <article key={venue.id} className={`${styles.venue} ${venue.photo ? styles.withPhoto : ""}`}>
          {venue.photo && (
            <div className={styles.photo}>
              <Image src={venue.photo} alt={venue.name} fill sizes="(max-width: 700px) 100vw, 60vw" className={styles.image} />
            </div>
          )}
          <div className={styles.details}>
            <p className={styles.label}>{venue.label || "Celebrate with us"}</p>
            <h3 className={styles.title}>{venue.name}</h3>
            {(venue.address || venue.city) && <p className={styles.address}>{[venue.address, venue.city].filter(Boolean).join(", ")}</p>}
            {venue.mapUrl && /^https?:\/\//i.test(venue.mapUrl) && (
              <a href={venue.mapUrl} target="_blank" rel="noopener noreferrer" className={styles.directions} aria-label={`Get directions to ${venue.name}`}>
                <MapPin aria-hidden="true" size={14} /> Get directions <ArrowUpRight aria-hidden="true" size={14} />
              </a>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}

import Image from "next/image";
import type { AdditionalVenue } from "@/lib/zod-schemas";
import styles from "./additional-venues.module.css";

export function AdditionalVenues({ venues }: { venues?: AdditionalVenue[] }) {
  const namedVenues = venues?.filter((venue) => venue.name.trim());
  if (!namedVenues?.length) return null;

  return (
    <section aria-label="Additional venues" className={styles.venues}>
      <h2 className={styles.heading}>More places to celebrate</h2>
      <div className={styles.grid}>
        {namedVenues.map((venue) => (
          <article key={venue.id} className={styles.card}>
            {venue.photo && <div className={styles.photo}><Image src={venue.photo} alt={venue.name} fill sizes="(max-width: 640px) 90vw, 480px" className={styles.image} /></div>}
            {venue.label && <p className={styles.label}>{venue.label}</p>}
            <h3 className={styles.title}>{venue.name}</h3>
            {venue.address && <p className={styles.address}>{venue.address}</p>}
            {venue.city && <p className={styles.address}>{venue.city}</p>}
            {venue.mapUrl && /^https?:\/\//i.test(venue.mapUrl) && (
              <a href={venue.mapUrl} target="_blank" rel="noopener noreferrer" className={styles.directions} aria-label={`Get directions to ${venue.name}`}>
                Get directions <span aria-hidden="true">↗</span>
              </a>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

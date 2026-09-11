import Image from "next/image";
import Link from "next/link";
import { InvitationShowcase } from "./InvitationShowcase";
import styles from "./marketing.module.css";

export const homeFaqs = [
  { q: "Is GetMyInvite really free?", a: "Yes. Create, customize, preview, and publish your wedding website to a unique link for free." },
  { q: "Can I collect RSVPs from guests?", a: "Yes. Enable the RSVP form on your invitation. View guest responses, attendance counts, and preferences in your dashboard, and export your guest list as a CSV." },
  { q: "Can I update the details after publishing?", a: "Yes. Edit and save your photos, story, dates, and venue details from your dashboard. Your guests can keep using the same invitation link." },
  { q: "Do my guests need to download an app?", a: "No. Guests open your invitation link in their browser, on a phone, tablet, or computer." },
];

function Action({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link className={styles.button} href={href}>{children}<span aria-hidden="true">↗</span></Link>;
}

export function LuxuryHome({ isLoggedIn, templates }: { isLoggedIn: boolean; templates: { id: string; name: string; description: string }[] }) {
  const startHref = isLoggedIn ? "/dashboard" : "/templates";
  return <div className={styles.site}>
    <a className={styles.skip} href="#main">Skip to content</a>
    <header className={styles.header}>
      <Link href="/" className={styles.brand}>GetMyInvite<span>AN INVITATION TO REMEMBER</span></Link>
      <nav aria-label="Main navigation" className={styles.nav}><Link href="#collection">The collection</Link><Link href="#how-it-works">How it works</Link><Link href={isLoggedIn ? "/dashboard" : "/sign-in"}>{isLoggedIn ? "Dashboard" : "Sign in"}<span aria-hidden="true"> ↗</span></Link></nav>
    </header>
    <main id="main">
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}><span aria-hidden="true">✧</span> BEAUTIFUL BEGINNINGS, BEAUTIFULLY SHARED</p>
          <h1 className={styles.heroTitle}>A little link.<br />A beautiful<br /><em>forever.</em></h1>
          <p className={styles.intro}>Your story deserves more than a message.<br />Create a wedding invitation that feels like you.<br />Thoughtfully designed. Joyfully shared.</p>
          <Action href={startHref}>{isLoggedIn ? "Your invitations" : "Create your invitation"}</Action>
          <p className={styles.note}>Free to create. A pleasure to receive.</p>
        </div>
        <InvitationShowcase />
        <div className={styles.heroFoot}><span>DIGITAL INVITATIONS. REAL CONNECTIONS.</span><a href="#collection">Discover the collection <span aria-hidden="true">↓</span></a></div>
      </section>
      <div className={styles.ribbon}><span>Made for your story</span><i>✧</i><span>Shared in a moment</span><i>✧</i><span>Remembered for a lifetime</span></div>
      <section id="collection" className={styles.section}>
        <div className={styles.sectionHead}><div><p className={styles.eyebrow}>01 / THE COLLECTION</p><h2>Distinct expressions.<br /><em>Endlessly yours.</em></h2></div><p>Start with a design you love.<br />Make every detail your own.</p></div>
        <div className={styles.collection}>{templates.map((template, index) => <article key={template.id} className={styles.template}>
          <Link href={`/test-templates?template=${encodeURIComponent(template.id)}`} className={`${styles.templateArt} ${index % 2 ? styles.darkArt : ""}`} aria-label={`Preview ${template.name}`}>
            {template.id === "barcelona" ? (
              <div className={styles.photoCard}>
                <Image src="/templates/barcelona/ai-couple2.png" alt="Wedding couple in a romantic outdoor setting" fill sizes="(max-width: 700px) 75vw, 350px" />
                <div><span>WE’RE GETTING MARRIED</span><p>Aarav &amp; Ananya</p><small>THE START OF SOMETHING BEAUTIFUL</small></div>
              </div>
            ) : template.id === "aurelia" ? (
              <div className={styles.aureliaCard}>
                <span className={styles.aureliaMonogram}>S / G</span>
                <div className={styles.aureliaPortrait}>
                  <Image src="/templates/barcelona/ai-couple1.png" alt="Couple in romantic editorial setting" fill sizes="(max-width: 700px) 75vw, 350px" />
                </div>
                <span>A CELEBRATION OF LOVE</span>
                <p>Sophia<br /><em>&amp;</em><br />Garyson</p>
                <small>20 · 12 · 2026 · KERALA</small>
                <div className={styles.aureliaNav}>THE DAY &nbsp; · &nbsp; MEMORIES &nbsp; · &nbsp; RSVP</div>
              </div>
            ) : (
              <div className={styles.classicCard}>
                <span>THE WEDDING CELEBRATION OF</span>
                <p>Aarav<br /><em>&amp;</em><br />Ananya</p>
                <span>TOGETHER IS A BEAUTIFUL PLACE TO BE</span>
                <div>OUR STORY &nbsp; · &nbsp; THE DAY &nbsp; · &nbsp; RSVP</div>
              </div>
            )}
            <span className={styles.previewBadge}>Explore live preview ↗</span>
          </Link><div className={styles.templateCaption}><div><span className={styles.eyebrow}>COLLECTION / 0{index + 1}</span><h3>{template.name}</h3><p>{template.description}</p></div><Link href={`/test-templates?template=${encodeURIComponent(template.id)}`} aria-label={`Open ${template.name} preview`}>↗</Link></div>
        </article>)}</div><p className={styles.collectionNote}>A glimpse of the possibilities. Explore a live preview to experience each template.</p>
      </section>
      <section id="how-it-works" className={styles.process}><div className={styles.sectionHead}><div><p className={styles.eyebrow}>02 / FROM YOUR HEART TO THEIR PHONE</p><h2>A meaningful invitation.<br /><em>A wonderfully simple start.</em></h2></div></div><div className={styles.steps}>{[
        ["Choose your canvas", "Discover a design that feels right. Choose your template and its colour palette."],
        ["Tell your story", "Add your names, favourite photos, wedding events, and all the details that make it yours."],
        ["Let the joy travel", "Publish your personal link, share it with your guests, and follow their RSVPs in your dashboard."],
      ].map(([title, text], index) => <div key={title}><span className={styles.stepNumber}>0{index + 1}</span><h3>{title}</h3><p>{text}</p></div>)}</div></section>
      <section className={`${styles.section} ${styles.detailsSection}`}><div className={styles.guestVisual}><span className={styles.eyebrow}>A PLACE FOR EVERY LITTLE DETAIL</span><div className={styles.eventCard}><span>THE WEDDING DAY</span><h3>Be there for<br /><em>the beginning.</em></h3><div><span>24 DECEMBER</span><span>THURSDAY · 4:00 PM</span></div><p>The ceremony, the celebration,<br />and all our favourite people.</p><span className={styles.samplePill}>Joyfully attending ✓</span></div><p>Illustrative guest experience</p></div><div><p className={styles.eyebrow}>03 / THOUGHTFULLY CONNECTED</p><h2>All the details.<br /><em>All the feeling.</em></h2><div className={styles.feature}><h3>A story worth sharing</h3><p>Let your favourite photos and your story set the tone before the celebrations begin.</p></div><div className={styles.feature}><h3>Every moment, in one place</h3><p>Bring together ceremony timings, venue map links, and the people your guests can contact.</p></div><div className={styles.feature}><h3>A warm yes, beautifully organised</h3><p>Collect RSVPs on your invitation. Keep track of responses and export your guest list from your dashboard.</p></div><Link href="/templates" className={styles.textLink}>Find your invitation <span aria-hidden="true">↗</span></Link></div></section>
      <section className={`${styles.section} ${styles.faq}`}><div><p className={styles.eyebrow}>A FEW THINGS YOU MIGHT WONDER</p><h2>Before you<br /><em>say hello.</em></h2></div><div>{homeFaqs.map(faq => <details key={faq.q}><summary>{faq.q}<span aria-hidden="true">+</span></summary><p>{faq.a}</p></details>)}</div></section>
      <section className={styles.finalCta}><span aria-hidden="true">✧</span><p className={styles.eyebrow}>YOUR NEXT CHAPTER STARTS HERE</p><h2>Let’s make something<br /><em>worth opening.</em></h2><Action href={startHref}>{isLoggedIn ? "Your invitations" : "Create your free invitation"}</Action><p>No design skills needed. Just your story.</p></section>
    </main>
    <footer className={styles.footer}><div><Link className={styles.brand} href="/">GetMyInvite</Link><p>For the moments that bring us together.</p></div><nav aria-label="Footer navigation"><Link href="/templates">Templates</Link><Link href="/kerala-wedding-invitation-website">Kerala wedding websites</Link><Link href="/malayalam-wedding-invitation-online">Malayalam invitations</Link><Link href="/free-wedding-rsvp-website-india">Free wedding RSVP</Link></nav><div className={styles.copyright}><span>© {new Date().getFullYear()} GetMyInvite</span><span>Made with care. Website by Shajmil.</span></div></footer>
  </div>;
}

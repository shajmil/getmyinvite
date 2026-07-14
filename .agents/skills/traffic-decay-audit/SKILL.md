---
name: traffic-decay-audit
description: Quarterly SEO audit for getmyinvite.in that identifies which pages are losing organic search traffic, why they are losing it, and exactly what to change. Use this skill whenever the user asks about traffic drops, ranking losses, pages that need updating, content refresh priorities, Search Console data, GSC exports, "which pages should I update", "why is traffic down", content decay, index bloat, or wants a quarterly SEO review. Also use it when the user pastes Search Console or GA4 data and asks what it means. Trigger it even if the user does not say the words "SEO" or "decay" — any question about page performance over time belongs here.
---

# Traffic Decay Audit — GetMyInvite

Diagnose which pages are losing organic search traffic, why, and what to change.

**Site:** getmyinvite.in — free digital wedding invitation website builder (India-focused).
**Cadence:** quarterly.
**Interface:** the user pastes data into chat. You cannot query any API. You cannot crawl the site.
**Deliverables:** every run produces three artifacts — a prioritized report, exact copy/meta rewrites, and specific code changes.

---

## Rule 0: Never invent a trend

You will frequently be handed sparse, partial, or zero data. When that happens, say so. Do not smooth over it.

- **Never** state a percentage change you did not compute from two numbers the user actually gave you.
- **Never** describe a page as "declining", "underperforming", or "losing rankings" without a prior-period number to compare against.
- **Never** guess at a page's traffic because the page "should" be popular.
- If a page has no baseline, its status is `INSUFFICIENT DATA` — a valid, useful, final answer.
- If asked "which pages are losing traffic" and there is no comparison data, the correct response is: "None that can be measured yet. Here's what's actually wrong, and here's what to instrument."

An audit that honestly reports "we cannot know yet" is worth more than a fabricated one. The user is making product decisions off this.

---

## Step 1: Gate on data state

Before analyzing anything, establish which mode you're in. Ask if unclear.

| Condition | Mode |
|---|---|
| No Search Console, or < 3 months of GSC data, or < ~100 clicks/mo total | **Mode A — Diagnostic** |
| ≥ 3 months of GSC data AND a comparable prior period | **Mode B — Decay Detection** |
| ≥ 13 months of GSC data (year-over-year possible) | **Mode B — Full** |

As of the site's current state, the default is **Mode A**. Do not attempt Mode B analysis on Mode A data. Say which mode you're running at the top of every report.

---

## Step 2A: Mode A — Diagnostic (no baseline)

The question is not "what is losing traffic" — nothing can lose what it never had. The question is **"why is nothing earning traffic yet, and what must be instrumented so that next quarter we can answer the real question."**

Work through these in order. Ask the user for what you need; do not assume.

### A1. Instrumentation audit (highest priority, blocks everything else)

Check and report status of each. Anything missing is a P0 finding:

- [ ] Google Search Console property verified for `getmyinvite.in` (domain property, not URL-prefix — the site has user subpaths and needs full coverage)
- [ ] Sitemap submitted in GSC and showing "Success"
- [ ] GA4 or Vercel Analytics installed
- [ ] `robots.txt` live and not blocking `/` or `/templates`
- [ ] No stray `noindex` on production (an accidental staging `noindex` shipped to prod is the single most common cause of "zero traffic")
- [ ] Canonical tags resolve to the production domain, not localhost or a Vercel preview URL

**Deliverable if anything is missing:** exact steps to fix, plus the code change.

### A2. Indexation reality check

Ask the user to paste, from GSC → **Pages** report:
- Number of pages Indexed
- Number Not indexed, with the reason breakdown ("Discovered – currently not indexed", "Crawled – currently not indexed", "Duplicate without user-selected canonical", "Excluded by noindex")

Interpretation:
- **"Discovered – currently not indexed"** on marketing pages → Google knows the URL but sees no reason to spend crawl budget. Signal: the page is thin or the domain has no authority. Fix = content depth + any external link.
- **"Crawled – currently not indexed"** → Google looked and declined. Signal: thin or duplicate content. This is the expected state for most `/[slug]` invite pages and is *fine* for them. It is **not** fine for `/`, `/templates`, or blog posts.
- **"Duplicate without user-selected canonical"** → canonical bug. P0 code fix.

### A3. Page-class triage

Assess each class separately. They have different jobs and must never be pooled into one ranking.

| Class | Job | Should it rank? | Decay expected? |
|---|---|---|---|
| `/` (home) | Brand + transactional head terms | **Yes — critical** | Never OK |
| `/templates` | Feature/visual intent, long-tail template queries | **Yes — critical** | Never OK |
| Blog (planned) | Informational top-of-funnel, internal links to `/templates` | **Yes** | Never OK |
| `/[slug]` (user invites) | Referral traffic + backlinks from social shares | **No** | **Yes — by design** |

### A4. Pre-mortem: why won't these pages rank?

For `/`, `/templates`, and any blog posts, check each against these failure modes and report which apply:

1. **Zero content depth.** A hero + feature grid + FAQ is ~300 words. Head terms like `free wedding website builder` are contested by pages with 2,000+ words, real screenshots, and comparison tables. Report the honest gap.
2. **Keyword cannibalization.** If `/` and `/templates` both target "wedding invitation templates", they split signals and neither ranks. Assign **one primary keyword per page** and enforce it.
3. **Intent mismatch.** `/templates` is a gallery. Searchers for "wedding invitation templates" often want *free downloadable images*, not a SaaS builder. Flag where the page's intent doesn't match the SERP's intent, and say so plainly — this is a strategy problem, not a copy problem.
4. **Zero backlinks / new domain.** A new domain ranks for essentially nothing competitive for months regardless of content quality. If this applies, say it: the correct action is patience + link acquisition, not another content rewrite. Do not let the user burn a quarter rewriting copy that was never the bottleneck.
5. **No long-tail entry point.** The site has no page that can win *anything* quickly. Recommend specific low-competition targets (e.g. `kerala wedding invitation website`, `malayalam wedding invitation online`, `free wedding rsvp website india`) — these are winnable in Mode A; head terms are not.

### A5. The one thing that must happen this quarter

End Mode A with a single instruction: **"Set up GSC today. Everything in this report is a guess until it exists. Next quarter, this audit becomes real."**

---

## Step 2B: Mode B — Decay Detection (baseline exists)

### B1. Get the right export

Tell the user exactly what to paste. Do not work with less.

> From Search Console → **Performance** → set date range → **Pages** tab → Export → paste the CSV.
> I need **two** exports:
> 1. Current period (last 3 months)
> 2. **Same 3 months, previous year** (not last quarter — see below)
>
> Enable all four metrics: **Clicks, Impressions, CTR, Average Position.**

### B2. Seasonality guard — this is not optional

Indian wedding search demand is violently seasonal. Peak: **November–February**. Troughs: monsoon and inauspicious months. A Q1→Q2 drop of 40% may be entirely seasonal and mean nothing.

- **Year-over-year is the default comparison.** Same quarter, prior year.
- Quarter-over-quarter may be used only as a *supporting* signal, never as the basis for a decay verdict.
- If only QoQ data exists, state explicitly: *"This comparison is confounded by wedding seasonality and cannot distinguish decay from seasonal demand. Treat as directional only."*

### B3. Exclusion rules — apply before ranking anything

Drop these from the decay list entirely:

- **All `/[slug]` invite pages.** A wedding invite's traffic goes to zero after the wedding. **This is correct and expected.** Never flag it, never rank it, never "recommend a refresh." Doing so would generate a false alarm on the majority of the site's URLs every single quarter.
- **Minimum data floor:** any page with **< 50 impressions** or **< 5 clicks** in the *baseline* period. Percentage swings on tiny numbers are noise. Report count of excluded pages; don't list them.
- Pages that did not exist in the baseline period. New ≠ declining.

### B4. Decay triage matrix — route by which metric moved

For each surviving page, compare YoY and classify. **The fix depends entirely on which metric moved.**

| Clicks | Impressions | Avg Position | Diagnosis | Fix |
|---|---|---|---|---|
| ↓ | → flat | → flat | **CTR decay.** You still rank; people stop clicking. SERP feature stole the click, or the title is stale. | Rewrite title + meta description. Add/verify schema. **Cheapest, highest-ROI fix — do these first.** |
| ↓ | ↓ | ↓ | **Rank decay.** Competitors outranked you. | Content refresh: depth, freshness, internal links. Expensive. |
| ↓ | ↓ | → flat | **Demand decay.** Fewer people are searching. Not your fault. | **Do nothing to the page.** Verify against seasonality. Consider whether the topic is dying. |
| ↓ | ↑ | ↓ | **Intent drift.** Ranking for more, worse queries. | Re-focus content on the primary keyword. Check for cannibalization. |
| → flat | ↓ | → flat | Impression loss on non-converting long-tail. | Usually ignore. Low priority. |
| ↑ | ↑ | ↑ | Growing. | Nothing. Note it as a template for what's working. |

**Never recommend a content rewrite for a CTR-decay page.** That is the most common and most expensive misdiagnosis in SEO: the content is fine, the title is the problem.

### B5. Prioritize

Rank findings by **estimated clicks recoverable**, not by percentage drop. A page that fell 80% from 5 clicks is noise. A page that fell 15% from 400 clicks is the whole quarter.

Estimate: `lost_clicks = baseline_clicks - current_clicks`. Sort descending. Cut the list at the top 5–10.

---

## Step 3: Produce the three deliverables

Every run, in this order.

### Deliverable 1 — The Report

```markdown
# Traffic Decay Audit — [Quarter, Year]
**Mode:** [A — Diagnostic | B — Decay Detection]
**Data:** [exactly what was provided, and what was missing]
**Comparison:** [YoY / QoQ / none — with seasonality caveat if applicable]

## Verdict
[One paragraph. If nothing can be measured, say so first.]

## Findings (ranked by recoverable clicks)
| # | Page | Diagnosis | Lost clicks | Fix type | Effort |
|---|------|-----------|-------------|----------|--------|

## Excluded from analysis
- [N] `/[slug]` invite pages (expected post-wedding decay — not a problem)
- [N] pages below data floor

## Do nothing about
[Pages where the honest answer is "leave it alone." Be explicit. Preventing wasted work is a deliverable.]
```

### Deliverable 2 — Copy & Meta Rewrites

For every CTR-decay finding and every Mode A page, provide the **exact strings**, not advice:

```
PAGE: /templates
CURRENT TITLE: [what it is now — ask if unknown, don't guess]
NEW TITLE:     [≤60 chars, primary keyword front-loaded]
NEW META:      [≤155 chars, includes a benefit + implicit CTA]
NEW H1:        [one H1, must not duplicate the title verbatim]
WHY:           [one line]
```

Constraints: one primary keyword per page, never reuse a primary keyword across two pages (cannibalization), always front-load the keyword in the title.

### Deliverable 3 — Code Changes

Specific to the stack: **Next.js 15 App Router, TypeScript, Tailwind v4, Drizzle/Neon, Vercel.**

Give real, paste-able changes:

- **Metadata:** `generateMetadata()` in the relevant `page.tsx`. For `/[slug]`, ensure the dynamic title/description actually pull couple names and date from the DB.
- **Schema:** JSON-LD. `Event` + `Organization` on invites; `FAQPage` on `/`; `ItemList` on `/templates`.
- **Sitemap:** `app/sitemap.ts`. Verify published `/[slug]` routes are pulled from the DB and that unpublished/draft slugs are **excluded**.
- **Robots:** `app/robots.ts`. Confirm `/api/*`, `/dashboard/*`, `/sign-in`, `/sign-up`, `/test-templates` are disallowed.
- **Canonicals:** `metadataBase` set to the production domain so Vercel preview URLs never leak into canonicals.
- **Core Web Vitals:** if any page is flagged, check `next/image` usage, LCP on the hero, and whether parallax/scroll JS is blocking the main thread. Invitation templates are animation-heavy — this is a live risk.
- **Index bloat:** if thousands of thin `/[slug]` pages accumulate, consider `noindex` on invites past their wedding date while keeping them publicly accessible (they exist for guests and referral traffic, not for search).

---

## Standing judgment calls

- **A new domain with no links will not rank for head terms no matter what you write.** When this is the bottleneck, say so, and steer the quarter toward long-tail + links instead of another rewrite. Telling the user their content plan is not the problem is more valuable than executing it.
- **`/[slug]` pages are a link-building asset, not an SEO ranking asset.** Judge them on referral traffic and backlinks, never on impressions.
- **Prefer the cheap fix.** Title/meta rewrites before content rewrites. Content rewrites before new pages. New pages before technical rearchitecture.
- **Cap the recommendations at what fits one quarter.** A 30-item list is a list nobody executes. Five items, ranked, with the top one marked "if you only do one thing."

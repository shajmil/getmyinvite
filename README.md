This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Cloudflare recovery from Vercel suspension

Migration status: local hosting configuration is prepared. Production data, backups, deployment and DNS must still be verified. Keep the existing PostgreSQL database, R2 bucket, Supabase project and domains. Do not delete the suspended Vercel projects or run schema migrations as part of moving hosting.

### Protect the existing data first

1. Export both projects' Production environment variables from Vercel into private local files, never Git or chat. Preserve the exact `DATABASE_URL`, `BETTER_AUTH_SECRET`, Google credentials, R2 credentials and any existing payment/webhook secrets. Losing the auth secret can invalidate sessions and encrypted provider credentials.
2. Identify the provider behind `DATABASE_URL`, verify direct access, and take a database backup/snapshot. Confirm user, invitation, content, RSVP and payment row counts. Keep Supabase's existing database and authentication settings for chiri-party; take a backup there too. No backup has been made by these local changes.
3. Inventory photo URLs in invitation content and assets. R2 objects can stay at their existing URLs. Download and verify any Vercel Blob files while they remain accessible. A suspended Blob URL may remain broken after moving hosting; recover those objects and update their references only after verifying copies. Retain `BLOB_READ_WRITE_TOKEN` if legacy `/uploads/` redirects still depend on it. Do not assume every upload is in R2.
4. Leave expiry cleanup disabled during recovery: do not set `CRON_SECRET` on the new Worker, and disable the old Vercel schedule if it can still execute. `vercel.json` is ignored by Cloudflare. This configuration deliberately adds no Cloudflare deletion schedule.

### GetMyInvite: Cloudflare Workers

Use Node.js 22 or newer. This project uses OpenNext with the existing Next.js application. `next/image` serves original images during recovery, avoiding an additional Cloudflare Images dependency. Keep existing `R2_PUBLIC_URL` URLs unchanged.

```bash
npm ci
npx wrangler login
npm run build:cloudflare
npx wrangler deploy --dry-run
npm run deploy:cloudflare
```

Use Linux (Cloudflare Workers Builds or WSL) if the OpenNext packaging step fails on Windows. Deploy to the Worker preview URL before attaching the public domain. For Git integration, use build command `npm run build:cloudflare` and deploy command `npx opennextjs-cloudflare deploy`. Do not use a static export for this project: login, database queries, server actions, RSVP and payments need the Worker.

The current minified deployment dry run is about 10,669 KiB uncompressed. This fits Cloudflare's [64 MiB limit across plans](https://developers.cloudflare.com/changelog/post/2026-09-04-increased-worker-size-limit/); the former compressed-size limits were removed. Runtime limits still need testing with the existing database before cutover. No billing plan has been changed.

Set runtime settings in **Workers & Pages → getmyinvite → Settings → Variables and Secrets**:

| Settings | Required values |
| --- | --- |
| Database | Existing `DATABASE_URL`; use the same database, not a new empty one |
| Login | Existing `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`; `BETTER_AUTH_URL=https://getmyinvite.in` |
| Photo storage | Existing `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` |
| Public site | `NEXT_PUBLIC_SITE_URL=https://getmyinvite.in` |
| Optional browser integrations | Existing `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_MAPBOX_TOKEN` if used |
| Email | Existing `RESEND_API_KEY` if used |
| Payments | Preserve existing `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `PREMIUM_PAYMENTS_ENABLED`; keep checkout disabled if it was not already live |
| Deployment | `DEPLOYMENT_ENV=production`; use `preview` only for staging with disposable test data |

Store credentials as secrets. `keep_vars` preserves dashboard variables on redeployment. Also supply `NEXT_PUBLIC_*` variables and `R2_PUBLIC_URL` to the **build** environment; Next.js embeds public variables and image configuration at build time. Never prefix server secrets with `NEXT_PUBLIC_`.

For staging login tests, explicitly add the exact preview origin to `trustedOrigins` in `src/lib/auth.ts`, set its `BETTER_AUTH_URL`, and register the matching Google OAuth callback `/api/auth/callback/google`. Keep staging separate from production data. The production domain and callback can remain unchanged after DNS switches. Confirm the existing R2 bucket CORS policy permits uploads from `https://getmyinvite.in` and `https://www.getmyinvite.in`.

### chiri-party: Cloudflare Pages

The second repository is `https://github.com/shajmil/chiri-party`, locally at `C:/shajmil/chiri-party`. Its `output: "export"` produces `out/`; the added `wrangler.jsonc` configures Pages to serve those assets. `public/_headers` retains the audio cache header previously supplied by Vercel. Pages supports the existing subdomain while keeping GoDaddy nameservers.

Keep the existing Supabase project and the same build variables: `NEXT_PUBLIC_SUPABASE_URL` plus `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or the existing `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Preserve `NEXT_PUBLIC_TURN_URL`, `NEXT_PUBLIC_TURN_USERNAME` and `NEXT_PUBLIC_TURN_CREDENTIAL` if configured. Never use a Supabase service role key in the browser. Rebuild after setting these variables; a static site's runtime variables cannot change an already compiled bundle.

From the chiri-party repository:

```bash
npm ci
npm run build:cloudflare
npm run deploy:cloudflare
```

The Pages project is already deployed at `https://chiri-party.pages.dev`, with `chiri-party.shajmil.site` registered as a pending custom domain. In GoDaddy DNS for `shajmil.site`, edit only the `chiri-party` CNAME: replace `919aab3411ffe530.vercel-dns-017.com` with `chiri-party.pages.dev`. Wait for Cloudflare custom-domain validation and TLS, then check the final URL. Do not change this zone's nameservers just for chiri-party. Public DNS values from before the switch were saved locally in `.wrangler/migration/chiri-party-dns-before.json` in the GetMyInvite workspace.

Wrangler's initial Pages project creation required `--force` to bypass new Workers delegation. The project now exists; do not use that flag for normal deployments. For future Git automation, build `out/` with the same public variables and use `npx wrangler pages deploy out --project-name chiri-party --branch main`.

### Verify before changing DNS

On previews, verify that existing data is readable, photos load, and no schema is being recreated. With disposable staging records, test login, invitation editing/publishing, RSVP, R2 upload and premium verification. For chiri-party, test two browsers joining the same room, realtime events, audio/voice chat and `/stats`.

Both domains currently use GoDaddy nameservers. The `getmyinvite.in` zone has not been added to the connected Cloudflare account. For GetMyInvite, export the complete GoDaddy DNS zone, add it to Cloudflare and verify every imported record, including mail and verification records. Only after the app and existing data are verified, switch that domain's nameservers to the assigned Cloudflare pair and attach `getmyinvite.in` (with its existing `www` behavior) to the Worker. Replace only conflicting Vercel records for these hosts. Chiri-party needs only the CNAME edit described above. Keep invitation slugs and URLs unchanged and verify TLS, Google login and payment webhooks on the final domains.

Do not delete old hosting or storage after switching. Compare database counts and photo availability again. Retain the old DNS values and exports for recovery; Vercel suspension may prevent an immediate rollback. Re-enable expiry cleanup only after backups and preservation rules are confirmed, using a separate authenticated scheduler or a reviewed scheduled Worker. It must send `Authorization: Bearer <CRON_SECRET>` to `/api/cron/cleanup-drafts`; do not expose the secret in a URL.

References: [Cloudflare OpenNext hosting](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/), [request-scoped PostgreSQL clients](https://opennext.js.org/cloudflare/howtos/db), [build and runtime variables](https://opennext.js.org/cloudflare/howtos/env-vars).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## R2 upload storage limit

App uploads reserve space against a 9,000,000,000-byte budget, leaving a buffer below 10 GB. Existing bucket objects are counted when the budget is first created. Reservations use conditional R2 writes so concurrent uploads cannot spend the same remaining space. Upload URLs expire after 15 minutes and sign the declared file size.

The counter is stored at `_system/upload-budget.json`. Do not delete or edit this object while uploads are enabled. New reservations record their object key and retain a one-hour safety margin beyond URL expiry. Daily reconciliation uses the real bucket size and preserves still-valid or unconfirmed reservations. Confirmed completed/deleted uploads release their reservations after the safety margin. Failed uploads that were never observed in storage remain reserved conservatively. Do not reset the counter monthly: stored files remain between months.

Older counters are supported. Their first reconciliation waits until previously issued URLs have had a one-hour grace period. Concurrent uploads invalidate a reconciliation's conditional write and force it to retry against the updated counter.

This protects uploads issued by this app, not dashboard uploads, other API clients, other buckets, or Cloudflare operation charges. Keep the bucket credentials scoped to this bucket and monitor account-wide usage. After first deploying this limit, previously issued upload URLs can remain valid for up to one hour.

## Daily invitation cleanup

On the old Vercel deployment, `vercel.json` schedules `/api/cron/cleanup-drafts` daily at 22:00 UTC (approximately 03:30 IST the following morning). Cloudflare does not run this schedule. Leave cleanup disabled during the hosting recovery described above.

Before deploying, add a strong random `CRON_SECRET` in the Vercel project's **Production** environment. Vercel automatically supplies it as `Authorization: Bearer <CRON_SECRET>`. Missing configuration disables the endpoint; requests without the correct header are rejected. Secrets in URL query parameters are not accepted. Keep the secret out of Git and chat.

The job deletes drafts more than seven days after creation. Published invitations are eligible only when the latest date across the main wedding and all events is more than seven calendar days past (UTC dates). Invalid or missing dates preserve the published invitation for manual review. Opening the dashboard no longer triggers deletion.

Before deletion, the job locks and rechecks each invitation so rescheduled events are preserved. It deletes referenced uploaded photos, associated asset records, invitation content and RSVPs, while preserving photos referenced by other invitations. User accounts remain. A storage failure retains the invitation for retry and does not prevent other eligible invitations from being processed; some photos may already have been deleted before a later failure. Replaced/unreferenced uploads are not automatically swept.

R2 reconciliation runs before and after deletion. It accounts for uploads still in progress and restores available budget as confirmed files are removed. Inspect Vercel's function logs for the `Daily invitation cleanup` summary, including deletion failures and any unprocessed backlog. Jobs stop starting more invitations after three minutes to stay within the function time limit; failures and backlog are retried on a later run.

## Premium keepsake (₹99 per invitation)

The Publish step and each dashboard card offer a one-time ₹99 upgrade. Only a server-verified, captured INR 9,900-paise payment protects that specific invitation, its referenced photos and RSVPs from automatic expiry. Free publishing remains available. Premium does not prevent the owner from explicitly deleting the invitation; deleted invitations cannot be restored by a later payment callback. Payment audit rows survive invitation deletion. Refunds/disputes require manual review; they do not automatically revoke preservation.

Checkout is disabled by default and displays **Premium coming soon**. Existing invitations require no data conversion. Do not enable checkout until the database and Razorpay configuration are ready:

1. Keep `PREMIUM_PAYMENTS_ENABLED=false` in the existing GetMyInvite app while setup is incomplete. No separate Worker, database or bucket is required. The temporary staging resources have been removed.
2. Back up the existing database before applying `src/db/migrations/0001_invitation_payments.sql`. This adds a separate payment table and index without changing existing invitation data. Do not run `drizzle-kit push` against production for this change. The payment migration was applied to the existing database on 6 November 2026 after a verified database backup.
3. Create and activate your Razorpay merchant account, and enable automatic capture. Rotate API credentials exposed in chat. Store `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and a separate `RAZORPAY_WEBHOOK_SECRET` only in server environment variables; never use `NEXT_PUBLIC_` for secrets. Production checkout requires live keys.
4. Configure the live Razorpay webhook at `https://getmyinvite.in/api/payments/razorpay/webhook` with the matching webhook secret and events `payment.captured` and `order.paid`.
5. Run the local payment tests before release. They cover order ownership, fixed pricing, signature verification, capture checks, idempotency and cleanup protection using mocked provider responses. An actual Razorpay checkout has not been tested. Never test destructive cleanup on customer records.
6. Deploy the reviewed payment code to the existing GetMyInvite Worker with payments disabled. Enable `PREMIUM_PAYMENTS_ENABLED=true` only after the migration, live credentials and webhook are ready. Verify a controlled purchase before advertising the upgrade.

The existing integration uses server-side `fetch` and HMAC, so no extra SDK is needed. Existing routes are `POST /api/payments/premium` for order creation, `PUT /api/payments/premium` for verification, `GET /api/payments/premium?invitationId=...` for status, and `POST /api/payments/razorpay/webhook` for signed provider events. The server supplies the public Key ID to checkout only when payments are enabled.

Setting `PREMIUM_PAYMENTS_ENABLED=false` disables new purchases while retaining all existing premium protection. Keep the provider keys and webhook secret configured to verify payments already in flight. Missing payment storage while premium is enabled, or an unsuccessful provider check during expiry cleanup, preserves the affected invitation for a later retry.

Starting or resuming checkout reserves a 24-hour cleanup grace period. Older pending checkouts are checked against Razorpay before deletion; captured or authorized payments preserve the invitation. Opening checkout reuses the saved order to reduce duplicate purchases and refreshes the grace period under the same invitation lock as cleanup. The checkout UI has a 15-minute timeout; monitor delayed payments and webhook failures. Keep database/photo backups and handle exceptional late payments or deleted invitations through support. Unreferenced/replaced uploads still follow the existing storage behavior; premium is not a backup service.

Implementation follows Razorpay's [Standard Checkout integration](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/), [webhook signature validation](https://razorpay.com/docs/webhooks/validate-test/) and [server payment lookup](https://razorpay.com/docs/api/payments/fetch-with-id/). No live payment or production migration is performed by the local test suite.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

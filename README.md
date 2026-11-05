This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

`vercel.json` schedules `/api/cron/cleanup-drafts` daily at 22:00 UTC (approximately 03:30 IST the following morning). Hobby cron timing is approximate. The schedule becomes active after a production deployment.

Before deploying, add a strong random `CRON_SECRET` in the Vercel project's **Production** environment. Vercel automatically supplies it as `Authorization: Bearer <CRON_SECRET>`. Missing configuration disables the endpoint; requests without the correct header are rejected. Secrets in URL query parameters are not accepted. Keep the secret out of Git and chat.

The job deletes drafts more than seven days after creation. Published invitations are eligible only when the latest date across the main wedding and all events is more than seven calendar days past (UTC dates). Invalid or missing dates preserve the published invitation for manual review. Opening the dashboard no longer triggers deletion.

Before deletion, the job locks and rechecks each invitation so rescheduled events are preserved. It deletes referenced uploaded photos, associated asset records, invitation content and RSVPs, while preserving photos referenced by other invitations. User accounts remain. A storage failure retains the invitation for retry and does not prevent other eligible invitations from being processed; some photos may already have been deleted before a later failure. Replaced/unreferenced uploads are not automatically swept.

R2 reconciliation runs before and after deletion. It accounts for uploads still in progress and restores available budget as confirmed files are removed. Inspect Vercel's function logs for the `Daily invitation cleanup` summary, including deletion failures and any unprocessed backlog. Jobs stop starting more invitations after three minutes to stay within the function time limit; failures and backlog are retried on a later run.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

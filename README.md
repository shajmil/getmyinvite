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

The counter is stored at `_system/upload-budget.json`. Do not delete or edit this object while uploads are enabled. Reservations are deliberately not released for failed uploads or deleted photos; this can stop uploads before actual storage reaches 9 GB. Reclaiming reservations requires a maintenance reconciliation after all outstanding upload URLs have expired. Do not reset the counter monthly: stored files remain between months.

This protects uploads issued by this app, not dashboard uploads, other API clients, other buckets, or Cloudflare operation charges. Keep the bucket credentials scoped to this bucket and monitor account-wide usage. After first deploying this limit, previously issued upload URLs can remain valid for up to one hour.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

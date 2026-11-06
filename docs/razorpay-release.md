# Razorpay release - 6 November 2026

Deployed the existing GetMyInvite app to its existing Cloudflare Worker. No separate staging resources remain.

- Payment migration applied after a verified PostgreSQL custom-format backup. Existing invitation count was unchanged.
- 113 tests passed, TypeScript passed, and the OpenNext production build completed. A decorative font download warning was non-fatal.
- Scanned 161 public assets against locally available server secret values; no matches. Remote Razorpay secret values were not read.
- Deployed code version: 73349e15-303b-4e94-ada1-dcfe2b3f8e56.
- Set PREMIUM_PAYMENTS_ENABLED=true through Wrangler after deployment. Active version after this configuration update: da9be904-4d91-466e-a607-360f72d6da5e.
- Confirmed all four payment binding names exist. Secret values and Razorpay dashboard configuration were not independently inspected.
- Hosted checks: homepage and sign-in return 200; unauthenticated order/verification calls return 401; unsigned webhook returns 400. Homepage remains 200 after enablement.

Pending: owner performs a controlled live INR 99 purchase and verifies captured status in Razorpay, successful webhook delivery, and the premium badge after reload. No real payment, authenticated checkout availability or provider credential validity was tested by this release. Production checkout rejects test keys. Do not retry a payment before checking its status.

Rollback new purchases with PREMIUM_PAYMENTS_ENABLED=false; retain keys and webhook configuration for payments already in flight. Do not drop the payment table or remove paid records.

## Compact premium card

Simplified the dashboard and Publish card to a short title, description and single INR 99 action. Free-plan expiry details are expandable. Replaced the misleading coming-soon fallback with an availability retry. Mobile preview at 375px had no overflow; disclosure interaction passed. All 113 tests, TypeScript, targeted lint and production build passed. A temporary synthetic account confirmed authenticated payment availability is true, then the account and draft were removed without placing an order. UI deployment version: 65615514-8f76-4076-9fa9-9883963b382a. Actual live purchase remains pending.

The premium action now renders immediately while the initial paid-status request runs in the background. Initial page loading no longer disables the action or displays an availability spinner. The backend still enforces checkout availability and existing premium ownership when the user clicks. Browser verification held the status request pending and confirmed the action remained enabled; a simulated 503 checkout response showed an error and restored retry. Targeted lint and TypeScript passed.

## Dashboard deployment mismatch

A signed-in browser reproduced a chunk-load failure: the dashboard HTML referenced page-39df733cbeb5c26c.js while the active asset manifest contained page-c4ae36dc6e95760e.js. Cloudflare began deferring active Durable Object code updates by default on 30 October 2026, allowing the application server and static assets to run different releases during the delay. Forced the current version to apply immediately and configured durable_objects.code_update_strategy.mode=immediate for future deployments. No new namespace, database migration, customer data deletion or payment was required. See https://developers.cloudflare.com/changelog/post/2026-10-30-durable-objects-deferred-code-updates/.

After the fix, the same signed-in browser check returned HTTP 200 with no page errors, no global error screen and one visible INR 99 checkout action. The disposable account and draft were removed. No payment or order was created. Deployed version: 9777d2e0-6fda-4c16-be30-7dbfbd0552da. Existing tabs that already failed may need one reload.

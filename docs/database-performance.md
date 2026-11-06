# Database connection performance - 6 November 2026

Repeated PostgreSQL TCP connection setup was adding latency to authentication, dashboard queries and invitation actions. The existing node-postgres pool uses maxUses=1 for Worker request isolation. This made every ordinary query establish a new database connection. A local read-only test measured 3794, 3873, 3730, 3564 ms per SELECT 1 over that transport. Neon HTTP reads measured 2803, 2196, 347, 409 ms, including initial connection/cold-request overhead.

## Change

For Neon hosts only, getDb now uses the already-installed Neon serverless Pool and Drizzle Neon adapter with poolQueryViaFetch=true. Ordinary queries use HTTPS; interactive transactions use a request-scoped WebSocket connection. maxUses=1 remains in place to prevent transaction connections being reused across Worker requests. Local/non-Neon PostgreSQL keeps the existing driver. No new dependency, database, migration, credentials or provider service was added.

Driver behavior follows the installed 1.1.0 configuration and [Neon driver documentation](https://github.com/neondatabase/serverless/blob/main/CONFIG.md).

## Hosted browser measurements

| Flow | Before | After | Reduction |
| --- | --- | --- | --- |
| Dashboard | 7.58s | 2.13s | 72% |
| Create and open editor | 14.75s | 4.04s | 73% |
| Reopen editor | 6.59s | 1.26s | 81% |

Single sequential browser runs against https://getmyinvite.in using separate disposable accounts, not a load test or a latency guarantee. Create timing includes the server action and navigation into the editor. Both runs reported no page errors. Test accounts, sessions and their invitations were removed afterward; no orders or payments were created.

## Verification

113 tests, TypeScript, targeted ESLint and the OpenNext build passed. A real database transaction committed a synthetic record; a subsequent SELECT FOR UPDATE plus update deliberately threw and rolled back, and a separate HTTP read confirmed the original value remained. The synthetic record was deleted afterward. No customer records were modified.

Deployed version: 892801eb-fc67-4688-9fd4-0fee6c026254. Authentication, actual invitation creation and editor navigation passed in the hosted after-test. The existing immediate Durable Object update strategy remains configured.

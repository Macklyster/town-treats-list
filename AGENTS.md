
- Duty (plantão) concurrency limits are enforced only inside the `duty_schedule_create` RPC with an advisory lock; clients never insert schedules directly, so the per-category/city limit cannot be bypassed.
- Admin-managed offers, coupons, and media reuse merchant screens via /admin/loja/:storeId/* and useManagedStore; ManagedStoreRoute waits for the store and blocks missing or inactive-service stores before mounting children, preventing loads or writes for the wrong store.
- Admin section navigation uses one grouped item list for wrapped desktop tabs and a compact mobile selector, with the active section in the URL so both controls and direct links stay synchronized.

- Authentication emails use the managed scaffold and callback-based auth-email-hook; do not add database email queues because managed delivery owns sending and tracking.
- Storage SELECT policies permit file enumeration only for authenticated owners or admins; public image URLs remain usable because displaying catalog images must not require listing a bucket.
- Public offer-media reads follow offer approval, validity, and scheduling; public loyalty-tier reads require an approved store with an active program, while existing owner/admin policies preserve editing access.
- Categories and badge definitions are intentionally public catalogs, not private customer records; keep their public read policies for browsing and FlyPontos descriptions.
- PageHero uses titleAsChild for route-owned H1 elements, preserving shared heading styles without rendering nested or duplicate main headings.
- Share previews per city, store, offer and event come from route `loader` + `head()` via `src/lib/route-seo.ts`; crawlers read server-rendered tags, so never move page metadata back to client-only effects.
- Pages keep react-router call conventions through `src/lib/router-compat.tsx` (its Navigate redirects once per mount to avoid redirect loops); import routing hooks from there, not `react-router-dom`.
- Former internal edge functions run as app server code in `src/server/handlers` behind `runBackendFunction`/`invokeBackend`; cron, webhook and Deno-only functions stay as backend functions.
- Browser storage (saved city, location) is read in effects after mount, never in initial state, so server HTML and the first client render match.
- `exactOptionalPropertyTypes` stays off because the generated Lovable auth integration does not compile under it; all other strict flags stay on.
- Offer notification emails are sent by a DB trigger on `offers` that posts to `/api/public/hooks/offer-email` on the stable production URL, authenticated by a secret kept in the service-role-only `internal_hook_secrets` table; `offer_email_notices` dedupes so each offer emails at most once per kind.
- Admin marketing sharing uses a single complete payload for clipboard and the direct WhatsApp send URL; start clipboard copying during the click without delaying navigation to preserve browser user activation.
- Admin marketing offer queries use marketing-offer-filters for validity and store filters; keep query errors distinct from empty results so failed reads cannot masquerade as missing ads.

- Local event agendas use an un-nested city route and a shared public Query cache; the URL city always wins over saved device location so Google and visitors see the same city.
- Public local SEO reads run through loadLocalSeo with a sessionless publishable client and explicit public projections; event/business JSON-LD belongs in route head only to prevent hydration duplicates.
- The public events sitemap derives cities from approved stores and visible events and omits lastmod without an authoritative page timestamp.
- AI assist access (admin, Destaque/Plus, or ai_assist add-on) is enforced server-side by `checkAiAccess` + `store_has_ai_assist`; `useAiAssist` is only a UI hint, so locked UI can never be the security boundary.

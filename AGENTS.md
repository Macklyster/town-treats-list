
- Duty (plantão) concurrency limits are enforced only inside the `duty_schedule_create` RPC with an advisory lock; clients never insert schedules directly, so the per-category/city limit cannot be bypassed.
- Admin-managed offers, coupons, and media reuse merchant screens via /admin/loja/:storeId/* and useManagedStore; ManagedStoreRoute waits for the store and blocks missing or inactive-service stores before mounting children, preventing loads or writes for the wrong store.
- Admin section navigation uses one grouped item list for wrapped desktop tabs and a compact mobile selector, with the active section in the URL so both controls and direct links stay synchronized.

- Authentication emails use the managed scaffold and callback-based auth-email-hook; do not add database email queues because managed delivery owns sending and tracking.
- Storage SELECT policies permit file enumeration only for authenticated owners or admins; public image URLs remain usable because displaying catalog images must not require listing a bucket.
- Public offer-media reads follow offer approval, validity, and scheduling; public loyalty-tier reads require an approved store with an active program, while existing owner/admin policies preserve editing access.
- Categories and badge definitions are intentionally public catalogs, not private customer records; keep their public read policies for browsing and FlyPontos descriptions.
- PageHero uses titleAsChild for route-owned H1 elements, preserving shared heading styles without rendering nested or duplicate main headings.


- Duty (plantão) concurrency limits are enforced only inside the `duty_schedule_create` RPC with an advisory lock; clients never insert schedules directly, so the per-category/city limit cannot be bypassed.
- Admin-managed offers, coupons, and media reuse merchant screens via /admin/loja/:storeId/* and useManagedStore; ManagedStoreRoute waits for the store and blocks missing or inactive-service stores before mounting children, preventing loads or writes for the wrong store.
- Admin section navigation uses one grouped item list for wrapped desktop tabs and a compact mobile selector, with the active section in the URL so both controls and direct links stay synchronized.

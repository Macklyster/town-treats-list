
- Duty (plantão) concurrency limits are enforced only inside the `duty_schedule_create` RPC with an advisory lock; clients never insert schedules directly, so the per-category/city limit cannot be bypassed.
- Admin-managed offers, coupons, and media reuse merchant screens via /admin/loja/:storeId/* and useManagedStore; ManagedStoreRoute waits for the store and blocks missing or inactive-service stores before mounting children, preventing loads or writes for the wrong store.

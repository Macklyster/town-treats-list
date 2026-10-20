
- Duty (plantão) concurrency limits are enforced only inside the `duty_schedule_create` RPC with an advisory lock; clients never insert schedules directly, so the per-category/city limit cannot be bypassed.
- Admin-managed offers reuse the merchant forms via /admin/loja/:storeId/* routes (useManagedStore resolves the store from the URL); admin INSERT is allowed only for stores with managed_offers=true so the service flag gates access.

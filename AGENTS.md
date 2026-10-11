
- Duty (plantão) concurrency limits are enforced only inside the `duty_schedule_create` RPC with an advisory lock; clients never insert schedules directly, so the per-category/city limit cannot be bypassed.

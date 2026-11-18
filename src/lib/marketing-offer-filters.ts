type OfferFilterQuery<T> = {
  eq: (column: string, value: string) => T;
  or: (filters: string) => T;
  ilike: (column: string, value: string) => T;
};

export function applyMarketingOfferFilters<T extends OfferFilterQuery<T>>(
  query: T,
  filters: { storeId: string; city: string; type: string; title: string },
  now = new Date(),
): T {
  const timestamp = now.toISOString();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
  let result = query.eq("status", "approved")
    .or(`valid_until.is.null,valid_until.gte.${today}`)
    .or(`is_flash.eq.false,flash_ends_at.is.null,flash_ends_at.gt.${timestamp}`)
    .or(`is_scheduled.eq.false,and(scheduled_start_at.lte.${timestamp},scheduled_end_at.gt.${timestamp})`);
  if (filters.storeId) result = result.eq("store_id", filters.storeId);
  if (filters.city) result = result.eq("store.city", filters.city);
  if (filters.type) result = result.eq("type", filters.type);
  if (filters.title) result = result.ilike("title", `%${filters.title.replace(/[%_]/g, "")}%`);
  return result;
}
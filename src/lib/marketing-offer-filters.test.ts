import { describe, expect, it } from "vitest";
import { applyMarketingOfferFilters } from "./marketing-offer-filters";

function recordedQuery() {
  const calls: unknown[][] = [];
  const query = {
    eq(column: string, value: string) { calls.push(["eq", column, value]); return query; },
    or(filters: string) { calls.push(["or", filters]); return query; },
    ilike(column: string, value: string) { calls.push(["ilike", column, value]); return query; },
  };
  return { query, calls };
}
const empty = { storeId: "", city: "", type: "", title: "" };

describe("marketing offer filters", () => {
  it("selects Corpo em Equilíbrio by its store ID", () => {
    const { query, calls } = recordedQuery();
    applyMarketingOfferFilters(query, { ...empty, storeId: "f58af064-d435-428c-ada2-50dcb2773578" });
    expect(calls).toContainEqual(["eq", "store_id", "f58af064-d435-428c-ada2-50dcb2773578"]);
  });
  it("uses valid_until at the end of the selected date in Brasília, including undated offers", () => {
    const { query, calls } = recordedQuery();
    applyMarketingOfferFilters(query, empty, new Date("2026-11-18T02:59:00Z"));
    expect(calls).toContainEqual(["or", "valid_until.is.null,valid_until.gte.2026-11-17"]);
    const next = recordedQuery();
    applyMarketingOfferFilters(next.query, empty, new Date("2026-11-18T03:00:00Z"));
    expect(next.calls).toContainEqual(["or", "valid_until.is.null,valid_until.gte.2026-11-18"]);
  });
  it("filters cities using the joined store alias", () => {
    const { query, calls } = recordedQuery();
    applyMarketingOfferFilters(query, { ...empty, city: "Douradina" });
    expect(calls).toContainEqual(["eq", "store.city", "Douradina"]);
  });
});
import { describe, expect, it } from "vitest";
import { checkAiAccess } from "./ai";

function mock(opts: { admin: boolean; owner: string; hasAi: boolean }) {
  return {
    rpc: async (fn: string) => ({ data: fn === "has_role" ? opts.admin : opts.hasAi }),
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { owner_id: opts.owner } }) }) }) }),
  };
}

describe("AI assist access", () => {
  it("admin is always allowed, even without a store", async () => {
    expect((await checkAiAccess(mock({ admin: true, owner: "x", hasAi: false }), "u1", null)).ok).toBe(true);
  });
  it("owner of a store with Destaque/Plus or the add-on is allowed", async () => {
    expect((await checkAiAccess(mock({ admin: false, owner: "u1", hasAi: true }), "u1", "s1")).ok).toBe(true);
  });
  it("owner without the plan or add-on is asked to upgrade", async () => {
    const r = await checkAiAccess(mock({ admin: false, owner: "u1", hasAi: false }), "u1", "s1");
    expect(r).toEqual({ ok: false, status: 403, error: "ai_upgrade_required" });
  });
  it("non-owner is rejected", async () => {
    const r = await checkAiAccess(mock({ admin: false, owner: "other", hasAi: true }), "u1", "s1");
    expect(r.ok).toBe(false);
  });
});

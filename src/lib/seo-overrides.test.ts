import { describe, it, expect } from "vitest";
import { applySeoOverride, pickOverride } from "./seo-overrides";

const base = { title: "Auto", description: "Auto desc", image: "a.jpg" };
const empty = { title: null, description: "  ", keywords: [], image_url: null };

describe("seo overrides", () => {
  it("empty override keeps automatic text", () => {
    expect(applySeoOverride(base, empty)).toEqual(base);
  });
  it("filled override replaces title and description", () => {
    const r = applySeoOverride(base, { ...empty, title: "Novo", description: "Nova desc" });
    expect(r.title).toBe("Novo");
    expect(r.description).toBe("Nova desc");
  });
  it("replaces {cidade}", () => {
    expect(applySeoOverride(base, { ...empty, title: "Alimentação em {cidade}" }, "Douradina/PR").title).toBe("Alimentação em Douradina/PR");
  });
  it("city-specific wins over general", () => {
    const rows = [{ ...empty, city: "", title: "G" }, { ...empty, city: "Douradina", title: "C" }];
    expect(pickOverride(rows, "Douradina")?.title).toBe("C");
    expect(pickOverride(rows, "Umuarama")?.title).toBe("G");
  });
});

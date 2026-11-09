import { describe, expect, it } from "vitest";
import { buildPixPayload, crc16, normalizePixKey } from "./pix";

describe("pix", () => {
  it("crc16 matches known value", () => {
    expect(crc16("123456789")).toBe("29B1");
  });
  it("payload includes amount and valid CRC", () => {
    const p = buildPixPayload({ key: "+5544997691237", name: "Loja São João", city: "Douradina", amount: 49.9 });
    expect(p).toContain("540549.90");
    expect(p).toContain("5913LOJA SAO JOAO");
    expect(p.slice(-4)).toBe(crc16(p.slice(0, -4)));
  });
  it("normalizes phone keys and rejects invalid cpf", () => {
    expect(normalizePixKey("phone", "(44) 99769-1237")).toBe("+5544997691237");
    expect(normalizePixKey("cpf", "123")).toBeNull();
  });
});

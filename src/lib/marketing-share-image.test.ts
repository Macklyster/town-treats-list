import { describe, it, expect } from "vitest";
import { canShareImage } from "./marketing-share";
const file = new File(["x"], "a.jpg", { type: "image/jpeg" });
describe("canShareImage", () => {
  it("uses file sharing when the device supports files", () => {
    expect(canShareImage({ share: async () => {}, canShare: () => true } as any, file)).toBe(true);
  });
  it("falls back to the WhatsApp link without file support or image", () => {
    expect(canShareImage({ share: async () => {}, canShare: () => false } as any, file)).toBe(false);
    expect(canShareImage({ share: async () => {} } as any, file)).toBe(false);
    expect(canShareImage({ share: async () => {}, canShare: () => true } as any, undefined)).toBe(false);
  });
});

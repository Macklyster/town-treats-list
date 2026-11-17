import { describe, expect, it, vi, afterEach } from "vitest";
import { copyMarketingText, marketingMessage, whatsappUrl } from "./marketing-share";

const clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, "clipboard");
const execDescriptor = Object.getOwnPropertyDescriptor(document, "execCommand");
afterEach(() => {
  vi.restoreAllMocks();
  if (clipboardDescriptor) Object.defineProperty(navigator, "clipboard", clipboardDescriptor);
  else Reflect.deleteProperty(navigator, "clipboard");
  if (execDescriptor) Object.defineProperty(document, "execCommand", execDescriptor);
  else Reflect.deleteProperty(document, "execCommand");
});

describe("marketing WhatsApp sharing", () => {
  const text = "🔥 Oferta de café & pão — R$ 9,90\n🏪 Loja São José\n📸 Siga: @loja\n👍 facebook.com/loja";
  const url = "https://ofertasfly.com.br/oferta/123";

  it("passes the complete message, socials, accents and link exactly once to WhatsApp", () => {
    const destination = new URL(whatsappUrl(text, url));
    expect(destination.origin + destination.pathname).toBe("https://api.whatsapp.com/send");
    expect(destination.searchParams.get("text")).toBe(`${text}\n\n${url}`);
    expect([...destination.searchParams.keys()]).toEqual(["text"]);
  });

  it("copies the same full payload to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    await copyMarketingText(marketingMessage(text, url));
    expect(writeText).toHaveBeenCalledWith(`${text}\n\n${url}`);
  });

  it("falls back when clipboard permission is denied", async () => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) } });
    const exec = vi.fn(() => {
      expect(document.querySelector("textarea")?.value).toBe(`${text}\n\n${url}`);
      return true;
    });
    Object.defineProperty(document, "execCommand", { configurable: true, value: exec });
    await copyMarketingText(marketingMessage(text, url));
    expect(exec).toHaveBeenCalledWith("copy");
    expect(document.querySelector("textarea")).toBeNull();
  });
});
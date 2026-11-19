/** One payload for the preview, clipboard and WhatsApp, including store socials. */
export function marketingMessage(text: string, url: string): string {
  return `${text}\n\n${url}`;
}

export function whatsappUrl(text: string, url: string): string {
  // Avoid the wa.me redirect when handing the complete message to the app.
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(marketingMessage(text, url))}`;
}

export async function copyMarketingText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      // Embedded browsers can expose the API but deny clipboard permission.
    }
  }
  const previousFocus = document.activeElement;
  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.className = "fixed left-0 top-0 h-px w-px opacity-0";
  document.body.appendChild(field);
  field.select();
  field.setSelectionRange(0, value.length);
  try {
    if (!document.execCommand("copy")) throw new Error("Clipboard unavailable");
  } finally {
    field.remove();
    if (previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll: true });
  }
}
/** True when the device can share the cover image file together with the text. */
export function canShareImage(nav: Pick<Navigator, "share" | "canShare"> | undefined, file: File | undefined): boolean {
  if (!nav?.share || !nav.canShare || !file) return false;
  try { return nav.canShare({ files: [file] }); } catch { return false; }
}

export async function loadImageFile(url: string, name: string): Promise<File> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("image fetch failed");
  const blob = await res.blob();
  const ext = (blob.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
  return new File([blob], `${name}.${ext}`, { type: blob.type || "image/jpeg" });
}

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
// Chave pública VAPID — pode ser exposta no bundle por design.
// A chave privada fica somente nos secrets do backend.
export const VAPID_PUBLIC_KEY =
  "BAsLQ0LnJgehCrfOcJmav3iUWZYkhHgkh_sCq9SVQgdN_0znk2ZT6Z8aBqz0fpvJMcoOOTeD6n3FS63-l5J0HoQ";

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

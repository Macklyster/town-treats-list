// Helpers de Web Push (VAPID + envio) compartilhados.
// Implementação manual do envio (sem npm:web-push) para Deno.
import { create as createJwt } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:contato@ofertasfly.com.br";

function b64urlToUint8(b64url: string): Uint8Array {
  const pad = "=".repeat((4 - (b64url.length % 4)) % 4);
  const b64 = (b64url + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function uint8ToB64url(u8: Uint8Array): string {
  let s = "";
  for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function importVapidPrivate(): Promise<CryptoKey> {
  // VAPID private key é um inteiro de 32 bytes (b64url). Importamos como JWK.
  const d = VAPID_PRIVATE;
  const pubBytes = b64urlToUint8(VAPID_PUBLIC); // 65 bytes (uncompressed)
  if (pubBytes.length !== 65 || pubBytes[0] !== 0x04) {
    throw new Error("Invalid VAPID public key format");
  }
  const x = uint8ToB64url(pubBytes.slice(1, 33));
  const y = uint8ToB64url(pubBytes.slice(33, 65));
  return await crypto.subtle.importKey(
    "jwk",
    { kty: "EC", crv: "P-256", x, y, d, ext: true },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
}

export async function buildVapidHeaders(audience: string): Promise<Record<string, string>> {
  const key = await importVapidPrivate();
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 11; // 11h
  const jwt = await createJwt(
    { alg: "ES256", typ: "JWT" },
    { aud: audience, exp, sub: VAPID_SUBJECT },
    key,
  );
  return {
    Authorization: `vapid t=${jwt}, k=${VAPID_PUBLIC}`,
  };
}

// ----- Cifragem aes128gcm conforme RFC 8291 -----
async function hkdf(
  salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number,
): Promise<Uint8Array> {
  const baseKey = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info },
    baseKey,
    length * 8,
  );
  return new Uint8Array(bits);
}

function concat(...arrs: Uint8Array[]): Uint8Array {
  const len = arrs.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(len);
  let o = 0;
  for (const a of arrs) { out.set(a, o); o += a.length; }
  return out;
}

async function encryptAes128Gcm(
  payload: Uint8Array,
  uaPublicRaw: Uint8Array, // 65 bytes
  uaAuthSecret: Uint8Array, // 16 bytes
): Promise<Uint8Array> {
  // 1. ECDH ephemeral keypair
  const ephemeral = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  ) as CryptoKeyPair;
  const ephPubJwk = await crypto.subtle.exportKey("jwk", ephemeral.publicKey);
  const ephPubRaw = concat(
    new Uint8Array([0x04]),
    b64urlToUint8(ephPubJwk.x!),
    b64urlToUint8(ephPubJwk.y!),
  );

  // Importa public key do UA
  const uaJwk = {
    kty: "EC", crv: "P-256",
    x: uint8ToB64url(uaPublicRaw.slice(1, 33)),
    y: uint8ToB64url(uaPublicRaw.slice(33, 65)),
    ext: true,
  };
  const uaPub = await crypto.subtle.importKey(
    "jwk", uaJwk, { name: "ECDH", namedCurve: "P-256" }, true, [],
  );

  const sharedBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: uaPub }, ephemeral.privateKey, 256,
  );
  const shared = new Uint8Array(sharedBits);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();

  // PRK_key
  const keyInfo = concat(
    enc.encode("WebPush: info\0"),
    uaPublicRaw,
    ephPubRaw,
  );
  const ikm = await hkdf(uaAuthSecret, shared, keyInfo, 32);

  // CEK + Nonce
  const cek = await hkdf(salt, ikm, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, enc.encode("Content-Encoding: nonce\0"), 12);

  // padding (0x02 = last record delimiter)
  const padded = concat(payload, new Uint8Array([0x02]));
  const cryptoKey = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const cipherBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, cryptoKey, padded);
  const cipher = new Uint8Array(cipherBuf);

  // Header: salt(16) || rs(4 BE) || idlen(1) || keyid(idlen)
  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096, false);
  const idlen = new Uint8Array([ephPubRaw.length]);
  return concat(salt, rs, idlen, ephPubRaw, cipher);
}

export interface PushSub {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  image?: string;
  tag?: string;
}

export interface SendResult {
  endpoint: string;
  status: number;
  ok: boolean;
  remove: boolean;
}

export async function sendPush(sub: PushSub, payload: PushPayload): Promise<SendResult> {
  try {
    const url = new URL(sub.endpoint);
    const audience = `${url.protocol}//${url.host}`;
    const vapidHeaders = await buildVapidHeaders(audience);
    const ua = b64urlToUint8(sub.p256dh);
    const auth = b64urlToUint8(sub.auth);
    const enc = new TextEncoder();
    const body = await encryptAes128Gcm(enc.encode(JSON.stringify(payload)), ua, auth);

    const res = await fetch(sub.endpoint, {
      method: "POST",
      headers: {
        ...vapidHeaders,
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "aes128gcm",
        "TTL": "86400",
        "Urgency": "normal",
      },
      body,
    });
    if (res.status < 200 || res.status >= 300) {
      let detail = "";
      try { detail = (await res.text()).slice(0, 400); } catch (_) { /* ignore */ }
      console.error("push rejected", res.status, sub.endpoint.slice(0, 60), detail);
    } else {
      console.log("push accepted", res.status, sub.endpoint.slice(0, 60));
    }
    return {
      endpoint: sub.endpoint,
      status: res.status,
      ok: res.status >= 200 && res.status < 300,
      remove: res.status === 404 || res.status === 410,
    };

  } catch (e) {
    console.error("sendPush error", sub.endpoint, e);
    return { endpoint: sub.endpoint, status: 0, ok: false, remove: false };
  }
}

export async function sendPushBatch(
  subs: PushSub[], payload: PushPayload,
): Promise<SendResult[]> {
  const results: SendResult[] = [];
  // 20 em paralelo
  const chunkSize = 20;
  for (let i = 0; i < subs.length; i += chunkSize) {
    const slice = subs.slice(i, i + chunkSize);
    const res = await Promise.all(slice.map((s) => sendPush(s, payload)));
    results.push(...res);
  }
  return results;
}

import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

/**
 * Former backend functions now served by this app. Each call rebuilds the original
 * request (caller's access token, origin, JSON body) and runs the ported handler,
 * returning its status and JSON so callers keep their existing error handling.
 */
const HANDLERS = {
  "admin-manage-user": () => import("@/server/handlers/admin-manage-user"),
  "create-checkout": () => import("@/server/handlers/create-checkout"),
  "change-subscription-plan": () => import("@/server/handlers/change-subscription-plan"),
  "customer-portal": () => import("@/server/handlers/customer-portal"),
  "reactivate-subscription": () => import("@/server/handlers/reactivate-subscription"),
  "subscribe-push": () => import("@/server/handlers/subscribe-push"),
  "unsubscribe-push": () => import("@/server/handlers/unsubscribe-push"),
  "suggest-offer": () => import("@/server/handlers/suggest-offer"),
  "suggest-seo": () => import("@/server/handlers/suggest-seo"),
} as const;

export type BackendFunctionName = keyof typeof HANDLERS;

type Input = { name: BackendFunctionName; body: unknown; accessToken: string | null };

const isName = (v: unknown): v is BackendFunctionName =>
  typeof v === "string" && Object.prototype.hasOwnProperty.call(HANDLERS, v);

export const runBackendFunction = createServerFn({ method: "POST" })
  .inputValidator((input: Input): Input => {
    if (!input || !isName(input.name)) throw new Error("Unknown backend function");
    const token = typeof input.accessToken === "string" ? input.accessToken : null;
    return { name: input.name, body: input.body ?? {}, accessToken: token };
  })
  .handler(async ({ data }) => {
    const mod = await HANDLERS[data.name]();
    const headers = new Headers({ "Content-Type": "application/json" });
    if (data.accessToken) headers.set("Authorization", `Bearer ${data.accessToken}`);
    const origin = getRequestHeader("origin");
    if (origin) headers.set("origin", origin);
    const ua = getRequestHeader("user-agent");
    if (ua) headers.set("user-agent", ua);
    const res = await mod.handler(
      new Request("https://internal.local/" + data.name, {
        method: "POST",
        headers,
        body: JSON.stringify(data.body ?? {}),
      }),
    );
    const text = await res.text();
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { error: text };
    }
    // Serialized as text so arbitrary handler JSON crosses the server-function boundary.
    return { status: res.status, bodyText: json === null ? "" : JSON.stringify(json) };
  });

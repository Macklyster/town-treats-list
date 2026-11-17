import { supabase } from "@/integrations/supabase/client";
import { runBackendFunction, type BackendFunctionName } from "@/lib/backend.functions";

export class BackendFunctionError extends Error {
  context: { status: number; json: () => Promise<unknown>; text: () => Promise<string> };
  constructor(status: number, body: unknown) {
    const msg =
      body && typeof body === "object" && "error" in body ? String((body as { error: unknown }).error) : `HTTP ${status}`;
    super(msg);
    this.name = "BackendFunctionError";
    this.context = {
      status,
      json: async () => body,
      text: async () => JSON.stringify(body ?? null),
    };
  }
}

/** Drop-in for supabase.functions.invoke for functions that now run in this app. */
export async function invokeBackend<T = any>(
  name: BackendFunctionName,
  options: { body?: unknown } = {},
): Promise<{ data: T | null; error: BackendFunctionError | null }> {
  try {
    const { data: session } = await supabase.auth.getSession();
    const raw = await runBackendFunction({
      data: { name, body: options.body ?? {}, accessToken: session.session?.access_token ?? null },
    });
    let body: unknown = null;
    try {
      body = raw.bodyText ? JSON.parse(raw.bodyText) : null;
    } catch {
      body = { error: raw.bodyText };
    }
    const res = { status: raw.status, body };
    if (res.status >= 400) return { data: (res.body as T) ?? null, error: new BackendFunctionError(res.status, res.body) };
    return { data: (res.body as T) ?? null, error: null };
  } catch (e) {
    return { data: null, error: new BackendFunctionError(500, { error: e instanceof Error ? e.message : String(e) }) };
  }
}

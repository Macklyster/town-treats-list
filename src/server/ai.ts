import { env } from "./env";

export class AiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

/** Streams a strict-JSON response from the Lovable AI Gateway (Responses API) and returns the parsed object. */
export async function generateJson<T>(opts: {
  instructions: string;
  input: string;
  schemaName: string;
  schema: Record<string, unknown>;
}): Promise<T> {
  const key = env("LOVABLE_API_KEY");
  if (!key) throw new AiError(500, "Assistente de IA não configurado.");
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      instructions: opts.instructions,
      input: opts.input,
      reasoning: { effort: "low" },
      store: false,
      stream: true,
      text: { format: { type: "json_schema", name: opts.schemaName, strict: true, schema: opts.schema } },
    }),
  });
  if (!resp.ok || !resp.body) {
    const t = await resp.text().catch(() => "");
    console.error("AI gateway error", resp.status, t);
    let msg = "Falha ao gerar sugestão.";
    try { msg = JSON.parse(t)?.error?.message ?? JSON.parse(t)?.message ?? msg; } catch { /* keep */ }
    if (resp.status === 429) msg = "Muitas solicitações. Tente novamente em instantes.";
    if (resp.status === 402) msg = "Créditos de IA esgotados.";
    throw new AiError(resp.status, msg);
  }
  const reader = resp.body.getReader();
  const dec = new TextDecoder();
  let buf = "", text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const ev = JSON.parse(payload);
        if (ev.type === "response.output_text.delta") text += ev.delta ?? "";
        else if (ev.type === "response.refusal.delta" || ev.type === "response.failed" || ev.type === "error") {
          throw new AiError(422, "A IA não pôde gerar esta sugestão.");
        }
      } catch (e) { if (e instanceof AiError) throw e; }
    }
  }
  if (!text) throw new AiError(502, "A IA não retornou sugestão.");
  return JSON.parse(text) as T;
}

/** Admins always; store owners only when the store has the AI plan or add-on. */
export async function checkAiAccess(supabase: any, userId: string, storeId: string | null): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (isAdmin) return { ok: true };
  if (!storeId) return { ok: false, status: 403, error: "Assistente de IA disponível apenas para lojistas." };
  const { data: store } = await supabase.from("stores").select("owner_id").eq("id", storeId).maybeSingle();
  if (!store || store.owner_id !== userId) return { ok: false, status: 403, error: "Loja inválida." };
  const { data: has } = await supabase.rpc("store_has_ai_assist", { p_store_id: storeId });
  if (!has) return { ok: false, status: 403, error: "ai_upgrade_required" };
  return { ok: true };
}

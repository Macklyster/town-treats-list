import { env } from "../env";
import { createClient } from "@supabase/supabase-js";
import { AiError, generateJson } from "../ai";

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });

export const handler = async (req: Request): Promise<Response> => {
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const supabase = createClient(env("SUPABASE_URL")!, env("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
      auth: { persistSession: false },
    });
    const { data: u } = await supabase.auth.getUser(auth.slice(7));
    if (!u?.user) return json({ error: "Unauthorized" }, 401);
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Apenas administradores." }, 403);

    const body = await req.json();
    const type = String(body.entity_type ?? "");
    const key = String(body.entity_key ?? "").slice(0, 200);
    const city = String(body.city ?? "").slice(0, 80).trim();
    if (!["store", "category", "offer", "event"].includes(type) || !key) return json({ error: "Dados inválidos" }, 400);

    let context = "";
    if (type === "store") {
      const { data: s } = await supabase.from("stores").select("id,name,description,city,state").eq("slug", key).maybeSingle();
      if (!s) return json({ error: "Loja não encontrada" }, 404);
      const { data: offers } = await supabase.from("offers").select("title,category_slug").eq("store_id", s.id).eq("status", "approved").limit(8);
      context = `Loja: ${s.name} em ${s.city}/${s.state}\nDescrição: ${s.description ?? "-"}\nOfertas: ${(offers ?? []).map((o) => o.title).join("; ") || "-"}`;
    } else if (type === "category") {
      const { data: c } = await supabase.from("categories").select("name").eq("slug", key).maybeSingle();
      context = `Página de categoria: ${c?.name ?? key}. ${city ? `Cidade: ${city}.` : "Vale para todas as cidades: use o marcador {cidade} onde o nome da cidade deve entrar."}`;
    } else if (type === "offer") {
      const { data: o } = await supabase.from("offers").select("title,description,original_price,promo_price,store:stores(name,city,state)").eq("id", key).maybeSingle();
      if (!o) return json({ error: "Anúncio não encontrado" }, 404);
      const st: any = o.store;
      context = `Anúncio: ${o.title}\nDescrição: ${o.description ?? "-"}\nPreço: de R$ ${o.original_price} por R$ ${o.promo_price}\nLoja: ${st?.name ?? ""} em ${st?.city ?? ""}/${st?.state ?? ""}`;
    } else {
      const { data: e } = await supabase.from("events").select("title,description,city,state,venue,starts_at").eq("slug", key).maybeSingle();
      if (!e) return json({ error: "Evento não encontrado" }, 404);
      context = `Evento: ${e.title}\nDescrição: ${e.description ?? "-"}\nLocal: ${e.venue ?? ""}, ${e.city}/${e.state}\nData: ${e.starts_at}`;
    }

    const s = await generateJson<{ title: string; description: string; keywords: string[] }>({
      schemaName: "suggest_seo",
      instructions: `Você é especialista em SEO local no Brasil para o portal OfertasFly (ofertas, promoções e eventos locais).
Gere em pt-BR: título para o Google com no máximo 60 caracteres, terminando em "| OfertasFly" se couber; descrição de 120 a 160 caracteres com chamada para ação; e 4 a 6 palavras-chave de busca local reais (ex.: "farmácia em Douradina").
As palavras-chave mais importantes devem aparecer no título ou na descrição. Não invente fatos.`,
      input: context,
      schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          keywords: { type: "array", items: { type: "string" } },
        },
        required: ["title", "description", "keywords"],
        additionalProperties: false,
      },
    });
    return json({
      title: String(s.title ?? "").slice(0, 70),
      description: String(s.description ?? "").slice(0, 170),
      keywords: (s.keywords ?? []).map(String).slice(0, 8),
    });
  } catch (e) {
    console.error("suggest-seo error:", e);
    if (e instanceof AiError) return json({ error: e.message }, e.status);
    return json({ error: "Falha ao gerar sugestão" }, 500);
  }
};

import { env } from "../env";
import { createClient } from "@supabase/supabase-js";
import { AiError, checkAiAccess, generateJson } from "../ai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

export const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      env("SUPABASE_URL")!,
      env("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const category_slug = String(body.category_slug ?? "").trim();
    const original_price = Number(body.original_price ?? 0);
    const image_url = body.image_url ? String(body.image_url).slice(0, 500) : null;
    const current_title = body.current_title ? String(body.current_title).slice(0, 200) : null;
    const store_name = body.store_name ? String(body.store_name).slice(0, 120) : null;
    const store_id = body.store_id ? String(body.store_id) : null;
    const offer_type = ["offer", "coletiva", "leilao", "invisivel"].includes(body.offer_type) ? body.offer_type : "offer";

    const access = await checkAiAccess(supabase, userData.user.id, store_id);
    if (!access.ok) return json({ error: access.error }, access.status);

    if (!category_slug || !(original_price > 0)) {
      return json({ error: "category_slug e original_price são obrigatórios" }, 400);
    }

    const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const { data: topOffers } = await supabase
      .from("offers")
      .select("id, title, description, original_price, promo_price")
      .eq("status", "approved")
      .eq("category_slug", category_slug)
      .order("popularity", { ascending: false })
      .limit(20);

    const ids = (topOffers ?? []).map((o) => o.id);
    let scored: any[] = topOffers ?? [];
    if (ids.length > 0) {
      const { data: events } = await supabase
        .from("offer_events")
        .select("offer_id, event_type")
        .in("offer_id", ids)
        .gte("created_at", since);
      const counts = new Map<string, number>();
      (events ?? []).forEach((e: any) => {
        const w = e.event_type === "whatsapp_click" || e.event_type === "phone_click" ? 3 : 1;
        counts.set(e.offer_id, (counts.get(e.offer_id) ?? 0) + w);
      });
      scored = scored
        .map((o) => ({ ...o, score: counts.get(o.id) ?? 0 }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    }

    const examples = scored.map((o, i) => {
      const disc = o.original_price > 0 && o.promo_price < o.original_price
        ? Math.round((1 - o.promo_price / o.original_price) * 100)
        : 0;
      return `${i + 1}. "${o.title}" — R$ ${o.original_price} → R$ ${o.promo_price} (${disc}% OFF)${
        o.description ? ` | ${String(o.description).slice(0, 120)}` : ""
      }`;
    }).join("\n");

    const kindHint: Record<string, string> = {
      offer: "Oferta comum. O preço sugerido é o preço promocional.",
      coletiva: "Compra coletiva: o preço cai conforme mais pessoas entram. Destaque a vantagem de chamar amigos. O preço sugerido é o melhor preço da última faixa.",
      leilao: "Leilão reverso: o preço começa alto e cai com o tempo até um mínimo. Crie urgência. O preço sugerido é o preço mínimo do leilão.",
      invisivel: "Oferta invisível: só aparece para quem está perto da loja. Destaque a exclusividade de quem passa por perto. O preço sugerido é o preço promocional.",
    };

    const s = await generateJson<{ title: string; description: string; suggested_promo_price: number; discount_pct: number; reasoning: string }>({
      schemaName: "suggest_offer",
      instructions: `Você é um especialista sênior em Marketing e Vendas (comercial) e copywriter de ofertas locais brasileiras para o site OfertasFly.
Escreva em pt-BR, otimizado para conversão (cliques no WhatsApp e visitas à loja).
TÍTULO (até 80 caracteres, sem emojis): chamativo e direto, destaca o produto e seu principal benefício (preço, desconto, novidade, qualidade).
DESCRIÇÃO (até 200 caracteres): persuasiva; desperte necessidade e desejo, mostre benefícios e o prazer/uso no dia a dia, use urgência positiva ("aproveite", "garanta o seu") e termine com chamada para ação.
PROIBIDO: qualquer texto que gere dúvida, medo, culpa, insegurança ou ansiedade; perguntas negativas; tom alarmista ("vai se arrepender", "corra risco"); alertas de saúde; sarcasmo; comparações negativas com concorrentes.
Nunca invente fatos, garantias, brindes ou prazos não informados; sem promessas falsas.
Considere o desconto típico de ofertas de sucesso da mesma categoria para o preço sugerido. A justificativa tem 1 frase.`,
      input: `Tipo: ${kindHint[offer_type]}
Categoria: ${category_slug}
Preço original informado: R$ ${original_price.toFixed(2)}
${current_title ? `Título atual (referência): ${current_title}\n` : ""}${store_name ? `Loja: ${store_name}\n` : ""}${image_url ? `Imagem: ${image_url}\n` : ""}
Top ofertas de sucesso desta categoria:
${examples || "(sem dados ainda — use bom senso de mercado)"}`,
      schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          suggested_promo_price: { type: "number" },
          discount_pct: { type: "number" },
          reasoning: { type: "string" },
        },
        required: ["title", "description", "suggested_promo_price", "discount_pct", "reasoning"],
        additionalProperties: false,
      },
    });

    return json({
      title: String(s.title ?? "").slice(0, 140),
      description: String(s.description ?? "").slice(0, 500),
      suggested_promo_price: Math.min(Number(s.suggested_promo_price ?? 0), original_price),
      discount_pct: Number(s.discount_pct ?? 0),
      reasoning: String(s.reasoning ?? ""),
      examples_used: scored.length,
    });
  } catch (e) {
    console.error("suggest-offer error:", e);
    if (e instanceof AiError) return json({ error: e.message }, e.status);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
};

import { env } from "../env";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const image_url = body.image_url ? String(body.image_url) : null;
    const current_title = body.current_title ? String(body.current_title) : null;
    const store_name = body.store_name ? String(body.store_name) : null;

    if (!category_slug || !(original_price > 0)) {
      return new Response(
        JSON.stringify({ error: "category_slug e original_price são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch top offers in same category by views/contacts in last 60 days
    const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const { data: topOffers } = await supabase
      .from("offers")
      .select("id, title, description, original_price, promo_price")
      .eq("status", "approved")
      .eq("category_slug", category_slug)
      .order("popularity", { ascending: false })
      .limit(20);

    // Score by clicks
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

    const systemPrompt = `Você é um copywriter especialista em ofertas locais brasileiras para o site OfertasFly.
Sua missão é gerar título, descrição e preço promocional otimizados para conversão (cliques no WhatsApp).
Use linguagem direta, pt-BR, sem emojis no título. Descrição curta (até 200 caracteres), persuasiva, sem promessas falsas.
Considere o desconto típico de ofertas de sucesso da mesma categoria.`;

    const userPrompt = `Categoria: ${category_slug}
Preço original informado: R$ ${original_price.toFixed(2)}
${current_title ? `Título atual (apenas referência): ${current_title}\n` : ""}${store_name ? `Loja: ${store_name}\n` : ""}${image_url ? `Imagem: ${image_url}\n` : ""}
Top ofertas de sucesso desta categoria:
${examples || "(sem dados ainda — use bom senso de mercado)"}

Gere a melhor sugestão.`;

    const LOVABLE_API_KEY = env("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY ausente");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "suggest_offer",
            description: "Retorna sugestão de título, descrição e preço promocional",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "Título da oferta, max 80 caracteres" },
                description: { type: "string", description: "Descrição persuasiva, max 200 caracteres" },
                suggested_promo_price: { type: "number", description: "Preço promocional sugerido em reais" },
                discount_pct: { type: "number", description: "Percentual de desconto" },
                reasoning: { type: "string", description: "Justificativa curta (1 frase)" },
              },
              required: ["title", "description", "suggested_promo_price", "discount_pct", "reasoning"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "suggest_offer" } },
      }),
    });

    if (aiResp.status === 429) {
      return new Response(
        JSON.stringify({ error: "Muitas solicitações. Tente novamente em instantes." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (aiResp.status === 402) {
      return new Response(
        JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos em Configurações." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      throw new Error("Falha ao gerar sugestão");
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("Resposta inválida do modelo");
    const args = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({
        title: String(args.title ?? "").slice(0, 140),
        description: String(args.description ?? "").slice(0, 500),
        suggested_promo_price: Number(args.suggested_promo_price ?? 0),
        discount_pct: Number(args.discount_pct ?? 0),
        reasoning: String(args.reasoning ?? ""),
        examples_used: scored.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("suggest-offer error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
};

// Cron: gera review_prompts a partir de offer_events de interação (whatsapp_click, phone_click, qr_scan)
// elegíveis após X horas (configurável em app_settings.review_prompt_hours).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret || req.headers.get("x-cron-secret") !== cronSecret) {
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: settings } = await admin
      .from("app_settings")
      .select("review_prompt_hours")
      .eq("id", true)
      .maybeSingle();
    const hours = Math.max(1, Number(settings?.review_prompt_hours ?? 3));

    // Eventos de interação dos últimos 14 dias com user_agent? Não temos user_id em offer_events.
    // Estratégia: usamos session_id e tentamos casar com push_subscriptions/auth.
    // Como offer_events não tem user_id, este cron só cria prompt para usuários autenticados
    // que serão detectados via tabela auxiliar — fallback: criamos prompts a partir de favorites/follows
    // não aplicável. Solução: marcar eventos com user_id quando autenticado (alteração futura).
    // Por ora, processamos eventos cujo session_id casa com um user via mapeamento opt-in:
    // usaremos table review_prompt_seeds (não criada) — então este cron processa apenas
    // a partir de offer_events JOIN auth users via session->user (não disponível).
    //
    // Implementação efetiva: percorrer interações dos últimos 14 dias e, para cada par (offer, session),
    // se houver favorito do usuário OU follow da loja, criar prompt para esse user_id.
    const sinceIso = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
    const cutoffIso = new Date(Date.now() - hours * 3600 * 1000).toISOString();

    const { data: events } = await admin
      .from("offer_events")
      .select("id, offer_id, store_id, event_type, created_at")
      .in("event_type", ["whatsapp_click", "phone_click", "qr_scan"])
      .gte("created_at", sinceIso)
      .lte("created_at", cutoffIso);

    let created = 0;
    for (const ev of events ?? []) {
      // Buscar potenciais usuários: favoritos da oferta + seguidores da loja
      const [{ data: favs }, { data: follows }] = await Promise.all([
        admin.from("favorites").select("user_id").eq("offer_id", ev.offer_id),
        admin.from("store_followers").select("user_id").eq("store_id", ev.store_id),
      ]);
      const userIds = Array.from(
        new Set([...(favs ?? []).map((f) => f.user_id), ...(follows ?? []).map((f) => f.user_id)]),
      );
      if (userIds.length === 0) continue;

      // Filtra usuários que já avaliaram
      const { data: existingReviews } = await admin
        .from("offer_reviews")
        .select("user_id")
        .eq("offer_id", ev.offer_id)
        .in("user_id", userIds);
      const reviewedSet = new Set((existingReviews ?? []).map((r) => r.user_id));
      const targets = userIds.filter((u) => !reviewedSet.has(u));
      if (targets.length === 0) continue;

      const eligibleAt = new Date(
        new Date(ev.created_at).getTime() + hours * 3600 * 1000,
      ).toISOString();

      const rows = targets.map((user_id) => ({
        user_id,
        offer_id: ev.offer_id,
        store_id: ev.store_id,
        triggered_event_type: ev.event_type,
        eligible_at: eligibleAt,
      }));
      const { error } = await admin
        .from("review_prompts")
        .upsert(rows, { onConflict: "user_id,offer_id", ignoreDuplicates: true });
      if (!error) created += rows.length;
    }

    return new Response(JSON.stringify({ ok: true, processed: events?.length ?? 0, created }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

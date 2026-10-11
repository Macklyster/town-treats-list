import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type DutySchedule = {
  id: string;
  store_id: string;
  category_slug: string;
  starts_at: string;
  ends_at: string;
  active: boolean;
};

/** Plantões ativos neste momento: store_id -> término. Cache curto compartilhado. */
let cache: { at: number; map: Map<string, string> } | null = null;
let inflight: Promise<Map<string, string>> | null = null;

export async function fetchActiveDutyMap(): Promise<Map<string, string>> {
  if (cache && Date.now() - cache.at < 60_000) return cache.map;
  if (inflight) return inflight;
  const nowIso = new Date().toISOString();
  inflight = (async () => {
    const { data } = await supabase
      .from("store_duty_schedules")
      .select("store_id,ends_at")
      .eq("active", true)
      .lte("starts_at", nowIso)
      .gt("ends_at", nowIso);
    const map = new Map<string, string>();
    for (const r of data ?? []) map.set(r.store_id, r.ends_at);
    cache = { at: Date.now(), map };
    inflight = null;
    return map;
  })();
  return inflight;
}

export function useDutyUntil(storeId?: string | null): string | null {
  const [until, setUntil] = useState<string | null>(null);
  useEffect(() => {
    if (!storeId) return;
    let alive = true;
    fetchActiveDutyMap().then((m) => alive && setUntil(m.get(storeId) ?? null));
    return () => {
      alive = false;
    };
  }, [storeId]);
  return until;
}

export async function listStoreDuties(storeId: string): Promise<DutySchedule[]> {
  const { data } = await supabase
    .from("store_duty_schedules")
    .select("id,store_id,category_slug,starts_at,ends_at,active")
    .eq("store_id", storeId)
    .eq("active", true)
    .gt("ends_at", new Date().toISOString())
    .order("starts_at");
  return (data ?? []) as DutySchedule[];
}

export async function createDuty(storeId: string, category: string, starts: Date, ends: Date) {
  const { data, error } = await supabase.rpc("duty_schedule_create", {
    p_store_id: storeId,
    p_category: category,
    p_starts: starts.toISOString(),
    p_ends: ends.toISOString(),
  });
  if (error) return { ok: false, message: error.message };
  const r = data as any;
  if (r?.ok) {
    cache = null;
    return { ok: true, message: "Plantão agendado" };
  }
  const msgs: Record<string, string> = {
    limit_reached: `Limite de plantonistas atingido: já existem ${r?.count} loja(s) desta categoria em plantão neste período na sua cidade${r?.stores ? ` (${r.stores})` : ""}. Limite: ${r?.limit}.`,
    own_overlap: "Você já tem um plantão agendado que coincide com esse período.",
    invalid_range: "O término precisa ser depois do início.",
    past_range: "Esse período já passou.",
    too_long: "O plantão pode durar no máximo 31 dias.",
    invalid_category: "Selecione uma categoria válida.",
    forbidden: "Você não tem permissão para esta loja.",
  };
  return { ok: false, message: msgs[r?.error] ?? "Não foi possível agendar." };
}

export async function cancelDuty(id: string) {
  const { error } = await supabase.from("store_duty_schedules").update({ active: false }).eq("id", id);
  cache = null;
  return !error;
}

export const formatDutyDate = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

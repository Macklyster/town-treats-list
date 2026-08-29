import { supabase } from "@/integrations/supabase/client";

// ============================================================
// FlyPontos — programa de fidelidade por lojista
// ============================================================

export type LoyaltyRewardKind = "coupon" | "credit" | "gift" | "tier_benefit";

export type LoyaltyRules = {
  follow: number;
  favorite: number;
  review: number;
  review_photo: number;
  share: number;
  checkin: number;
  coupon: number;
  purchase_per_real: number;
  referral: number;
};

export type LoyaltyTier = {
  id: string;
  name: string;
  min_points: number;
  multiplier: number;
  perks: string[];
  early_access?: boolean;
  extra_discount_percent?: number;
};

export type LoyaltyReward = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  kind: LoyaltyRewardKind;
  points_cost: number;
  credit_cents: number;
  stock: number | null;
  valid_until: string | null;
  min_tier_id: string | null;
};

export type LoyaltyMission = {
  id: string;
  title: string;
  description: string | null;
  goal_type: string;
  goal_count: number;
  reward_points: number;
  period: string;
  progress: number;
  completed_at: string | null;
};

export type LoyaltyLedgerEntry = {
  id: string;
  points: number;
  credit_cents: number;
  reason: string;
  kind: "credit" | "debit" | "expire";
  created_at: string;
};

export type LoyaltyRedemption = {
  id: string;
  code: string;
  status: "pending" | "fulfilled" | "canceled";
  points_spent: number;
  created_at: string;
  reward: string | null;
};

export type LoyaltyState = {
  active: boolean;
  store?: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    city: string;
    state: string;
    latitude: number | null;
    longitude: number | null;
  };
  program?: {
    rules: LoyaltyRules;
    cashback_percent: number;
    terms: string | null;
    points_expire_months: number;
    checkin_radius_meters: number;
  };
  tiers?: LoyaltyTier[];
  membership?: {
    id: string;
    points_balance: number;
    points_lifetime: number;
    credit_cents: number;
    visits_count: number;
    joined_at: string;
    tier: LoyaltyTier | null;
  } | null;
  rewards?: LoyaltyReward[];
  missions?: LoyaltyMission[];
  ledger?: LoyaltyLedgerEntry[];
  redemptions?: LoyaltyRedemption[];
};

export type LoyaltyWalletCard = {
  store_id: string;
  store_name: string;
  store_slug: string;
  logo_url: string | null;
  city: string;
  state: string;
  points_balance: number;
  points_lifetime: number;
  credit_cents: number;
  visits_count: number;
  tier_name: string | null;
  tier_min_points: number | null;
  multiplier: number | null;
  next_tier_name: string | null;
  next_tier_points: number | null;
  cheapest_reward: number | null;
  open_missions: number;
};

export type LoyaltyBadge = {
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  created_at: string;
};

export type LoyaltyWallet = {
  cards: LoyaltyWalletCard[];
  badges: LoyaltyBadge[];
  total_points: number;
  total_credit_cents: number;
  expiring_points: number;
};

export type LoyaltyReport = {
  members: number;
  new_members: number;
  points_issued: number;
  points_redeemed: number;
  points_liability: number;
  credit_liability_cents: number;
  validated_purchases: number;
  revenue_cents: number;
  avg_ticket_cents: number;
  returning_members: number;
  redemptions_pending: number;
  top_members: {
    name: string;
    points_balance: number;
    points_lifetime: number;
    visits_count: number;
    tier: string | null;
  }[];
  error?: string;
};

const rpc = async <T,>(fn: string, args?: Record<string, unknown>): Promise<T> => {
  const { data, error } = await supabase.rpc(fn as any, args as any);
  if (error) throw new Error(error.message);
  return data as T;
};

/** Estado do programa de uma loja para o consumidor logado. */
export const fetchLoyaltyState = (storeId: string) =>
  rpc<LoyaltyState>("loyalty_state", { p_store_id: storeId });

/** Carteira completa do consumidor (todas as lojas + selos). */
export const fetchLoyaltyWallet = () => rpc<LoyaltyWallet>("loyalty_wallet");

export const joinLoyalty = (storeId: string) =>
  rpc<{ ok: boolean; error?: string }>("loyalty_join", { p_store_id: storeId });

export const registerLoyaltyReferral = (storeId: string, referrerId: string) =>
  rpc<{ ok: boolean; error?: string }>("loyalty_register_referral", {
    p_store_id: storeId,
    p_referrer_id: referrerId,
  });

export const trackLoyaltyAction = (storeId: string, reason: "share", refId?: string | null) =>
  rpc<{ ok: boolean; points: number }>("loyalty_track_action", {
    p_store_id: storeId,
    p_reason: reason,
    p_ref_id: refId ?? null,
  });

export const loyaltyCheckin = (storeId: string, lat: number, lng: number) =>
  rpc<{ ok: boolean; error?: string; points?: number; distance?: number }>("loyalty_checkin", {
    p_store_id: storeId,
    p_lat: lat,
    p_lng: lng,
  });

export const issueLoyaltyQr = () =>
  rpc<{ ok: boolean; code?: string; expires_at?: string; error?: string }>("loyalty_issue_qr");

export const redeemLoyaltyReward = (rewardId: string) =>
  rpc<{ ok: boolean; error?: string; code?: string; kind?: LoyaltyRewardKind }>(
    "loyalty_redeem_reward",
    { p_reward_id: rewardId },
  );

export type ValidatePurchaseResult = {
  ok: boolean;
  error?: string;
  points_awarded?: number;
  cashback_cents?: number;
  credit_used_cents?: number;
  customer?: string;
  balance?: number;
  credit_cents?: number;
  tier?: string | null;
};

export const validateLoyaltyPurchase = (
  code: string,
  amountCents: number,
  useCreditCents = 0,
) =>
  rpc<ValidatePurchaseResult>("loyalty_validate_purchase", {
    p_code: code,
    p_amount_cents: amountCents,
    p_use_credit_cents: useCreditCents,
  });

export const fulfillLoyaltyRedemption = (code: string) =>
  rpc<{ ok: boolean; error?: string; reward?: string }>("loyalty_fulfill_redemption", {
    p_code: code,
  });

export const fetchLoyaltyReport = (storeId: string, days = 30) =>
  rpc<LoyaltyReport>("loyalty_store_report", { p_store_id: storeId, p_days: days });

export const fetchCityRanking = (city: string | null, limit = 20) =>
  rpc<
    { name: string; avatar_url: string | null; points: number; badges: number }[]
  >("loyalty_city_ranking", { p_city: city, p_limit: limit });

// ---------- painel do lojista ----------

export type LoyaltyProgramRow = {
  id: string;
  store_id: string;
  active: boolean;
  rules: LoyaltyRules;
  points_expire_months: number;
  cashback_percent: number;
  checkin_radius_meters: number;
  terms: string | null;
};

export async function fetchStoreProgram(storeId: string) {
  const [{ data: program }, { data: tiers }, { data: rewards }, { data: missions }] =
    await Promise.all([
      supabase.from("loyalty_programs").select("*").eq("store_id", storeId).maybeSingle(),
      supabase.from("loyalty_tiers").select("*").eq("store_id", storeId).order("min_points"),
      supabase
        .from("loyalty_rewards")
        .select("*")
        .eq("store_id", storeId)
        .order("points_cost"),
      supabase
        .from("loyalty_missions")
        .select("*")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false }),
    ]);
  return {
    program: (program as any) as LoyaltyProgramRow | null,
    tiers: ((tiers ?? []) as any[]) as (LoyaltyTier & { store_id: string })[],
    rewards: ((rewards ?? []) as any[]) as (LoyaltyReward & { active: boolean })[],
    missions: ((missions ?? []) as any[]) as (LoyaltyMission & { active: boolean })[],
  };
}

export async function createStoreProgram(storeId: string) {
  const { error } = await supabase
    .from("loyalty_programs")
    .insert({ store_id: storeId, active: true } as any);
  if (error) throw new Error(error.message);
}

export async function updateStoreProgram(
  id: string,
  patch: Partial<Omit<LoyaltyProgramRow, "id" | "store_id">>,
) {
  const { error } = await supabase.from("loyalty_programs").update(patch as any).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function upsertTier(
  storeId: string,
  tier: { id?: string; name: string; min_points: number; multiplier: number; early_access: boolean; extra_discount_percent: number },
) {
  const payload = { ...tier, store_id: storeId } as any;
  const { error } = tier.id
    ? await supabase.from("loyalty_tiers").update(payload).eq("id", tier.id)
    : await supabase.from("loyalty_tiers").insert(payload);
  if (error) throw new Error(error.message);
}

export async function saveReward(
  storeId: string,
  reward: {
    id?: string;
    title: string;
    description: string | null;
    kind: LoyaltyRewardKind;
    points_cost: number;
    credit_cents: number;
    coupon_id: string | null;
    stock: number | null;
    valid_until: string | null;
    active: boolean;
  },
) {
  const payload = { ...reward, store_id: storeId } as any;
  const { error } = reward.id
    ? await supabase.from("loyalty_rewards").update(payload).eq("id", reward.id)
    : await supabase.from("loyalty_rewards").insert(payload);
  if (error) throw new Error(error.message);
}

export async function deleteReward(id: string) {
  const { error } = await supabase.from("loyalty_rewards").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function saveMission(
  storeId: string,
  mission: {
    id?: string;
    title: string;
    description: string | null;
    goal_type: string;
    goal_count: number;
    reward_points: number;
    period: string;
    active: boolean;
  },
) {
  const payload = { ...mission, store_id: storeId } as any;
  const { error } = mission.id
    ? await supabase.from("loyalty_missions").update(payload).eq("id", mission.id)
    : await supabase.from("loyalty_missions").insert(payload);
  if (error) throw new Error(error.message);
}

export async function deleteMission(id: string) {
  const { error } = await supabase.from("loyalty_missions").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ---------- rótulos ----------

export const REASON_LABELS: Record<string, string> = {
  join: "Adesão ao programa",
  follow: "Seguiu a loja",
  favorite: "Favoritou uma oferta",
  review: "Avaliação publicada",
  review_photo: "Avaliação com foto",
  share: "Compartilhou uma oferta",
  checkin: "Check-in na loja",
  coupon: "Resgate de cupom",
  purchase: "Compra validada",
  mission: "Missão concluída",
  referral: "Indicação de amigo",
  redeem: "Resgate de recompensa",
  credit_used: "Crédito utilizado",
  expire: "Pontos expirados",
};

export const GOAL_TYPES: { value: string; label: string }[] = [
  { value: "purchase", label: "Compras validadas" },
  { value: "review", label: "Avaliações publicadas" },
  { value: "checkin", label: "Check-ins na loja" },
  { value: "share", label: "Compartilhamentos" },
  { value: "favorite", label: "Ofertas favoritadas" },
  { value: "coupon", label: "Cupons resgatados" },
];

export const REWARD_KIND_LABELS: Record<LoyaltyRewardKind, string> = {
  coupon: "Cupom exclusivo",
  credit: "Crédito em reais",
  gift: "Brinde / experiência",
  tier_benefit: "Benefício de nível",
};

export const formatCents = (cents: number) =>
  (Number(cents || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

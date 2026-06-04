import { supabase } from "@/integrations/supabase/client";

export type MediaAsset = {
  id: string;
  store_id: string;
  url: string;
  storage_path: string | null;
  filename: string | null;
  alt_text: string | null;
  width: number | null;
  height: number | null;
  bytes: number | null;
  tags: string[];
  created_at: string;
};

export type OfferMediaLink = {
  offer_id: string;
  media_id: string;
  position: number;
  is_cover: boolean;
};

const BUCKET = "offer-images";

function pathFromUrl(url: string) {
  const marker = `/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  return idx >= 0 ? url.slice(idx + marker.length) : null;
}

async function compress(file: File, maxWidth = 1600): Promise<{ blob: Blob; w: number; h: number }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("compress failed"))), "image/webp", 0.85),
  );
  return { blob, w, h };
}

export async function uploadMediaFile(file: File, storeId: string): Promise<MediaAsset> {
  if (!file.type.startsWith("image/")) throw new Error("Apenas imagens são suportadas.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Arquivo muito grande (máx. 8 MB).");

  const { blob, w, h } = await compress(file);
  const path = `${storeId}/${crypto.randomUUID()}.webp`;
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: "image/webp", upsert: false });
  if (upErr) throw upErr;
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { data, error } = await supabase
    .from("media_assets")
    .insert({
      store_id: storeId,
      url: pub.publicUrl,
      storage_path: path,
      filename: file.name,
      width: w,
      height: h,
      bytes: blob.size,
    })
    .select("*")
    .single();
  if (error) {
    await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
    throw error;
  }
  return data as MediaAsset;
}

export async function listStoreMedia(storeId: string): Promise<MediaAsset[]> {
  const { data, error } = await supabase
    .from("media_assets")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as MediaAsset[];
}

export async function updateMediaAsset(id: string, patch: Partial<Pick<MediaAsset, "alt_text" | "tags" | "filename">>) {
  const { error } = await supabase.from("media_assets").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteMediaAsset(asset: MediaAsset) {
  // Will fail if referenced; caller can warn
  const { error } = await supabase.from("media_assets").delete().eq("id", asset.id);
  if (error) throw error;
  const path = asset.storage_path ?? pathFromUrl(asset.url);
  if (path) await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
}

export async function listOfferMedia(offerId: string): Promise<(OfferMediaLink & { asset: MediaAsset })[]> {
  const { data, error } = await supabase
    .from("offer_media")
    .select("offer_id, media_id, position, is_cover, asset:media_assets(*)")
    .eq("offer_id", offerId)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []) as any;
}

export async function setOfferMedia(offerId: string, mediaIds: string[], coverId?: string) {
  await supabase.from("offer_media").delete().eq("offer_id", offerId);
  if (mediaIds.length === 0) return;
  const cover = coverId ?? mediaIds[0];
  const rows = mediaIds.map((media_id, i) => ({
    offer_id: offerId,
    media_id,
    position: i,
    is_cover: media_id === cover,
  }));
  const { error } = await supabase.from("offer_media").insert(rows);
  if (error) throw error;
  // Sync offers.image_url with cover (compat)
  const { data: coverAsset } = await supabase.from("media_assets").select("url").eq("id", cover).single();
  if (coverAsset?.url) {
    await supabase.from("offers").update({ image_url: coverAsset.url }).eq("id", offerId);
  }
}

export async function duplicateOffer(offerId: string): Promise<string> {
  const { data, error } = await supabase.rpc("duplicate_offer", { p_offer_id: offerId });
  if (error) throw error;
  return data as string;
}

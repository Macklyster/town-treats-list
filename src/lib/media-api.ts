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
  media_type: "image" | "video";
  duration_seconds: number | null;
  poster_url: string | null;
};

export type OfferMediaLink = {
  offer_id: string;
  media_id: string;
  position: number;
  is_cover: boolean;
};

const BUCKET = "offer-images";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 20 * 1024 * 1024;
const MAX_VIDEO_SECONDS = 30;

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

async function extractVideoPoster(file: File): Promise<{ blob: Blob; w: number; h: number; duration: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = url;
    const cleanup = () => URL.revokeObjectURL(url);
    video.onloadedmetadata = () => {
      const target = Math.min(0.5, Math.max(0, (video.duration || 1) / 2));
      const seek = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          cleanup();
          return reject(new Error("canvas indisponível"));
        }
        ctx.drawImage(video, 0, 0);
        canvas.toBlob(
          (b) => {
            cleanup();
            if (!b) return reject(new Error("poster falhou"));
            resolve({ blob: b, w: video.videoWidth, h: video.videoHeight, duration: video.duration });
          },
          "image/jpeg",
          0.82,
        );
      };
      video.onseeked = seek;
      try {
        video.currentTime = target;
      } catch {
        seek();
      }
    };
    video.onerror = () => {
      cleanup();
      reject(new Error("Não foi possível ler o vídeo."));
    };
  });
}

export async function uploadMediaFile(file: File, storeId: string): Promise<MediaAsset> {
  const isVideo = file.type.startsWith("video/");
  const isImage = file.type.startsWith("image/");
  if (!isVideo && !isImage) throw new Error("Formato não suportado.");

  if (isImage) {
    if (file.size > MAX_IMAGE_BYTES) throw new Error("Imagem muito grande (máx. 8 MB).");
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
        media_type: "image",
      })
      .select("*")
      .single();
    if (error) {
      await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
      throw error;
    }
    return data as MediaAsset;
  }

  // Video
  if (!["video/mp4", "video/webm", "video/quicktime"].includes(file.type)) {
    throw new Error("Use vídeos MP4 ou WebM.");
  }
  if (file.size > MAX_VIDEO_BYTES) throw new Error("Vídeo muito grande (máx. 20 MB).");
  const poster = await extractVideoPoster(file);
  if (poster.duration > MAX_VIDEO_SECONDS + 0.5) {
    throw new Error(`Vídeo muito longo (máx. ${MAX_VIDEO_SECONDS}s).`);
  }
  const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
  const videoPath = `${storeId}/${crypto.randomUUID()}.${ext}`;
  const posterPath = `${storeId}/${crypto.randomUUID()}.jpg`;

  const { error: upVidErr } = await supabase.storage
    .from(BUCKET)
    .upload(videoPath, file, { contentType: file.type, upsert: false });
  if (upVidErr) throw upVidErr;
  const { error: upPosterErr } = await supabase.storage
    .from(BUCKET)
    .upload(posterPath, poster.blob, { contentType: "image/jpeg", upsert: false });
  if (upPosterErr) {
    await supabase.storage.from(BUCKET).remove([videoPath]).catch(() => {});
    throw upPosterErr;
  }
  const { data: pubVid } = supabase.storage.from(BUCKET).getPublicUrl(videoPath);
  const { data: pubPoster } = supabase.storage.from(BUCKET).getPublicUrl(posterPath);

  const { data, error } = await supabase
    .from("media_assets")
    .insert({
      store_id: storeId,
      url: pubVid.publicUrl,
      storage_path: videoPath,
      filename: file.name,
      width: poster.w,
      height: poster.h,
      bytes: file.size,
      media_type: "video",
      duration_seconds: Math.round(poster.duration),
      poster_url: pubPoster.publicUrl,
    })
    .select("*")
    .single();
  if (error) {
    await supabase.storage.from(BUCKET).remove([videoPath, posterPath]).catch(() => {});
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
  const { error } = await supabase.from("media_assets").delete().eq("id", asset.id);
  if (error) throw error;
  const path = asset.storage_path ?? pathFromUrl(asset.url);
  const toRemove = [path, asset.poster_url ? pathFromUrl(asset.poster_url) : null].filter(Boolean) as string[];
  if (toRemove.length) await supabase.storage.from(BUCKET).remove(toRemove).catch(() => {});
}

export async function listOfferMedia(offerId: string): Promise<(OfferMediaLink & { asset: MediaAsset })[]> {
  const { data, error } = await supabase
    .from("offer_media")
    .select("offer_id, media_id, position, is_cover, asset:media_assets(*)")
    .eq("offer_id", offerId)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []).filter((row: any) => row.asset) as any;
}

export async function setOfferMedia(offerId: string, mediaIds: string[], coverId?: string) {
  const uniqueMediaIds = [...new Set(mediaIds)];
  if (uniqueMediaIds.length === 0) {
    const { error } = await supabase.from("offer_media").delete().eq("offer_id", offerId);
    if (error) throw error;
    return;
  }
  // Cover must be an image; fall back to first image, then first item
  const { data: assets, error: assetsError } = await supabase
    .from("media_assets")
    .select("id, url, media_type")
    .in("id", uniqueMediaIds);
  if (assetsError) throw assetsError;
  if ((assets ?? []).length !== uniqueMediaIds.length) {
    throw new Error("Uma ou mais mídias selecionadas não estão disponíveis.");
  }
  const byId = new Map((assets ?? []).map((a: any) => [a.id, a]));
  let cover = coverId && byId.get(coverId)?.media_type === "image" ? coverId : undefined;
  if (!cover) {
    cover = uniqueMediaIds.find((id) => byId.get(id)?.media_type === "image") ?? uniqueMediaIds[0];
  }
  const rows = uniqueMediaIds.map((media_id, i) => ({
    offer_id: offerId,
    media_id,
    position: i,
    is_cover: media_id === cover,
  }));
  const { error: upsertError } = await supabase
    .from("offer_media")
    .upsert(rows, { onConflict: "offer_id,media_id" });
  if (upsertError) throw upsertError;

  const { error: removeError } = await supabase
    .from("offer_media")
    .delete()
    .eq("offer_id", offerId)
    .not("media_id", "in", `(${uniqueMediaIds.join(",")})`);
  if (removeError) throw removeError;

  const { data: persisted, error: verifyError } = await supabase
    .from("offer_media")
    .select("media_id")
    .eq("offer_id", offerId);
  if (verifyError) throw verifyError;
  if ((persisted ?? []).length !== rows.length) {
    throw new Error("Não foi possível salvar todas as mídias da oferta.");
  }
  const coverAsset: any = byId.get(cover);
  if (coverAsset?.url) {
    const { error: coverError } = await supabase.from("offers").update({ image_url: coverAsset.url }).eq("id", offerId);
    if (coverError) throw coverError;
  }
}

export async function duplicateOffer(offerId: string): Promise<string> {
  const { data, error } = await supabase.rpc("duplicate_offer", { p_offer_id: offerId });
  if (error) throw error;
  return data as string;
}

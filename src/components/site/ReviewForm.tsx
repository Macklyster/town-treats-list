import { useRef, useState } from "react";
import { Loader2, X, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { RatingStars } from "./RatingStars";

const MAX_PHOTOS = 3;
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = ["image/jpeg", "image/png", "image/webp"];

async function compress(file: File, maxWidth = 1200): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("compression failed"))),
      "image/webp",
      0.82,
    );
  });
}

type Props = {
  offerId: string;
  storeName?: string;
  onSubmitted?: () => void;
  onCancel?: () => void;
};

export function ReviewForm({ offerId, storeName, onSubmitted, onCancel }: Props) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<{ url: string; uploading?: boolean }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!user) return;
    if (photos.length >= MAX_PHOTOS) return;
    if (!ACCEPT.includes(file.type)) {
      toast.error("Use JPG, PNG ou WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Foto muito grande (máx. 5 MB).");
      return;
    }
    const idx = photos.length;
    setPhotos((p) => [...p, { url: "", uploading: true }]);
    try {
      const blob = await compress(file);
      const path = `${user.id}/${crypto.randomUUID()}.webp`;
      const { error } = await supabase.storage
        .from("review-photos")
        .upload(path, blob, { contentType: "image/webp" });
      if (error) throw error;
      const { data } = supabase.storage.from("review-photos").getPublicUrl(path);
      setPhotos((p) => p.map((it, i) => (i === idx ? { url: data.publicUrl } : it)));
    } catch (e: any) {
      toast.error(e.message ?? "Falha no upload da foto.");
      setPhotos((p) => p.filter((_, i) => i !== idx));
    }
  };

  const removePhoto = async (index: number) => {
    const p = photos[index];
    if (!p) return;
    setPhotos((arr) => arr.filter((_, i) => i !== index));
    if (p.url) {
      const marker = "/object/public/review-photos/";
      const idx2 = p.url.indexOf(marker);
      if (idx2 >= 0) {
        const path = p.url.slice(idx2 + marker.length);
        await supabase.storage.from("review-photos").remove([path]).catch(() => {});
      }
    }
  };

  const submit = async () => {
    if (!user) {
      toast.error("Faça login para avaliar.");
      return;
    }
    if (rating < 1) {
      toast.error("Escolha uma nota de 1 a 5 estrelas.");
      return;
    }
    if (comment.length > 280) {
      toast.error("Comentário muito longo (máx. 280).");
      return;
    }
    if (photos.some((p) => p.uploading)) {
      toast.error("Aguarde o envio das fotos.");
      return;
    }
    setSubmitting(true);
    try {
      const { data: review, error } = await supabase
        .from("offer_reviews")
        .insert({
          offer_id: offerId,
          store_id: "00000000-0000-0000-0000-000000000000", // overwritten by trigger
          user_id: user.id,
          rating,
          comment: comment.trim() || null,
        })
        .select("id, status")
        .single();
      if (error) throw error;

      if (photos.length > 0 && review) {
        const rows = photos
          .filter((p) => p.url)
          .map((p, i) => ({ review_id: review.id, image_url: p.url, sort_order: i }));
        if (rows.length > 0) {
          await supabase.from("offer_review_photos").insert(rows);
        }
      }

      // dismiss any prompt
      await supabase
        .from("review_prompts")
        .update({ dismissed_at: new Date().toISOString(), dismissed_permanently: true })
        .eq("user_id", user.id)
        .eq("offer_id", offerId);

      toast.success(
        review?.status === "approved"
          ? "Obrigado pela avaliação!"
          : "Avaliação enviada para análise.",
      );
      onSubmitted?.();
    } catch (e: any) {
      if (e.message?.includes("duplicate key")) {
        toast.error("Você já avaliou esta oferta.");
      } else {
        toast.error(e.message ?? "Falha ao enviar avaliação.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium text-foreground">
          {storeName ? `Como foi sua experiência na ${storeName}?` : "Como foi sua experiência?"}
        </p>
        <RatingStars value={rating} onChange={setRating} size={32} />
      </div>

      <div>
        <Textarea
          placeholder="Conte aos outros clientes (opcional)"
          value={comment}
          maxLength={280}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
        />
        <p className="mt-1 text-right text-xs text-muted-foreground">{comment.length}/280</p>
      </div>

      <div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT.join(",")}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        <div className="flex flex-wrap gap-2">
          {photos.map((p, i) => (
            <div key={i} className="relative h-20 w-20 overflow-hidden rounded-lg border bg-muted">
              {p.uploading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <img src={p.url} alt="Foto" className="h-full w-full object-cover" />
              )}
              {!p.uploading && (
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute right-0.5 top-0.5 rounded-full bg-background/80 p-0.5"
                  aria-label="Remover foto"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-muted-foreground/30 text-xs text-muted-foreground hover:border-primary/50"
            >
              <Camera className="h-5 w-5" />
              Foto
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Até {MAX_PHOTOS} fotos opcionais.</p>
      </div>

      <div className="flex gap-2">
        <Button onClick={submit} disabled={submitting || rating < 1} className="flex-1">
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Enviar avaliação
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
        )}
      </div>
    </div>
  );
}

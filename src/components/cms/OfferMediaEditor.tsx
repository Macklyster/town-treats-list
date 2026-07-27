import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ImageIcon, Play, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { MediaPicker } from "./MediaPicker";
import type { MediaAsset } from "@/lib/media-api";
import { supabase } from "@/integrations/supabase/client";

export type OfferMediaItem = Pick<
  MediaAsset,
  "id" | "url" | "media_type" | "poster_url" | "alt_text" | "duration_seconds"
>;

type Props = {
  storeId: string;
  value: OfferMediaItem[];
  coverId?: string;
  onChange: (items: OfferMediaItem[], coverId?: string) => void;
  maxImages?: number;
};

export function OfferMediaEditor({ storeId, value, coverId, onChange, maxImages = 8 }: Props) {
  const [items, setItems] = useState<OfferMediaItem[]>(value);
  const [cover, setCover] = useState<string | undefined>(coverId);

  useEffect(() => setItems(value), [value]);
  useEffect(() => setCover(coverId), [coverId]);

  const emit = (next: OfferMediaItem[], nextCover?: string) => {
    onChange(next, nextCover);
    setItems(next);
    setCover(nextCover);
  };

  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[idx], next[j]] = [next[j], next[idx]];
    emit(next, cover);
  };

  const remove = (id: string) => {
    const next = items.filter((i) => i.id !== id);
    let c = cover;
    if (c === id) {
      const firstImg = next.find((i) => i.media_type === "image");
      c = firstImg?.id;
    }
    emit(next, c);
  };

  const setAsCover = (id: string) => {
    const target = items.find((i) => i.id === id);
    if (!target || target.media_type !== "image") return;
    emit(items, id);
  };

  const imageCount = items.filter((i) => i.media_type === "image").length;
  const videoCount = items.filter((i) => i.media_type === "video").length;

  const handlePickerChange = async (ids: string[], nextCover: string) => {
    if (!ids.length) {
      emit([], undefined);
      return;
    }
    const { data } = await supabase
      .from("media_assets")
      .select("id, url, media_type, poster_url, alt_text, duration_seconds")
      .in("id", ids);
    const byId = new Map((data ?? []).map((a: any) => [a.id, a]));
    // Preserve order chosen by ids array from picker
    const next: OfferMediaItem[] = ids
      .map((id) => byId.get(id))
      .filter(Boolean) as OfferMediaItem[];
    // enforce: max 1 video
    let videos = 0;
    const filtered = next.filter((i) => {
      if (i.media_type === "video") {
        videos += 1;
        return videos <= 1;
      }
      return true;
    });
    // enforce max images
    let imgs = 0;
    const final = filtered.filter((i) => {
      if (i.media_type === "image") {
        imgs += 1;
        return imgs <= maxImages;
      }
      return true;
    });
    // cover must be image
    let c = nextCover;
    const coverAsset = final.find((i) => i.id === c);
    if (!coverAsset || coverAsset.media_type !== "image") {
      c = final.find((i) => i.media_type === "image")?.id;
    }
    emit(final, c);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Label>Mídias do anúncio</Label>
          <p className="text-xs text-muted-foreground">
            Até {maxImages} imagens e 1 vídeo (máx. 30s). A primeira imagem é a capa.
          </p>
        </div>
        <MediaPicker
          storeId={storeId}
          selected={items.map((i) => i.id)}
          coverId={cover}
          onChange={handlePickerChange}
          trigger={
            <Button type="button" variant="outline" size="sm">
              <ImageIcon className="mr-2 h-4 w-4" />
              {items.length ? "Gerenciar mídias" : "Adicionar mídias"}
            </Button>
          }
        />
      </div>

      {items.length === 0 ? (
        <div className="rounded-md border-2 border-dashed p-6 text-center text-sm text-muted-foreground">
          Nenhuma mídia selecionada. Clique em "Adicionar mídias".
        </div>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {items.map((it, idx) => {
            const isCover = it.id === cover;
            return (
              <li
                key={it.id}
                className={`flex items-center gap-3 rounded-md border bg-card p-2 ${
                  isCover ? "ring-2 ring-primary" : ""
                }`}
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded bg-muted">
                  <img
                    src={it.media_type === "video" ? it.poster_url ?? it.url : it.url}
                    alt={it.alt_text ?? ""}
                    className="h-full w-full object-cover"
                  />
                  {it.media_type === "video" && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                      <Play className="h-5 w-5 fill-white text-white" />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-1">
                    {isCover && (
                      <Badge className="gap-1 text-[10px]">
                        <Star className="h-3 w-3" /> Capa
                      </Badge>
                    )}
                    {it.media_type === "video" && (
                      <Badge variant="secondary" className="text-[10px]">Vídeo</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => move(idx, -1)} disabled={idx === 0}>
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => move(idx, 1)} disabled={idx === items.length - 1}>
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                    {it.media_type === "image" && !isCover && (
                      <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setAsCover(it.id)}>
                        <Star className="mr-1 h-3 w-3" /> Definir capa
                      </Button>
                    )}
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(it.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">
        {imageCount} imagem(ns) · {videoCount} vídeo(s)
      </p>
    </div>
  );
}

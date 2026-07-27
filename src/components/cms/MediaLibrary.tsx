import { useEffect, useMemo, useRef, useState } from "react";
import { Upload, Loader2, Trash2, Search, ImageIcon, Star, CheckCircle2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  listStoreMedia,
  uploadMediaFile,
  updateMediaAsset,
  deleteMediaAsset,
  type MediaAsset,
} from "@/lib/media-api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Props = {
  storeId: string;
  selectable?: boolean;
  selected?: string[];
  coverId?: string;
  onToggle?: (id: string) => void;
  onSetCover?: (id: string) => void;
};

export function MediaLibrary({ storeId, selectable, selected = [], coverId, onToggle, onSetCover }: Props) {
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await listStoreMedia(storeId));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (storeId) load();
  }, [storeId]);

  const upload = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setBusy(true);
    let ok = 0;
    for (const f of Array.from(files)) {
      try {
        await uploadMediaFile(f, storeId);
        ok++;
      } catch (e: any) {
        toast.error(`${f.name}: ${e.message}`);
      }
    }
    setBusy(false);
    if (ok) toast.success(`${ok} mídia(s) enviada(s)`);
    load();
  };

  const remove = async (a: MediaAsset) => {
    try {
      await deleteMediaAsset(a);
      toast.success("Removida");
      setItems((prev) => prev.filter((x) => x.id !== a.id));
    } catch (e: any) {
      toast.error("Não foi possível remover. A imagem pode estar em uso por alguma oferta.");
    }
  };

  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "video">("all");
  const filtered = useMemo(() => items.filter(
    (i) =>
      (typeFilter === "all" || i.media_type === typeFilter) &&
      (!q ||
        i.filename?.toLowerCase().includes(q.toLowerCase()) ||
        i.alt_text?.toLowerCase().includes(q.toLowerCase()) ||
        i.tags.some((t) => t.toLowerCase().includes(q.toLowerCase())))
  ), [items, q, typeFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Buscar por nome, alt-text ou tag…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex rounded-md border p-0.5 text-xs">
          {(["all", "image", "video"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setTypeFilter(k)}
              className={`px-2 py-1 rounded ${typeFilter === k ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              {k === "all" ? "Todas" : k === "image" ? "Imagens" : "Vídeos"}
            </button>
          ))}
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={(e) => {
            upload(e.target.files);
            e.target.value = "";
          }}
        />
        <Button onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          Enviar mídias
        </Button>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          upload(e.dataTransfer.files);
        }}
        className="rounded-lg border-2 border-dashed p-4"
      >
        {loading ? (
          <p className="py-8 text-center text-muted-foreground">Carregando…</p>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            <ImageIcon className="mx-auto mb-2 h-8 w-8 opacity-60" />
            Nenhuma imagem ainda. Arraste arquivos aqui ou clique em "Enviar imagens".
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filtered.map((a) => {
              const isSelected = selected.includes(a.id);
              const isCover = coverId === a.id;
              return (
                <div
                  key={a.id}
                  className={`group relative overflow-hidden rounded-md border bg-card transition ${
                    isSelected ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => (selectable ? onToggle?.(a.id) : null)}
                    className="relative block aspect-square w-full bg-muted"
                  >
                    <img
                      src={a.media_type === "video" ? (a.poster_url ?? a.url) : a.url}
                      alt={a.alt_text ?? ""}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    {a.media_type === "video" && (
                      <>
                        <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                          <Play className="h-8 w-8 fill-white text-white drop-shadow" />
                        </span>
                        {a.duration_seconds != null && (
                          <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                            {a.duration_seconds}s
                          </span>
                        )}
                      </>
                    )}
                  </button>
                  {isCover && (
                    <Badge className="absolute left-1 top-1 gap-1">
                      <Star className="h-3 w-3" /> Capa
                    </Badge>
                  )}
                  {isSelected && !isCover && (
                    <CheckCircle2 className="absolute left-1 top-1 h-5 w-5 fill-primary text-primary-foreground" />
                  )}
                  <div className="p-2 space-y-1">
                    <Input
                      defaultValue={a.alt_text ?? ""}
                      placeholder="Alt-text"
                      className="h-7 text-xs"
                      onBlur={async (e) => {
                        const v = e.target.value.trim();
                        if (v !== (a.alt_text ?? "")) {
                          try {
                            await updateMediaAsset(a.id, { alt_text: v || null });
                          } catch (err: any) {
                            toast.error(err.message);
                          }
                        }
                      }}
                    />
                    <div className="flex items-center justify-between gap-1">
                      {selectable && isSelected ? (
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => onSetCover?.(a.id)}>
                          <Star className="mr-1 h-3 w-3" /> Capa
                        </Button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground truncate">{a.filename ?? "imagem"}</span>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-6 w-6">
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover imagem?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Se ela estiver em uso por alguma oferta, a remoção falhará.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove(a)}>Remover</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

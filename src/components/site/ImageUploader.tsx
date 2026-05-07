import { useRef, useState } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  value: string;
  onChange: (url: string) => void;
  storeId: string | null;
  bucket?: string;
  label?: string;
  maxWidth?: number;
  aspect?: "square" | "video" | "auto";
  /** Allowed MIME types. Defaults to JPEG/PNG/WebP. */
  accept?: string[];
  /** Max file size in bytes. Defaults to 5 MB. */
  maxBytes?: number;
  /** Disable the uploader (e.g. when the store is not yet saved). */
  disabled?: boolean;
  /** Helper text under the label. */
  helperText?: string;
};

const DEFAULT_ACCEPT = ["image/jpeg", "image/png", "image/webp"];
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;

async function compress(file: File, maxWidth: number): Promise<Blob> {
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
      0.82
    );
  });
}

async function sanitizeSvg(file: File): Promise<Blob> {
  const text = await file.text();
  const clean = DOMPurify.sanitize(text, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ["script", "foreignObject"],
    FORBID_ATTR: ["onload", "onclick", "onerror"],
  });
  if (!clean.includes("<svg")) {
    throw new Error("Arquivo SVG inválido.");
  }
  return new Blob([clean], { type: "image/svg+xml" });
}

export function ImageUploader({
  value,
  onChange,
  storeId,
  bucket = "offer-images",
  label = "Imagem",
  maxWidth = 1200,
  aspect = "video",
  accept = DEFAULT_ACCEPT,
  maxBytes = DEFAULT_MAX_BYTES,
  disabled = false,
  helperText,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);

  const aspectClass =
    aspect === "square" ? "aspect-square" : aspect === "video" ? "aspect-video" : "";

  const pathFromUrl = (url: string) => {
    const marker = `/object/public/${bucket}/`;
    const idx = url.indexOf(marker);
    return idx >= 0 ? url.slice(idx + marker.length) : null;
  };

  const formatBytes = (b: number) =>
    b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(0)} MB` : `${Math.round(b / 1024)} KB`;

  const acceptLabel = accept
    .map((m) => m.split("/")[1].replace("svg+xml", "SVG").toUpperCase())
    .join(", ");

  const handleFile = async (file: File) => {
    if (disabled) return;
    if (!storeId) {
      toast.error("Cadastre sua loja antes de enviar imagens.");
      return;
    }
    if (!accept.includes(file.type)) {
      toast.error(`Formato inválido. Use ${acceptLabel}.`);
      return;
    }
    if (file.size > maxBytes) {
      toast.error(`Arquivo muito grande (máx. ${formatBytes(maxBytes)}).`);
      return;
    }
    setBusy(true);
    try {
      let blob: Blob;
      let ext: string;
      let contentType: string;

      if (file.type === "image/svg+xml") {
        blob = await sanitizeSvg(file);
        ext = "svg";
        contentType = "image/svg+xml";
      } else if (file.type === "image/png" && !accept.includes("image/jpeg")) {
        // Logo PNG: keep transparency, no compression
        blob = file;
        ext = "png";
        contentType = "image/png";
      } else {
        blob = await compress(file, maxWidth);
        ext = "webp";
        contentType = "image/webp";
      }

      const path = `${storeId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, blob, { contentType, upsert: false });
      if (error) throw error;
      // delete old
      const oldPath = value ? pathFromUrl(value) : null;
      if (oldPath) {
        await supabase.storage.from(bucket).remove([oldPath]).catch(() => {});
      }
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Imagem enviada com sucesso.");
    } catch (e: any) {
      toast.error(e.message ?? "Falha no upload.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    const path = value ? pathFromUrl(value) : null;
    if (path) await supabase.storage.from(bucket).remove([path]).catch(() => {});
    onChange("");
  };

  const isDisabled = disabled || busy;

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept.join(",")}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />

      {value ? (
        <div className="flex items-start gap-3 rounded-md border p-3">
          <div className={`relative ${aspectClass} w-32 overflow-hidden rounded-md bg-muted`}>
            <img src={value} alt="Preview" className="h-full w-full object-contain" />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <p className="text-xs text-muted-foreground break-all">Imagem enviada</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => inputRef.current?.click()}
                disabled={isDisabled}
              >
                {busy ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Upload className="mr-1 h-3 w-3" />}
                Trocar
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={remove} disabled={isDisabled}>
                <X className="mr-1 h-3 w-3" /> Remover
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            if (isDisabled) return;
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            if (isDisabled) return;
            e.preventDefault();
            setDrag(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          className={`flex w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-8 text-sm transition-colors ${
            isDisabled
              ? "cursor-not-allowed border-muted-foreground/20 opacity-60"
              : drag
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
          }`}
          disabled={isDisabled}
        >
          {busy ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          )}
          <span className="font-medium">
            {busy
              ? "Enviando..."
              : disabled
                ? "Salve os dados antes de enviar a imagem"
                : "Arraste uma imagem ou clique para selecionar"}
          </span>
          <span className="text-xs text-muted-foreground">
            {acceptLabel} — até {formatBytes(maxBytes)}
          </span>
        </button>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCity } from "@/hooks/useCity";
import { SectionHeading } from "./SectionHeading";

export const GalleryGrid = () => {
  const { city } = useCity();
  const [imgs, setImgs] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data, count } = await supabase
        .from("offers")
        .select("image_url", { count: "exact" })
        .eq("status", "approved")
        .not("image_url", "is", null)
        .limit(30);
      const urls = (data ?? []).map((r: any) => r.image_url).filter(Boolean);
      setImgs(urls.slice(0, 5));
      setTotal(count ?? urls.length);
    })();
  }, [city?.city]);

  const extras = Math.max(0, total - imgs.length);

  return (
    <div>
      <SectionHeading
        title="Galeria de fotos"
        description="Veja um pouco do que espera por aqui."
        action={
          <a href="#ofertas" className="hidden md:inline-flex text-sm font-medium text-primary hover:underline">
            Ver mais fotos →
          </a>
        }
      />
      {imgs.length ? (
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {imgs.map((src, i) => (
            <button
              key={src + i}
              onClick={() => setOpen(i)}
              className={`relative overflow-hidden rounded-xl bg-muted aspect-square ${i === 0 ? "col-span-2 row-span-2 aspect-auto" : ""}`}
            >
              <img src={src} alt="" className="h-full w-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
            </button>
          ))}
          {extras > 0 && (
            <button
              onClick={() => setOpen(0)}
              className="relative overflow-hidden rounded-xl bg-primary text-primary-foreground grid place-items-center aspect-square"
            >
              <div className="text-center">
                <div className="text-xl font-bold">+{extras}</div>
                <div className="text-[10px] uppercase tracking-wider opacity-90">fotos</div>
              </div>
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl bg-card border border-border p-10 text-center text-muted-foreground text-sm">
          Nenhuma foto disponível ainda.
        </div>
      )}

      {open !== null && (
        <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-sm grid place-items-center p-4" onClick={() => setOpen(null)}>
          <button className="absolute top-5 right-5 h-10 w-10 rounded-full bg-white/10 grid place-items-center text-white" onClick={() => setOpen(null)} aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
          <img src={imgs[open]} alt="" className="max-h-[85vh] max-w-full rounded-2xl object-contain" />
        </div>
      )}
    </div>
  );
};

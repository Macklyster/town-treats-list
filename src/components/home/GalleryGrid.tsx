import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { supabase } from "@/integrations/supabase/client";
import { useCity } from "@/hooks/useCity";

export const GalleryGrid = () => {
  const { city } = useCity();
  const [imgs, setImgs] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      let q = supabase.from("offers").select("image_url", { count: "exact" }).eq("status", "approved").not("image_url", "is", null).limit(30);
      const { data, count } = await q;
      const urls = (data ?? []).map((r: any) => r.image_url).filter(Boolean);
      setImgs(urls.slice(0, 7));
      setTotal(count ?? urls.length);
    })();
  }, [city?.city]);

  if (!imgs.length) return null;
  const extras = Math.max(0, total - imgs.length);

  return (
    <section className="container py-16 md:py-20">
      <SectionHeading
        eyebrow="Galeria"
        title={<>Momentos <span className="aurora-gradient-text">reais</span> das lojas</>}
        description="Um recorte visual do que rola nas empresas parceiras."
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 [grid-auto-rows:180px]">
        {imgs.map((src, i) => (
          <motion.button
            key={src + i}
            type="button"
            onClick={() => setOpen(i)}
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className={`group relative overflow-hidden rounded-2xl aurora-glass ${
              i === 0 ? "md:col-span-2 md:row-span-2" : ""
            }`}
          >
            <img
              src={src}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
          </motion.button>
        ))}
        {extras > 0 && (
          <button
            className="relative overflow-hidden rounded-2xl aurora-gradient-violet grid place-items-center text-center p-4 aurora-ring"
            onClick={() => setOpen(0)}
          >
            <div>
              <div className="text-2xl font-bold">+{extras}</div>
              <div className="text-xs uppercase tracking-wider opacity-80 mt-1">fotos</div>
            </div>
          </button>
        )}
      </div>

      {open !== null && (
        <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-sm grid place-items-center p-4" onClick={() => setOpen(null)}>
          <button className="absolute top-5 right-5 h-10 w-10 rounded-full aurora-glass grid place-items-center" onClick={() => setOpen(null)} aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
          <img src={imgs[open]} alt="" className="max-h-[85vh] max-w-full rounded-2xl object-contain" />
        </div>
      )}
    </section>
  );
};

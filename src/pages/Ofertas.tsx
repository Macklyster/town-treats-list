import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { OfferCard } from "@/components/site/OfferCard";
import { fetchOffers, UIOffer, discountPct } from "@/lib/offers-api";
import { useCity } from "@/hooks/useCity";
import { categories } from "@/data/categories";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const types = [
  { v: "all", l: "Todos" },
  { v: "desconto", l: "Desconto" },
  { v: "cupom", l: "Cupom" },
  { v: "brinde", l: "Brinde" },
];

const sortOptions = [
  { v: "recent", l: "Mais recentes" },
  { v: "popular", l: "Mais populares" },
  { v: "lowest", l: "Menor preço" },
  { v: "discount", l: "Maior desconto" },
];

const Ofertas = () => {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const cat = params.get("categoria") ?? "all";
  const type = params.get("tipo") ?? "all";
  const sort = params.get("ordem") ?? "recent";

  const { city, openSelector } = useCity();
  const [all, setAll] = useState<UIOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!city) {
      setAll([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchOffers(city).then((o) => {
      setAll(o);
      setLoading(false);
    });
  }, [city?.city, city?.state]);

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (!v || v === "all") next.delete(k);
    else next.set(k, v);
    setParams(next, { replace: true });
  };

  const list = useMemo(() => {
    let l = all.filter((o) => {
      if (q && !`${o.title} ${o.description}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (cat !== "all" && o.category !== cat) return false;
      if (type !== "all" && o.type !== type) return false;
      return true;
    });
    if (sort === "popular") l = [...l].sort((a, b) => b.popularity - a.popularity);
    if (sort === "lowest") l = [...l].sort((a, b) => a.promoPrice - b.promoPrice);
    if (sort === "discount") l = [...l].sort((a, b) => discountPct(b) - discountPct(a));
    if (sort === "recent") l = [...l].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return l;
  }, [all, q, cat, type, sort]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-12">
        <header className="mb-10">
          <h1 className="text-display text-foreground md:text-[40px]">Ofertas</h1>
          <p className="mt-2 text-muted-foreground">
            {!city
              ? "Selecione uma cidade para ver ofertas."
              : loading
              ? "Carregando…"
              : `${list.length} oferta${list.length !== 1 ? "s" : ""} encontrada${list.length !== 1 ? "s" : ""} em ${city.city}.`}
          </p>
          {!city && (
            <button
              type="button"
              onClick={openSelector}
              className="mt-4 inline-flex items-center justify-center rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground shadow-pop hover:opacity-90"
            >
              Escolher cidade
            </button>
          )}
        </header>

        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="space-y-6 rounded-2xl border border-border bg-card p-5 shadow-soft lg:sticky lg:top-20 lg:self-start">
            <div>
              <Label htmlFor="q">Buscar</Label>
              <Input
                id="q"
                value={q}
                onChange={(e) => setParam("q", e.target.value)}
                placeholder="Palavra-chave"
                className="mt-2"
              />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={cat} onValueChange={(v) => setParam("categoria", v)}>
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setParam("tipo", v)}>
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {types.map((t) => (
                    <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="w-full" onClick={() => setParams({})}>
              Limpar filtros
            </Button>
          </aside>

          <div>
            <div className="mb-5 flex items-center justify-end">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Ordenar por</span>
                <Select value={sort} onValueChange={(v) => setParam("ordem", v)}>
                  <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((s) => (
                      <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!loading && list.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-16 text-center">
                <p className="text-lg font-medium text-foreground">Nenhuma oferta encontrada</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Tente ajustar os filtros ou limpar a busca.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((o) => (
                  <OfferCard key={o.id} offer={o} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Ofertas;

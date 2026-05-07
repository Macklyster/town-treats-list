import { useNavigate } from "react-router-dom";
import { MapPin, Search } from "lucide-react";
import { useState } from "react";
import { categories } from "@/data/categories";
import { Button } from "@/components/ui/button";
import { useCity } from "@/hooks/useCity";

export const HeroSearch = () => {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const { city, openSelector } = useCity();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!city) {
      openSelector();
      return;
    }
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    navigate(`/ofertas${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <section className="relative overflow-hidden gradient-hero text-primary-foreground">
      <div className="absolute inset-0 opacity-[0.07]" aria-hidden>
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-accent blur-3xl" />
        <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-accent blur-3xl" />
      </div>
      <div className="container relative py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full bg-primary-foreground/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider">
            Ofertas locais, escolhidas a dedo
          </span>
          <h1 className="mt-6 text-hero font-medium leading-[1.05] md:text-[56px]">
            As melhores ofertas da{" "}
            <span className="text-accent text-[#10100f]">sua cidade</span>{" "}
            num só lugar
          </h1>
          <p className="mt-5 text-lg opacity-85 md:text-xl">
            Descubra descontos, cupons e brindes em restaurantes, salões, lojas e muito mais.
            Economize apoiando o comércio do seu bairro.
          </p>

          <button
            type="button"
            onClick={openSelector}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground hover:border-accent"
          >
            <MapPin className="h-4 w-4" />
            {city
              ? <>Buscando em <strong>{city.city}{city.state ? ` · ${city.state}` : ""}</strong> · trocar</>
              : "Selecionar cidade"}
          </button>

          <form onSubmit={submit} className="mx-auto mt-10 flex max-w-2xl items-center gap-2 rounded-2xl bg-card p-2 shadow-pop">
            <div className="flex flex-1 items-center gap-2 px-3">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Busque por pizza, salão, tênis..."
                className="h-12 w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
                aria-label="Buscar ofertas"
              />
            </div>
            <Button type="submit" variant="accent" size="lg">Buscar</Button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="opacity-75">Populares:</span>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => navigate(`/ofertas?categoria=${c.slug}`)}
                className="rounded-full border border-primary-foreground/20 bg-primary-foreground/5 px-3 py-1 text-sm transition-colors hover:bg-accent hover:text-accent-foreground hover:border-accent"
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

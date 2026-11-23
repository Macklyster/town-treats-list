import { CategoryIcon } from "@/components/site/CategoryIcon";
import { useNavigate } from "@/lib/router-compat";
import { MapPin, Search, Plane } from "lucide-react";
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
    navigate(`/${params.toString() ? `?${params.toString()}` : ""}#ofertas`);
  };

  return (
    <section className="relative overflow-hidden gradient-hero text-primary-foreground">
      <div className="absolute inset-0 opacity-[0.07]" aria-hidden>
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-accent blur-3xl" />
        <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-accent blur-3xl" />
      </div>
      <div className="container relative py-10 md:py-14">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
          <div className="text-center md:text-left">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider">
              <Plane className="h-3.5 w-3.5" />
              Ofertas locais, que voam
            </span>
            <h1 className="mt-5 text-hero font-medium leading-[1.05] md:text-[48px] lg:text-[52px]">
              As melhores ofertas da{" "}
              <span className="inline-block rounded-xl bg-background px-3 py-0.5 text-[#0F0F0E] shadow-soft">
                sua cidade
              </span>{" "}
              num só lugar
            </h1>
            <p className="mt-4 text-base opacity-85 md:text-lg">
              Descubra descontos, cupons e brindes em restaurantes, salões, lojas e muito mais.
              Economize apoiando o comércio do seu bairro.
            </p>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex justify-center md:justify-end">
              <button
                type="button"
                onClick={openSelector}
                className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground hover:border-accent"
              >
                <MapPin className="h-4 w-4" />
                {city
                  ? <>Buscando em <strong>{city.city}{city.state ? ` · ${city.state}` : ""}</strong> · trocar</>
                  : "Selecionar cidade"}
              </button>
            </div>

            <form onSubmit={submit} className="flex items-center gap-2 rounded-2xl bg-card p-2 shadow-pop">
              <div className="flex flex-1 items-center gap-2 px-3">
                <Search className="h-5 w-5 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Busque por pizza, salão, tênis..."
                  className="h-12 w-full bg-transparent text-base text-foreground outline-hidden placeholder:text-muted-foreground"
                  aria-label="Buscar ofertas"
                />
              </div>
              <Button type="submit" variant="accent" size="lg">Buscar</Button>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-2 text-sm md:justify-start">
              <span className="opacity-75">Populares:</span>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => navigate(`/?categoria=${c.slug}#ofertas`)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary-foreground/20 bg-primary-foreground/5 px-3 py-1 text-sm transition-colors hover:bg-accent hover:text-accent-foreground hover:border-accent"
                >
                  <CategoryIcon slug={c.slug} className="h-3.5 w-3.5" />
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

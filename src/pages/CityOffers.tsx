import { useEffect, useMemo, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { OfferCard } from "@/components/site/OfferCard";
import { PageHero } from "@/components/site/PageHero";
import { EmptyState } from "@/components/site/EmptyState";
import { SEO } from "@/components/seo/SEO";
import { FaqSection, faqToJsonLd } from "@/components/site/FaqSection";
import { categories } from "@/data/categories";
import {
  fetchOffers,
  fetchAvailableCities,
  UIOffer,
} from "@/lib/offers-api";
import {
  matchCityFromSlug,
  citySlug as makeCitySlug,
  cityLabel,
  absoluteUrl,
  type CityLike,
} from "@/lib/slug";
import { MapPin, Sparkles, Tag } from "lucide-react";

const CityOffers = () => {
  const { cidadeSlug = "", categoriaSlug } = useParams();
  const [cities, setCities] = useState<CityLike[]>([]);
  const [resolved, setResolved] = useState<CityLike | null | undefined>(undefined);
  const [offers, setOffers] = useState<UIOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailableCities().then((list) => {
      setCities(list);
      setResolved(matchCityFromSlug(cidadeSlug, list));
    });
  }, [cidadeSlug]);

  useEffect(() => {
    if (!resolved) {
      if (resolved === null) setLoading(false);
      return;
    }
    setLoading(true);
    fetchOffers(resolved).then((o) => {
      setOffers(o);
      setLoading(false);
    });
  }, [resolved?.city, resolved?.state]);

  const category = useMemo(
    () => (categoriaSlug ? categories.find((c) => c.slug === categoriaSlug) : null),
    [categoriaSlug]
  );

  if (categoriaSlug && !category) return <Navigate to={`/ofertas/${cidadeSlug}`} replace />;
  if (resolved === null) return <Navigate to="/" replace />;

  const list = category ? offers.filter((o) => o.category === category.slug) : offers;
  const otherCategoriesPresent = categories.filter((c) =>
    offers.some((o) => o.category === c.slug)
  );

  const path = category
    ? `/ofertas/${cidadeSlug}/${category.slug}`
    : `/ofertas/${cidadeSlug}`;
  const cityName = resolved ? cityLabel(resolved) : "";
  const title = category
    ? `${category.name} em ${cityName} — Ofertas e Cupons | OfertasFly`
    : `Ofertas em ${cityName} — Cupons e Descontos | OfertasFly`;
  const description = category
    ? `${list.length} oferta${list.length !== 1 ? "s" : ""} de ${category.name.toLowerCase()} em ${cityName}. Descontos, cupons e brindes do comércio local.`
    : `Encontre as melhores ofertas, cupons e descontos em ${cityName}. ${list.length} oferta${list.length !== 1 ? "s" : ""} ativa${list.length !== 1 ? "s" : ""} do comércio local.`;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: cityName, item: absoluteUrl(`/ofertas/${cidadeSlug}`) },
      ...(category
        ? [{ "@type": "ListItem", position: 3, name: category.name, item: absoluteUrl(path) }]
        : []),
    ],
  };

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: list.slice(0, 20).map((o, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/oferta/${o.id}`),
      name: o.title,
    })),
  };

  const faqItems = [
    { q: `Como funcionam as ofertas em ${cityName}?`, a: `Nossas ofertas em ${cityName} são publicadas diretamente pelos lojistas locais. Você navega, escolhe a promoção e resgata o cupom na loja ou online.` },
    { q: "Os cupons são gratuitos?", a: "Sim. A maioria dos cupons e descontos é gratuita para o consumidor. O lojista paga apenas para divulgar nossa plataforma." },
    { q: "Como resgato um cupom?", a: "Basta clicar no botão 'Resgatar cupom' na página da oferta. Após a verificação, o cupom fica disponível em 'Meus Cupons' com instruções de uso." },
    { q: "As ofertas têm validade?", a: "Sim. Cada oferta exibe a data de validade. Cupons fora do prazo não podem ser resgatados, então aproveite enquanto duram." },
    { q: "Posso usar mais de um cupom por compra?", a: "Isso depende da política de cada loja. Recomendamos ler os termos da oferta ou consultar o atendente no momento da compra." },
  ];
  const faqLd = faqToJsonLd(faqItems);

  const crumbs = [
    { label: "Início", to: "/" },
    { label: cityName, to: `/ofertas/${cidadeSlug}` },
    ...(category ? [{ label: category.name }] : []),
  ];

  const heroAside = (
    <div className="grid grid-cols-2 gap-3 rounded-2xl bg-white/5 p-4 backdrop-blur md:min-w-[240px]">
      <div>
        <div className="text-xs uppercase tracking-wider text-[hsl(var(--hero-muted))]">Ofertas</div>
        <div className="mt-1 font-display text-2xl">{list.length}</div>
      </div>
      <div>
        <div className="text-xs uppercase tracking-wider text-[hsl(var(--hero-muted))]">Categorias</div>
        <div className="mt-1 font-display text-2xl">{otherCategoriesPresent.length || 1}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <SEO title={title} description={description} path={path} jsonLd={[breadcrumb, itemList, faqLd]} />
      <Header />
      <main className="container space-y-10 py-8 md:py-10">
        <PageHero
          eyebrow={
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3 w-3" /> {cityName}
            </span>
          }
          title={category ? `${category.name} em ${cityName}` : `Ofertas em ${cityName}`}
          subtitle={
            category
              ? `Veja as melhores ofertas de ${category.name.toLowerCase()} em ${cityName}: descontos, cupons e brindes de lojas locais.`
              : `Descubra cupons, descontos e promoções das lojas de ${cityName}. Economize apoiando o comércio do seu bairro.`
          }
          crumbs={crumbs}
          aside={heroAside}
        />

        {otherCategoriesPresent.length > 0 && (
          <div className="sticky top-[var(--header-h)] z-30 -mx-4 flex gap-2 overflow-x-auto bg-background/85 px-4 py-3 backdrop-blur md:mx-0 md:rounded-2xl md:border md:border-border md:bg-card md:px-4 md:shadow-soft">
            <Link
              to={`/ofertas/${cidadeSlug}`}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition ${
                !category
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary hover:text-primary"
              }`}
            >
              Todas
            </Link>
            {otherCategoriesPresent.map((c) => (
              <Link
                key={c.slug}
                to={`/ofertas/${cidadeSlug}/${c.slug}`}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition ${
                  category?.slug === c.slug
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-primary hover:text-primary"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-3xl bg-muted" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            icon={Tag}
            title="Nenhuma oferta encontrada"
            description={
              category
                ? `Ainda não temos ofertas de ${category.name.toLowerCase()} em ${cityName}. Volte em breve.`
                : `Ainda não temos ofertas em ${cityName}. Volte em breve.`
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((o) => (
              <OfferCard key={o.id} offer={o} />
            ))}
          </div>
        )}

        {cities.length > 1 && (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-card md:p-8">
            <div className="flex items-center gap-2 label-eyebrow text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Explore mais cidades
            </div>
            <h2 className="mt-2 font-display text-xl font-medium text-foreground md:text-2xl">
              Ofertas em outras cidades
            </h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {cities
                .filter((c) => makeCitySlug(c) !== cidadeSlug)
                .slice(0, 24)
                .map((c) => (
                  <Link
                    key={makeCitySlug(c)}
                    to={`/ofertas/${makeCitySlug(c)}`}
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground transition hover:border-primary hover:text-primary"
                  >
                    {cityLabel(c)}
                  </Link>
                ))}
            </div>
          </section>
        )}

        <FaqSection
          title={category ? `Dúvidas sobre ${category.name} em ${cityName}` : `Dúvidas sobre ofertas em ${cityName}`}
          items={faqItems}
        />
      </main>
      <Footer />
    </div>
  );
};

export default CityOffers;

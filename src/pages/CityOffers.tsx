import { useEffect, useMemo, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { OfferCard } from "@/components/site/OfferCard";
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
import { ChevronRight } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-background">
      <SEO title={title} description={description} path={path} jsonLd={[breadcrumb, itemList, faqLd]} />
      <Header />
      <main className="container py-10">
        <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-accent-strong">Início</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to={`/ofertas/${cidadeSlug}`} className="hover:text-accent-strong">{cityName}</Link>
          {category && (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-foreground">{category.name}</span>
            </>
          )}
        </nav>

        <header className="mb-8 max-w-3xl">
          <h1 className="text-display text-foreground md:text-[40px]">
            {category ? `${category.name} em ${cityName}` : `Ofertas em ${cityName}`}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {category
              ? `Veja as melhores ofertas de ${category.name.toLowerCase()} em ${cityName}: descontos, cupons e brindes de lojas locais.`
              : `Descubra cupons, descontos e promoções das lojas de ${cityName}. Economize apoiando o comércio do seu bairro.`}
          </p>
        </header>

        {otherCategoriesPresent.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <Link
              to={`/ofertas/${cidadeSlug}`}
              className={`rounded-full border px-3 py-1 text-sm ${!category ? "bg-accent text-accent-foreground border-accent" : "bg-card hover:bg-secondary"}`}
            >
              Todas
            </Link>
            {otherCategoriesPresent.map((c) => (
              <Link
                key={c.slug}
                to={`/ofertas/${cidadeSlug}/${c.slug}`}
                className={`rounded-full border px-3 py-1 text-sm ${category?.slug === c.slug ? "bg-accent text-accent-foreground border-accent" : "bg-card hover:bg-secondary"}`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}

        {loading ? (
          <p className="text-muted-foreground">Carregando…</p>
        ) : list.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-16 text-center">
            <p className="text-lg font-medium">Nenhuma oferta encontrada</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {category
                ? `Ainda não temos ofertas de ${category.name.toLowerCase()} em ${cityName}.`
                : `Ainda não temos ofertas em ${cityName}.`}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((o) => (
              <OfferCard key={o.id} offer={o} />
            ))}
          </div>
        )}

        {cities.length > 1 && (
          <section className="mt-16 border-t pt-10">
            <h2 className="text-xl font-semibold text-foreground">Ofertas em outras cidades</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {cities
                .filter((c) => makeCitySlug(c) !== cidadeSlug)
                .slice(0, 24)
                .map((c) => (
                  <Link
                    key={makeCitySlug(c)}
                    to={`/ofertas/${makeCitySlug(c)}`}
                    className="rounded-full border bg-card px-3 py-1 text-sm hover:bg-secondary"
                  >
                    {cityLabel(c)}
                  </Link>
                ))}
            </div>
          </section>
        )}

        <div className="mt-16">
          <FaqSection
            title={category ? `Dúvidas sobre ${category.name} em ${cityName}` : `Dúvidas sobre ofertas em ${cityName}`}
            items={faqItems}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CityOffers;

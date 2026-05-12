# SEO local por cidade/categoria

Objetivo: capturar buscas como "ofertas em Curitiba", "promoções de restaurantes em Florianópolis", "cupons beleza Joinville" criando páginas dedicadas, indexáveis e com sitemap.

## O que será criado

### 1. Rotas novas (React Router)
- `/ofertas/:cidadeSlug` → ex: `/ofertas/curitiba-pr`
- `/ofertas/:cidadeSlug/:categoriaSlug` → ex: `/ofertas/curitiba-pr/alimentacao`
- `/loja/:storeSlug` → página pública da loja (fortalece long-tail e link interno)

Cada rota usa o slug `cidade-uf` para URL limpa e única. Mantém-se compatível com `/?categoria=…#ofertas` existente (redirect 301 client-side opcional).

### 2. Componente `<SEO />` (react-helmet-async)
Centraliza `<title>`, `<meta description>`, canonical, OG/Twitter e JSON-LD por página. Aplicado em:
- Home (atualizar copy genérica)
- Página de cidade
- Página de cidade + categoria
- Página da oferta (`/oferta/:id`) — já existe, ganhar SEO
- Página da loja

Títulos seguem padrão (<60 chars):
- Cidade: `Ofertas em {Cidade}/{UF} — Cupons e Descontos | OfertasFly`
- Cidade+Cat: `{Categoria} em {Cidade}/{UF} — Ofertas e Cupons | OfertasFly`
- Oferta: `{Título} — {Loja} em {Cidade} | OfertasFly`
- Loja: `{Loja} — Ofertas em {Cidade}/{UF} | OfertasFly`

Descrições <160 chars, dinâmicas com nº de ofertas e categoria.

### 3. JSON-LD estruturado
- Home/Cidade: `WebSite` + `BreadcrumbList`
- Oferta: `Offer` (price, priceCurrency BRL, availability, validThrough, seller=LocalBusiness)
- Loja: `LocalBusiness` (name, address, telephone, image, areaServed)
- Listas: `ItemList` das ofertas

### 4. Conteúdo das páginas de cidade/categoria
- H1 único: "Ofertas em {Cidade}" / "{Categoria} em {Cidade}"
- Parágrafo introdutório curto e dinâmico (texto SEO leve)
- Grid de ofertas filtrado por cidade (e categoria)
- Links internos: chips das demais categorias da cidade, link para outras cidades disponíveis, link para lojas em destaque
- Breadcrumbs visíveis (Início › Cidade › Categoria)

### 5. Sitemap dinâmico
Edge function `sitemap` (resposta `application/xml`) gerando:
- `/`
- `/ofertas/{cidadeSlug}` para toda cidade com loja aprovada
- `/ofertas/{cidadeSlug}/{categoriaSlug}` para combinações com ≥1 oferta aprovada
- `/oferta/{id}` para todas as ofertas aprovadas e válidas
- `/loja/{slug}` para todas as lojas aprovadas
- `/anuncie`, `/termos-de-uso`, `/politica-de-privacidade`

Exposto em `https://ofertasfly.com.br/sitemap.xml` via rewrite no `public/_redirects` (ou link direto para a função). `lastmod` baseado em `updated_at`.

### 6. robots.txt
Atualizar para incluir `Sitemap: https://ofertasfly.com.br/sitemap.xml` e manter `Allow: /`.

### 7. Pré-renderização para indexação
Como o app é SPA Vite, o Googlebot indexa JS, mas para garantir snippet correto e cobertura ampla:
- Adicionar `react-helmet-async` (tags injetadas no head client-side — Google renderiza)
- Canonical absoluto em cada página
- Imagens com `alt` descritivo (cidade + categoria + título)
- `loading="lazy"` nos cards (já provável)

Pré-render estático fica fora do escopo desta etapa (Vite não suporta nativo); ganho principal vem de URLs únicas + sitemap + meta dinâmico.

## Arquivos afetados (resumo técnico)

- `package.json`: adiciona `react-helmet-async`
- `src/main.tsx`: envolve App com `HelmetProvider`
- `src/components/seo/SEO.tsx` (novo): componente reutilizável
- `src/lib/slug.ts` (novo): `citySlug({city,state})`, `parseCitySlug(slug)`
- `src/lib/offers-api.ts`: `fetchOffersByCitySlug`, `fetchCitiesWithOffers`, `fetchStoreBySlug`
- `src/pages/CityOffers.tsx` (novo): rota `/ofertas/:cidadeSlug` e `/ofertas/:cidadeSlug/:categoriaSlug`
- `src/pages/StorePage.tsx` (novo): rota `/loja/:storeSlug`
- `src/pages/Index.tsx`, `OfferDetail.tsx`: integrar `<SEO />` e JSON-LD
- `src/components/site/Footer.tsx`: adicionar bloco "Ofertas por cidade" com top cidades (links internos)
- `src/App.tsx`: registrar novas rotas
- `supabase/functions/sitemap/index.ts` (novo): gera XML, `verify_jwt = false`
- `supabase/config.toml`: bloco da função sitemap
- `public/robots.txt`: adicionar linha `Sitemap:`

## Fora do escopo (sugestões futuras)
- SSR/SSG real (migração para Next/Astro)
- Páginas de bairro
- Blog/conteúdo editorial por cidade
- Schema `Event` para ofertas com data específica
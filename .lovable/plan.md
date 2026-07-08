## Nova Home OfertasFly — "Aurora Tech"

Reconstrução completa da Home como plataforma viva (não landing page), com personalização por cidade/localização/interesses/histórico. Stack mantida (Vite + React, upgrade para React 19), Tailwind + shadcn + Framer Motion + Lucide.

### Direção visual — Aurora Tech

- **Paleta** (tokens HSL em `index.css`, semânticos):
  - `--background: #0a0a1a` (near-black indigo)
  - `--surface: #141432` (glass base)
  - `--primary: #4f46e5` (indigo elétrico)
  - `--accent: #22d3ee` (cyan aurora)
  - `--foreground: #f5f7ff`, `--muted-foreground: #8b93b8`
  - Gradientes: `--gradient-aurora: linear-gradient(135deg, #4f46e5 0%, #22d3ee 100%)`, `--gradient-glow: radial-gradient(circle, #4f46e566 0%, transparent 70%)`
  - Sombras: `--shadow-glow: 0 20px 60px -20px #4f46e580`, `--shadow-glass: 0 8px 32px 0 #00000040`
- **Tipografia**: `Space Grotesk` (display, h1–h3) + `Inter` (body) via `@fontsource`. Instalação: `bun add @fontsource/space-grotesk @fontsource/inter`, imports em `src/main.tsx`, `fontFamily` no `tailwind.config.ts`.
- **Efeitos**: glass (`backdrop-blur-xl bg-white/[0.03] border border-white/10`), aurora blobs animados no hero, hover-glow em cards, transições <300ms.

### Componentização (novos, sob `src/components/home/`)

```
HomeHeader.tsx          — sticky, glass, logo, SearchBar inteligente, city, favoritos, login
HomeHero.tsx            — 2 colunas, aurora bg animado, CTA duplo, card glass "empresa destaque"
FeaturedCompanies.tsx   — carousel Embla, CompanyCard (banner, logo, verificado, FlyScore, distância, status)
CompanyCard.tsx
OffersOfTheDay.tsx      — grid OfferCard (imagem, tag OFF, preço antigo/novo, CTA)
HappeningNow.tsx        — cards horizontais scroll: happy hour, eventos, shows, feiras
NearbyMap.tsx           — MapCard com pins customizados (react-leaflet já ausente → usar existente ou embed estático + CTA "Explorar mapa")
Recommended.tsx         — baseado em categoria/localização/histórico
FlyScoreSection.tsx     — educativa: 6 pilares em círculo, modal detalhado
ReviewsCarousel.tsx     — cards com avatar, fotos, estrelas
GalleryGrid.tsx         — grid + lightbox + "+28 fotos"
CTABanner.tsx           — gradiente aurora, headline, 2 CTAs
HomeFooter.tsx          — institucional, ajuda, redes, stores, LGPD
```

Utilitários: `Motion` wrappers com Framer Motion (fadeInUp, staggerChildren), `SkeletonHome` para loading.

### Backend (novas tabelas + RLS + GRANTs)

Migração SQL única:

- `public.user_interests(user_id, category_slug, weight, created_at)` — RLS: dono lê/grava.
- `public.events(id, store_id, city, state, kind, title, description, image_url, starts_at, ends_at, created_at)` — RLS: public read (approved), owner/admin write. `kind` enum: `happy_hour|show|feira|evento|promocao`.
- `public.user_view_history(user_id, entity_type, entity_id, city, viewed_at)` — RLS: dono lê/grava. Índice `(user_id, viewed_at desc)`.
- `public.company_flyscore(store_id pk, overall, pilares jsonb, updated_at)` — RLS: public read, admin write.

Todas com `GRANT SELECT/INSERT/UPDATE/DELETE` para `authenticated`, `GRANT ALL` para `service_role`, `GRANT SELECT` para `anon` onde public.

Admin CRUD de eventos em painel existente (aba nova em `AdminOfertasInvisiveis`-style).

### Personalização

- **Saudação**: bom dia/tarde/noite + nome do `profiles` se logado.
- **Cidade**: já existe (`useCity`).
- **Distância**: já existe (`useUserLocation` + `lib/geo`).
- **FlyScore**: leitura de `company_flyscore` com fallback calculado.
- **Recomendadas**: query pondera `user_interests` + proximidade + histórico recente.
- **Acontecendo Agora**: `events` where `now() between starts_at and ends_at` and `city = ?`.

### SEO & Performance

- `SEO` existente com JSON-LD `WebSite`, `Organization`, `ItemList` (empresas destaque), `FAQPage` (FlyScore).
- Imagens: `loading="lazy"`, `decoding="async"`, dimensões explícitas.
- Code splitting: seções pesadas (Mapa, Gallery lightbox) via `lazy()` do wrapper `lazyWithReload` existente em `App.tsx`.
- Skeletons imediatos para evitar CLS.

### Rota

Substitui `src/pages/Index.tsx` por composição das novas seções. Componentes antigos (`HeroSearch`, `FeaturedCarousel`, `CategoryGrid`, `HowItWorks`, `MerchantCTA`, `OffersSection`) permanecem intactos e usados em outras páginas.

### Ordem de implementação (1 iteração)

1. `bun add @fontsource/space-grotesk @fontsource/inter`; imports em `main.tsx`; tokens em `index.css`; `tailwind.config.ts` (fonts + gradients + glow).
2. Migração SQL (4 tabelas + RLS + GRANTs).
3. `types.ts` regenera automaticamente; APIs em `src/lib/`: `events-api.ts`, `interests-api.ts`, `history-api.ts`, `flyscore-api.ts`.
4. Componentes `src/components/home/*` + `SkeletonHome`.
5. Nova `src/pages/Index.tsx` compondo tudo.
6. Ajustes de acessibilidade (aria-labels, focus rings cyan) e responsividade (mobile-first breakpoints sm/md/lg/xl).

### O que NÃO muda

- Rotas existentes, auth, edge functions, painel lojista/admin (só ganha aba eventos), demais páginas públicas.
- Header global compartilhado — a Home usa `HomeHeader` próprio; outras páginas continuam com `Header` atual.

### Riscos

- React 19 upgrade pode exigir bump de `react-helmet-async` / `@types/react`; verifico após install e ajusto se necessário.
- Se não tiver dados de `events`/`flyscore` populados, seções exibem estado vazio elegante ("Em breve na sua cidade") ao invés de sumir.
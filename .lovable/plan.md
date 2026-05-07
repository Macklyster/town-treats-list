# Plano — Cores de texto + tipografia OfertasFly

## Diagnóstico

Hoje muitos títulos usam `text-primary` (indigo `#4338CA`) sobre o fundo cream. Pelo design system OfertasFly, **títulos = Charcoal** (`text-foreground`) e **indigo deve ser reservado a acentos, CTAs, links e estados ativos**. Além disso, vários títulos ainda usam `text-3xl font-bold` em vez dos novos tokens (`.text-hero`, `.text-display`, h1/h2 já dimensionados).

## Regras a aplicar

| Elemento | Cor | Tipografia |
|---|---|---|
| Hero (homepage, anuncie) | `text-foreground` (em cream) ou `text-primary-foreground` (em fundo gradiente) | `.text-hero` (40/500) |
| Título de seção (h1 página) | `text-foreground` | `.text-display` (32/500) ou `<h1>` (28/500) |
| Subtítulo de seção (h2) | `text-foreground` | `<h2>` (20/500) |
| Card/oferta título | `text-foreground` | h3/h4 já dimensionados |
| Body / descrição | `text-foreground` ou `text-muted-foreground` | `.text-body` (14/400/1.6) |
| Auxiliar / metadado | `text-muted-foreground` | `.text-body` ou 13px |
| Eyebrow / categoria / "EM ALTA" | `text-accent-strong` ou cor da categoria | `.text-caption` (12/500/caps) |
| Links de navegação | `text-foreground` (default), `text-accent-strong` (hover/ativo) | — |
| Preço grande (oferta) | `text-accent-strong` | manter `text-4xl font-bold` |
| Footer | `text-charcoal-foreground` | já correto |

**Indigo (`text-primary` / `text-accent` / `text-accent-strong`) só em:** CTAs, links, ícones decorativos, preço destacado, badges de eyebrow, estados hover/ativos.

## Arquivos a ajustar

1. **`src/pages/Index.tsx`** — `text-3xl font-bold text-primary` → `text-display text-foreground` (3 ocorrências). Trocar `text-lg font-semibold text-primary` (estados vazios) por `text-foreground` h2.

2. **`src/pages/Anuncie.tsx`** — 10 ocorrências de `text-primary` em h2/h3/preço/lista → trocar para `text-foreground`. Manter `text-accent-strong` nos `<Check>` e badge "Mais popular". Hero já usa `text-primary-foreground` (correto).

3. **`src/pages/OfferDetail.tsx`** — 8 ocorrências de `text-primary` em h1/h2/h3 e "sobre a loja" → `text-foreground`. Manter `text-accent-strong` no eyebrow categoria, preço e ícones MapPin/Phone/Instagram.

4. **`src/pages/PainelLojista.tsx`** — 4 ocorrências em títulos/labels → `text-foreground`.

5. **`src/pages/Admin.tsx`** — h1 e cells de tabela (`text-primary`) → `text-foreground`. Heading da tabela `text-muted-foreground` ok.

6. **`src/pages/Ofertas.tsx`** / **`Assinatura.tsx`** / **`OfertaForm.tsx`** / **`NotFound.tsx`** / **`Termos`** / **`Política`** — trocar `text-primary` em títulos/headings para `text-foreground`, manter links como `text-accent-strong underline`.

7. **`src/components/site/Header.tsx`** — NavLinks usam `text-primary` como cor base; trocar para `text-foreground` (hover continua `text-accent-strong`).

8. **`src/components/site/OfferCard.tsx`** / **`FeaturedCarousel.tsx`** / **`CategoryGrid.tsx`** / **`HowItWorks.tsx`** / **`MerchantCTA.tsx`** / **`CityBar.tsx`** / **`CitySelector.tsx`** — títulos `text-primary` → `text-foreground`. Eyebrows/categorias mantêm `text-accent-strong` ou cor de categoria via `categoryTheme`.

9. **Tipografia (apenas onde for ganho claro):**
   - Heros (Index `HeroSearch`, Anuncie) → adicionar classe `text-hero` e remover `text-4xl/5xl font-bold` redundante.
   - Títulos de seção principal ("Ofertas em destaque", "Como funciona", "Planos…") → `text-display` em vez de `text-3xl font-bold`.
   - Descrições em parágrafos longos → `text-body` (mantém `text-muted-foreground` para cor).
   - Eyebrows (categoria/uppercase) → `text-caption` ou `label-eyebrow`.

## Fora de escopo

- Sem mudanças em backend, rotas, hooks, lógica.
- Sem mudanças em `src/components/ui/**` (shadcn).
- Sem alteração nos tokens de cor — só uso correto.
- Footer e logo permanecem como estão.

## Resultado esperado

- Títulos em charcoal sobre cream (legibilidade superior, identidade Ofertasfly).
- Indigo passa a "respirar" — usado só onde precisa chamar atenção (CTAs, preços, links, hover).
- Escala tipográfica unificada via classes utilitárias já criadas (`.text-hero`, `.text-display`, `.text-body`, `.text-caption`).

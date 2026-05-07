# Aplicação completa do Design System Ofertafly

Mantendo back-end, rotas e estrutura intactas — apenas tokens, cores e tipografia.

## Diagnóstico do que ficou faltando

Comparando o prompt enviado com o estado atual:

| Item do prompt | Status atual | Ação |
|---|---|---|
| Verde `#1A8C5A` **somente** em badge de % off | Badge usa `bg-accent` (índigo) | Trocar para token `discount` |
| Footer fundo charcoal `#0F0F0E` | Footer usa `bg-primary` (índigo) | Adicionar token `charcoal` e aplicar |
| Cards com fundo colorido por categoria | Todos usam `bg-card` branco | Adicionar tokens por categoria + utilitários |
| Badge "Em alta" vermelho | Não existe | Token `hot` + utilitário (sem mudar lógica) |
| Badge "Ao vivo" com ponto pulsante | Não existe | Componente visual reutilizável + animação |
| Pill de localização no header (cream/borda) | Header não tem | **Fora de escopo** (mexeria em estrutura) |
| Wordmark "Oferta" charcoal + "fly" índigo | Logo é imagem | **Fora de escopo** (logo é asset) |
| Tagline "promoções que voam" | N/A | Fora de escopo |

## Mudanças propostas (somente design)

### 1. `src/index.css` — adicionar tokens faltantes

```css
--charcoal: 60 4% 6%;          /* #0F0F0E */
--charcoal-foreground: 0 0% 100%;
--hot: 0 100% 62%;             /* #FF3B3B "Em alta" */
--hot-foreground: 0 0% 100%;

/* Cores de categoria (fundo + badge bg + badge text) */
--cat-food-bg: 220 100% 97%;       --cat-food-badge: 214 95% 93%;     --cat-food-text: 224 64% 33%;
--cat-beauty-bg: 270 100% 98%;     --cat-beauty-badge: 252 100% 95%;  --cat-beauty-text: 263 69% 35%;
--cat-health-bg: 138 76% 97%;      --cat-health-badge: 141 84% 93%;   --cat-health-text: 142 71% 25%;
--cat-fashion-bg: 295 100% 98%;    --cat-fashion-badge: 291 100% 95%; --cat-fashion-text: 301 64% 27%;
--cat-pet-bg: 355 100% 97%;        --cat-pet-badge: 351 100% 94%;     --cat-pet-text: 348 83% 35%;
--cat-service-bg: 204 100% 97%;    --cat-service-badge: 204 100% 94%; --cat-service-text: 199 84% 27%;
```

Adicionar `@keyframes pulse-live` (já tem `pulse-dot`, manter um único nome) e classe `.dot-live`.

### 2. `tailwind.config.ts`

Registrar:
- `charcoal: { DEFAULT, foreground }`
- `hot: { DEFAULT, foreground }`
- Manter `discount` já criado.

### 3. Componentes — apenas trocas de classes

- **`OfferCard.tsx`**: badge `-{pct}%` passa de `bg-accent text-accent-foreground` para `bg-discount text-discount-foreground`. Preço promocional permanece `text-accent-strong` (índigo, conforme spec).
- **`FeaturedCarousel.tsx`**: badge `-{pct}% OFF` → `bg-discount text-discount-foreground`.
- **`Footer.tsx`**: trocar `bg-primary text-primary-foreground` por `bg-charcoal text-charcoal-foreground`. Hovers de link permanecem `hover:text-accent` (índigo).
- **`HeroSearch.tsx`**: manter `gradient-hero` (índigo) — combina com a identidade. Badge superior permanece índigo.
- **`MerchantCTA.tsx`**: igual, mantém gradient índigo.
- **`Header.tsx` / `CityBar.tsx`**: já usam tokens corretos; sem alterações.

### 4. Suporte opcional para cores por categoria

Adicionar helper em `src/lib/utils.ts` (ou novo `src/lib/category-theme.ts`):

```ts
export const categoryTheme: Record<string, { bg: string; badgeBg: string; badgeText: string }> = {
  food:    { bg: "bg-[hsl(var(--cat-food-bg))]",    badgeBg: "bg-[hsl(var(--cat-food-badge))]",    badgeText: "text-[hsl(var(--cat-food-text))]" },
  beauty:  { ... }, health: { ... }, fashion: { ... }, pet: { ... }, service: { ... },
};
```

Como os cards atuais usam imagem (não emoji), o fundo colorido por categoria é aplicado:
- Como **fallback** quando não há imagem (área da imagem usa `bg-[var]` da categoria).
- No **badge da loja/categoria** dentro do card (eyebrow text).

Sem alterar a estrutura/markup do card além de adicionar essas classes condicionais.

### 5. Componente utilitário `LiveBadge` (opcional, não plugado em nenhuma página agora)

Criar `src/components/site/LiveBadge.tsx` com pill índigo claro + ponto verde pulsante, pronto para uso futuro. Não inserir em páginas para não mexer em estrutura.

## Fora de escopo (confirmado)

- Não alterar layout do hero, navbar, footer (apenas cores).
- Não trocar logo (é arquivo de imagem em `src/assets`).
- Não adicionar/remover seções, rotas ou componentes de página.
- Não mexer em back-end, edge functions, schema, hooks ou lógica.

## Resultado esperado

- Verde aparece **exclusivamente** em badges de desconto.
- Footer fica charcoal `#0F0F0E`.
- Tokens de categoria disponíveis para cards (aplicados onde fizer sentido sem mudar markup).
- Tipografia Syne/DM Sans (já feita) + tokens consistentes em todo o app.

## Objetivo
Reduzir o espaço vertical entre o menu principal e o primeiro conteúdo da home, e reorganizar o hero em duas colunas no desktop (mantendo lista única empilhada no mobile).

## O que vou alterar
Arquivo único: `src/components/site/HeroSearch.tsx`.

### 1. Reduzir o padding vertical
- Hoje o hero usa `py-20 md:py-28` (gera muito espaço logo abaixo do header).
- Passa para algo como `py-10 md:py-14`, mantendo respiro mas removendo o "buraco" no topo.

### 2. Layout em duas colunas (desktop) / lista (mobile)

```text
Mobile (atual, empilhado)        Desktop (md+)
┌─────────────────────┐          ┌──────────────┬──────────────┐
│  Badge              │          │ Badge        │ Form busca   │
│  Título             │          │ Título       │ Tags         │
│  Descrição          │          │ Descrição    │ populares    │
│  Botão cidade       │          │ Botão cidade │              │
│  Form busca         │          │              │              │
│  Tags populares     │          │              │              │
└─────────────────────┘          └──────────────┴──────────────┘
```

- Container interno deixa de usar `max-w-3xl text-center` e passa para um `grid md:grid-cols-2 gap-10 items-center`, com largura maior (ex.: `max-w-6xl`).
- **Coluna esquerda (texto):** badge, título, descrição e botão de cidade. Alinhamento à esquerda no desktop, centralizado no mobile.
- **Coluna direita (ações):** formulário de busca + bloco de tags populares ("Populares: Alimentação, Beleza & Saúde, Lojas & Moda").
- No mobile (abaixo de `md`), tudo volta a empilhar em coluna única na ordem natural: badge → título → descrição → cidade → busca → tags. Padrão de lista mantido.

### 3. Ajustes visuais para o novo layout
- Título: continua grande, mas com alinhamento responsivo (`text-center md:text-left`).
- Botão de cidade e tags populares: mesmo tratamento (centralizados no mobile, alinhados à esquerda no desktop).
- Form de busca passa a ocupar largura total da coluna direita, sem o `max-w-2xl mx-auto` antigo.
- Espaçamentos internos (`mt-6`, `mt-10` etc.) reduzidos para combinar com o novo padding.

## Fora do escopo
- Não mexer no `Header`, `CityBar`, banner rotativo (`FeaturedCarousel`) ou demais seções.
- Sem mudanças de regra de negócio, busca ou tracking.

## Resultado esperado
- Menos espaço vazio entre o menu e o conteúdo do hero.
- Desktop com hero mais "horizontal" e dinâmico em duas colunas.
- Mobile mantém o padrão de lista única, sem regressões.
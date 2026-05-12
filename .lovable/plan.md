## Plano Grátis (Freemium) — 1 oferta/mês

### Objetivo
Permitir que qualquer lojista cadastre a loja e publique **1 oferta por mês** sem pagar. A cada mês civil o contador zera e ele pode publicar outra. Planos pagos (Básico/Destaque/Plus) continuam para quem quer mais ofertas, destaque, relâmpago etc.

### Regras do plano grátis
- Sem checkout, sem cartão.
- 1 oferta criada por **mês civil** (ex.: dezembro/2026). Conta a partir do `created_at` da oferta.
- A oferta criada continua visível normalmente até a data `valid_until` ou até o lojista despublicar (mesmo comportamento atual).
- Sem destaque (`featured_slots = 0`), sem relâmpago, sem dashboard de Inteligência (mantém regras atuais).
- Loja precisa estar `approved = true` (igual hoje) para a oferta aparecer no site.

### Mudanças no banco
Adicionar plano `gratis` em `plans`:
- `slug='gratis'`, `name='Grátis'`, `price_cents=0`, `max_offers=1`, `featured_slots=0`, `sort_order=0`, `active=true`, `features=[]`.
Sem novas colunas, sem novas tabelas.

### Mudanças no app

**`src/data/plans.ts`**
- Adicionar item `gratis` no topo do `PLAN_CATALOG`: nome "Grátis", `priceCents: 0`, period vazio, ícone `Gift`, features: "1 oferta por mês", "Página da loja", "Aparece em buscas e categorias", "Sem cartão de crédito".

**`src/hooks/useSubscription.tsx`**
- Carregar também o plano `gratis` (consulta paralela `plans` por slug).
- Calcular `monthlyOfferCount`: contagem de ofertas da loja com `created_at >= início do mês corrente`.
- Quando não houver assinatura ativa, expor um "subscription virtual" do plano grátis: `effectivePlan = paidPlan ?? freePlan`, `isActive = true`, `isFree = !paidActive`, `offerCount = isFree ? monthlyOfferCount : totalOfferCount`, `maxOffers = effectivePlan.max_offers`, `canCreateOffer = offerCount < maxOffers`, `canFeature = !isFree && featuredCount < featuredSlots`.

**`src/pages/OfertaForm.tsx`**
- Usar `sub.canCreateOffer` para o gating (já existe). Mensagens passam a mostrar "Limite do plano Grátis: 1 oferta por mês. Faça upgrade para publicar mais." quando `isFree` e estourou.
- Bloqueio "sem plano ativo" desaparece (todo lojista tem o grátis por padrão).

**`src/pages/PainelLojista.tsx`**
- Trocar o alerta "Assine um plano para publicar suas ofertas" por um banner informativo do Grátis: "Você está no plano Grátis — 1 oferta por mês. Veja os planos pagos para destaque e mais ofertas." (botão "Ver planos").
- "Total de ofertas: X / Y" mostra "X / 1 este mês" quando `isFree`.

**`src/pages/Anuncie.tsx` e `src/pages/Assinatura.tsx`**
- Mostrar o plano Grátis como primeiro card. CTA do card grátis = "Começar grátis" → leva para `/painel-lojista/loja` (sem checkout).
- Cards pagos seguem com checkout Stripe.

**`src/components/site/MerchantCTA.tsx`**
- Trocar "Anuncie sua loja" para algo como "Comece grátis — 1 oferta por mês".

### Fora de escopo
- Avisos por e-mail "seu mês reseta amanhã".
- Upgrade flow com prorrateio.
- Trocar regra para "1 oferta ativa simultânea" (a regra acordada é por mês civil).
- Migração de assinaturas existentes (continuam intactas).

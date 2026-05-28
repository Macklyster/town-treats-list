# 2 meses grátis em planos pagos

Oferecer **60 dias grátis** (≈ 2 meses) em qualquer plano pago da página `/assinatura`, aplicando o trial via Stripe e usando copy/UX de conversão consagrados (urgência, ancoragem de valor, redução de risco, prova social, garantia de cancelamento).

## Regra de elegibilidade

Para evitar abuso (mesmo lojista resgatando o trial várias vezes) e manter a oferta crível:

- **Elegível**: lojista cuja loja **nunca teve uma subscription paga** (`active`/`trialing`/`past_due`/`canceled` em qualquer plano pago anterior). Ou seja, primeira assinatura paga da loja.
- **Não elegível**: quem já assinou um plano pago antes (mesmo que tenha cancelado), e quem está apenas trocando entre planos pagos (upgrade/downgrade continua com proration normal, sem novo trial).

## Mudanças

### 1. Backend — `supabase/functions/create-checkout/index.ts`

- Consultar `subscriptions` da loja: se **não existir nenhuma** linha com `plan_id` de plano pago (price > 0), adicionar ao `stripe.checkout.sessions.create`:
  ```ts
  subscription_data: {
    trial_period_days: 60,
    trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
    metadata: { ... }
  }
  ```
- Coletar cartão durante o trial (`payment_method_collection: "always"`) para cobrança automática ao fim dos 60 dias.
- Retornar no response um flag `trial_applied: boolean` (útil para toast/analytics no front).

### 2. Frontend — `src/pages/Assinatura.tsx`

- Calcular `isTrialEligible` no client (mesma regra: sem `sub` ativo nem histórico de plano pago — `sub === null` é suficiente para o caso atual já que só guardamos a última).
- Em cada card de plano pago, quando elegível:
  - **Faixa de destaque** no topo do card: "🎁 2 MESES GRÁTIS" (cor `accent`, contraste alto).
  - **Ancoragem de preço**: mostrar preço riscado dos 2 primeiros meses + "Depois R$ X/mês".
  - **Microcopy de redução de risco** abaixo do botão: "Sem cobrança nos primeiros 60 dias · Cancele quando quiser · Sem multa".
  - **CTA**: trocar "Assinar" por **"Começar 2 meses grátis"** (mantém "Mudar para este plano" quando já paid_active).
- **Banner topo** (só quando elegível e sem assinatura ativa): bloco `gradient-hero` curto com:
  - Headline: "Teste qualquer plano pago por 2 meses, por nossa conta."
  - Subhead: "Sem cobrança hoje. Cancele a qualquer momento dentro do período de teste e não pague nada."
  - Selo de garantia ("Cancele em 1 clique") + ícone Shield.
- Toast pós-checkout: quando `?success=1` e trial foi aplicado, mensagem "Seus 2 meses grátis começaram! Aproveite todos os recursos."

### 3. Plano Grátis

- Permanece como está (não recebe a faixa de trial — a faixa só aparece em planos com `priceCents > 0`).

### 4. Página `/anuncie` (incluir no escopo)

- Incluir agora;

## Boas práticas de marketing aplicadas

- **Risk reversal**: "sem cobrança hoje" + "cancele quando quiser" reduz fricção da decisão.
- **Ancoragem**: mostrar preço cheio riscado durante o trial reforça percepção de economia.
- **Especificidade**: "2 meses" / "60 dias" converte mais que "trial gratuito".
- **Escassez controlada**: oferta apenas para primeira assinatura (legítima, não falsa urgência).
- **Clareza pós-trial**: deixar explícito quando e quanto será cobrado evita chargeback e cancelamento por surpresa.

## Arquivos tocados

- `supabase/functions/create-checkout/index.ts` (lógica trial)
- `src/pages/Assinatura.tsx` (UI, copy, banner, badge, CTA)
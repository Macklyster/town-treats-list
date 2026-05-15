## Problema

Hoje, quando o lojista já tem assinatura ativa e clica em "Assinar" outro plano, o `create-checkout` bloqueia (HTTP 400: "Loja já possui assinatura ativa") e o frontend redireciona para o portal Stripe — onde só aparece a opção de cancelar, não de trocar de plano.

## Objetivo

Permitir trocar de plano (upgrade/downgrade) com 1 clique no card do novo plano, sem passar pelo cancelamento.

## Mudanças

### 1. Backend — nova edge function `change-subscription-plan`
Recebe `{ store_id, plan_id }`, valida ownership, busca a assinatura ativa atual e o `stripe_subscription_id`. Usa a Stripe API:

```
stripe.subscriptions.update(subId, {
  items: [{ id: <current_item_id>, price: <new_price_id> }],
  proration_behavior: "create_prorations",
  cancel_at_period_end: false,
  metadata: { store_id, plan_id }
})
```

- Se o plano novo não tiver `stripe_price_id` cadastrado, cria um price on-the-fly (igual `create-checkout` faz para `price_data`) ou retorna erro pedindo para o admin configurar.
- Retorna `{ ok: true }`. O `stripe-webhook` (já existente) atualiza a tabela `subscriptions` quando recebe `customer.subscription.updated`.
- Se a assinatura estava com `cancel_at_period_end=true`, limpa a flag (reativa).

Registrar em `supabase/config.toml` com `verify_jwt = false` (validação JWT feita em código, padrão do projeto).

### 2. Frontend — `src/pages/Assinatura.tsx`
- Remover o tratamento "se erro contém 'assinatura ativa', abrir portal".
- Em `subscribe(planId)`: se já existe `sub` ativa **e o plano é diferente do atual**, chamar `change-subscription-plan` em vez de `create-checkout`. Mostrar `AlertDialog` de confirmação ("Alterar do plano X para Y. A cobrança será ajustada proporcionalmente."). Em sucesso, toast e `load()`.
- Se não há assinatura ativa, manter fluxo `create-checkout` atual.
- Texto do botão muda conforme contexto: "Assinar" | "Mudar para este plano" | "Plano atual".

### 3. `create-checkout` — manter o bloqueio (continua correto para evitar duplicar assinatura via checkout), apenas o frontend deixa de chamá-lo nesse caso.

## Arquivos

- **Criar**: `supabase/functions/change-subscription-plan/index.ts`
- **Editar**: `supabase/config.toml` (registro da function), `src/pages/Assinatura.tsx` (nova lógica subscribe + dialog de confirmação)

## Pontos de atenção / decisões

1. **Proration**: vou usar `create_prorations` (padrão Stripe) — cobra/credita a diferença proporcional. Confirma?
2. **Downgrade** (Plus → Pro, por exemplo): aplica imediatamente com proration. Alternativa seria agendar para fim do ciclo (`proration_behavior: "none"` + `billing_cycle_anchor: "unchanged"`). Vou com **imediato** salvo se preferir agendado.
3. Plano grátis no card já chama `navigate("/painel-lojista")` — não muda. Para "fazer downgrade ao grátis" o caminho continua sendo cancelar pelo portal.

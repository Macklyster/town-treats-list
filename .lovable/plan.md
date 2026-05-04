## Plano: Completar fluxo de assinatura

### 1. Hook `useSubscription(storeId)` — `src/hooks/useSubscription.tsx`
Retorna `{ subscription, plan, isActive, offerCount, canCreateOffer, canFeature, loading, refresh }`. Busca a sub mais recente da loja com join em `plans` e conta ofertas existentes. Inscreve em realtime na tabela `subscriptions` filtrando por `store_id` para refletir webhook automaticamente.

### 2. Gating no Painel/Formulários
- **`OfertaForm.tsx`**: ao montar, valida via `useSubscription`:
  - Sem sub ativa → bloqueia criação, mostra alerta com CTA "Assinar plano".
  - `offerCount >= plan.max_offers` (em criação, não edição) → bloqueia com mensagem de limite.
  - Toggle "Destaque" desabilitado se `plan.featured_slots === 0` ou já atingiu o limite de destaques ativos.
- **`PainelLojista.tsx`**: novo banner no topo quando sem sub ativa ("Assine para publicar suas ofertas") + badges mostrando `X / max_offers ofertas` e `Y / featured_slots destaques`.

### 3. `Assinatura.tsx` — UX
- Mostrar `current_period_end` formatada em pt-BR ("Renova em 04/06/2026").
- Após retornar com `?success=1`: polling a cada 2s por até 20s aguardando webhook atualizar a sub (substitui o `setTimeout` único).
- Inscrever realtime na sub para atualização imediata.
- Mostrar limites do plano atual (max_offers, featured_slots).

### 4. `create-checkout` edge function
- Antes de criar sessão, verificar se já existe `subscription` com `status in ('active','trialing')` para a `store_id` → retornar erro 400 "Loja já possui assinatura ativa, use o portal para alterar plano".
- Se `customer_id` existir em sub anterior dessa loja, reusar.

### 5. Webhook — robustez
- Tratar `invoice.payment_failed` marcando sub como `past_due`.
- Log estruturado para facilitar debug.

### 6. Documentação inline (README ou comentário em `Assinatura.tsx`)
Instruções para o lojista (admin do projeto) cadastrar o webhook no Stripe Dashboard caso ainda não esteja: endpoint `https://ougpesguavrqbeethbjl.supabase.co/functions/v1/stripe-webhook`, eventos `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_failed`.

### Arquivos
**Criar:** `src/hooks/useSubscription.tsx`
**Editar:** `src/pages/OfertaForm.tsx`, `src/pages/PainelLojista.tsx`, `src/pages/Assinatura.tsx`, `supabase/functions/create-checkout/index.ts`, `supabase/functions/stripe-webhook/index.ts`

### Fora do escopo (ações manuais do usuário)
- Cadastrar webhook no Stripe Dashboard e confirmar `STRIPE_WEBHOOK_SECRET` (já está nos secrets ✅, mas precisa bater com o do endpoint).
- Criar Products/Prices no Stripe e popular `plans.stripe_price_id` (opcional — já funciona com `price_data` inline).
- Testar com cartão `4242 4242 4242 4242`.
# Melhorias no fluxo de cancelamento de assinatura

## O que será feito

### 1. Banco de dados (migração)
- Adicionar colunas em `subscriptions`:
  - `cancel_at_period_end boolean default false`
  - `canceled_at timestamptz`
- Criar tabela `cancellation_reasons`:
  - `id`, `store_id`, `subscription_id`, `reason text`, `details text`, `created_at`
  - RLS: dono da loja pode inserir/ler; admin gerencia tudo

### 2. Webhook do Stripe (`stripe-webhook`)
- Persistir `cancel_at_period_end` e `canceled_at` no upsert da subscription.

### 3. Nova edge function `reactivate-subscription`
- Recebe JWT do usuário, valida dono da loja, chama `stripe.subscriptions.update(id, { cancel_at_period_end: false })`.

### 4. Página `/assinatura` (`src/pages/Assinatura.tsx`)
- Renomear botão "Gerenciar pagamento" → **"Gerenciar ou cancelar assinatura"**.
- Adicionar botão dedicado **"Cancelar plano"** abrindo `AlertDialog`:
  - Campo opcional de motivo (Select com razões pré-definidas + textarea).
  - Ao confirmar: salva motivo em `cancellation_reasons` e abre Stripe Billing Portal com `flow_data: { type: 'subscription_cancel', subscription_cancel: { subscription: <id> } }`.
- Atualizar `customer-portal` para aceitar parâmetro opcional `flow` e `subscription_id`.
- Banner amarelo quando `cancel_at_period_end = true`:
  > "Sua assinatura será cancelada em DD/MM/AAAA. [Reativar assinatura]"
- Botão **"Reativar assinatura"** chama `reactivate-subscription`.

### 5. Painel do lojista (`src/pages/PainelLojista.tsx`)
- Mesmo banner amarelo quando assinatura está marcada para cancelar.

### 6. Stripe Billing Portal
- Documentar que usuário deve configurar locale `pt-BR` no dashboard Stripe (não há API para forçar).

## Detalhes técnicos
- `useSubscription` já recarrega via realtime — apenas expor `cancel_at_period_end` no tipo.
- `customer-portal`: adicionar suporte a `flow_data` quando `flow === 'cancel'`.
- Razões pré-definidas: "Muito caro", "Não usei o suficiente", "Faltam recursos", "Mudando para outra solução", "Outro".
- E-mails transacionais: NÃO incluídos nesta etapa (requer setup de domínio de e-mail). Posso adicionar depois.

## Fora do escopo (sugerido para depois)
- E-mails de confirmação de cancelamento/reativação
- Opção de pausar plano
- Downgrade direto pelo app
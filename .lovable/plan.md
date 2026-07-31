## Objetivo

Permitir que o admin defina os dias grátis de teste, hoje fixos em 14 dias no código, com um padrão global editável em Configurações e a possibilidade de conceder um trial personalizado a cada lojista na aprovação (para negócios fechados pelo comercial). O site público continua funcionando igual, apenas passando a exibir o número configurado.

## Banco de dados

1. `app_settings`: novo campo `trial_default_days` (padrão 14, faixa 1–365).
2. `stores`: novos campos `trial_days_override` (inteiro, opcional) e `trial_granted_at` — usados quando o comercial negocia um período diferente.
3. Função de leitura pública (security definer) para o front obter `trial_default_days` sem expor o restante das configurações caso necessário (o `app_settings` já é lido publicamente hoje pelo hook de flash; reaproveitamos o mesmo padrão).

## Admin > Configurações

Novo card "Período de teste grátis":
- Campo "Dias grátis padrão" (1–365), integrado ao mesmo formulário/validação Zod e ao botão Salvar existentes em `AdminSettings.tsx`.
- Texto explicativo de que o valor vale para novas assinaturas mensais pagas via checkout.

## Admin > Lojas (aprovação)

- O botão "Aprovar" passa a abrir um diálogo com:
  - Campo "Dias grátis para esta loja" pré-preenchido com o padrão global (pode ser alterado ou deixado vazio para usar o padrão).
  - Seletor de plano (Destaque / Plus / nenhum).
  - Opção "Conceder assinatura de teste agora (sem Stripe)": ao marcar, cria/atualiza a assinatura da loja com status `trialing`, o plano escolhido e `current_period_end = agora + N dias`. Sem essa marcação, apenas grava o override, que será aplicado quando o lojista passar pelo checkout.
- Nova coluna/badge na tabela indicando o trial concedido (ex.: "Trial 30d até 30/08").
- "Suspender" continua como está.

## Checkout (Stripe)

- `supabase/functions/create-checkout/index.ts`: substituir o `trial_period_days: 14` fixo pela leitura de `stores.trial_days_override ?? app_settings.trial_default_days`, mantendo as regras atuais (só mensal, só plano pago, só primeira assinatura).
- A concessão manual sem Stripe cria a assinatura diretamente na tabela `subscriptions` (sem `stripe_subscription_id`); ao final do período o lojista é levado ao checkout normal.

## Front público

- `Assinatura.tsx` e `Anuncie.tsx` deixam de exibir "14 dias" hardcoded e passam a mostrar o número vindo das configurações (com fallback 14).

## Detalhes técnicos

- Novo hook `useTrialSettings` para ler o padrão global, no mesmo formato do `useFlashSettings`.
- Concessão manual feita por RPC security definer restrita a admin (`grant_store_trial(store_id, plan_slug, days)`), evitando gravação direta em `subscriptions` pelo cliente.
- Fim de trial manual tratado pelas checagens existentes de `current_period_end`/status; nenhum job novo é necessário.

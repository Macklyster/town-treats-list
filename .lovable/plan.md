
## Visão geral

Adicionar agendamento de ofertas para os planos **Destaque** e **Plus**, com parâmetros globais configuráveis pelo admin para evitar frustração (janelas de antecedência e SLA de aprovação), refletindo as regras no formulário do lojista, no FAQ da página `/anuncie` e nas páginas de Termos de Uso e Política de Privacidade.

## 1. Banco de dados (migration única)

**1.1. `app_settings` — novas colunas globais:**
- `scheduled_offer_min_lead_hours` int default `12` — antecedência mínima entre `now()` e `scheduled_start_at`.
- `scheduled_offer_max_lead_days` int default `30` — antecedência máxima permitida.
- `offer_approval_sla_hours` int default `24` — prazo prometido de análise pelo admin (exibido ao lojista).
- `offer_min_validity_hours` int default `6` — antecedência mínima entre `now()` e `valid_until` em ofertas não agendadas (evita aprovar oferta que vai expirar logo).

**1.2. `offers` — novas colunas para agendamento:**
- `is_scheduled` boolean default `false`
- `scheduled_start_at` timestamptz null
- `scheduled_end_at` timestamptz null (opcional; se nulo, expira por `valid_until`)
- `scheduled_published_at` timestamptz null (carimbado quando o cron publica)

**1.3. Trigger `validate_offer_schedule()` em `offers`** (BEFORE INSERT/UPDATE):
- Exige plano **Destaque** ou **Plus** ativo (via `subscriptions`+`plans.slug in ('destaque','plus')`) quando `is_scheduled = true`.
- Valida `scheduled_start_at > now() + min_lead_hours` e `<= now() + max_lead_days`.
- Se `scheduled_end_at` informado, valida `> scheduled_start_at` e `<= valid_until` (quando houver).
- Quando `is_scheduled=false` e `valid_until` informado, exige `valid_until >= now() + offer_min_validity_hours` (somente em INSERT ou ao mudar para `pending/approved`).
- Ao admin aprovar uma oferta agendada, mantém `status='approved'` mas a oferta só fica visível ao público a partir de `scheduled_start_at`.

**1.4. RLS pública de `offers` — atualizar policy `approved offers public read`:**
- Visível se `status='approved' AND (is_scheduled=false OR scheduled_start_at <= now()) AND (scheduled_end_at IS NULL OR scheduled_end_at > now())`.
- Donos da loja e admin continuam vendo tudo.

**1.5. Cron job (pg_cron + pg_net) — opcional/leve:** apenas para carimbar `scheduled_published_at` e disparar notificação push aos seguidores quando entra no ar (a visibilidade já é controlada pela RLS, não depende do cron).

## 2. Admin — `src/pages/admin/Configuracoes.tsx`

Nova seção **"Parâmetros de Ofertas"** com inputs numéricos:
- Antecedência mínima de agendamento (h)
- Antecedência máxima de agendamento (dias)
- SLA de aprovação (h)
- Validade mínima de ofertas não agendadas (h)

Salva em `app_settings` via update (admin RLS já permite).

## 3. Lojista — formulário de oferta (`src/pages/painel-lojista/OfertaForm.tsx` ou equivalente)

- Carregar `app_settings` + plano ativo da loja.
- Se plano = **Destaque** ou **Plus**: exibir toggle **"Agendar publicação"**.
  - Ao ativar: campos `scheduled_start_at` (datetime) e opcionalmente `scheduled_end_at`, com `min`/`max` calculados a partir dos settings.
  - Microcopy: *"Disponível para os planos Destaque e Plus. Envie com até X dias e no mínimo Y horas de antecedência. Análise em até Z horas."*
- Se plano básico: mostrar badge "Disponível em Destaque/Plus" com link para `/painel-lojista/assinatura`.
- Para qualquer oferta: validar `valid_until` ≥ `offer_min_validity_hours`, com mensagem clara.
- Validação Zod no client + erro do trigger no server.

## 4. FAQ — `src/pages/Anuncie.tsx`

Adicionar perguntas:
- **"Posso agendar minha oferta?"** — explica disponibilidade nos planos Destaque/Plus, janela mín/máx (lê de `app_settings`).
- **"Em quanto tempo minha oferta é aprovada?"** — SLA dinâmico.
- **"Minha oferta precisa ter validade mínima?"** — explica `offer_min_validity_hours`.

## 5. Termos de Uso e Política de Privacidade

Localizar/criar `src/pages/Termos.tsx` e `src/pages/Privacidade.tsx`. Adicionar/atualizar seção **"Publicação e Agendamento de Ofertas"**:
- Direito do admin de recusar/atrasar ofertas fora das janelas configuradas.
- SLA de análise é alvo, não garantia contratual.
- Ofertas agendadas só ficam públicas no horário previsto após aprovação.
- Privacidade: tratamento de timestamps e logs de aprovação.

Linkar no rodapé se ainda não estiver.

## 6. Aprovação no painel admin (`src/pages/admin/Ofertas.tsx`)

- Coluna/badge **"Agendada"** com `scheduled_start_at` formatado.
- Filtro "Apenas agendadas".
- Ordenação priorizando ofertas cujo `scheduled_start_at` está próximo (urgência).

## Detalhes técnicos

- Timezone: usar `America/Sao_Paulo` na UI (display) e `timestamptz` no banco.
- Reaproveitar `set_updated_at` trigger.
- Sem novas edge functions obrigatórias — opcional `publish-scheduled-offers` se quiser disparar push no momento exato (via pg_cron a cada 5 min).
- Nenhuma alteração em Stripe/checkout.

## Arquivos afetados

- Migration nova (1 arquivo)
- `src/pages/admin/Configuracoes.tsx`
- `src/pages/admin/Ofertas.tsx`
- Form de oferta do lojista (a confirmar caminho exato ao implementar)
- `src/pages/Anuncie.tsx`
- `src/pages/Termos.tsx` e `src/pages/Privacidade.tsx` (criar se não existirem) + link no `Footer`

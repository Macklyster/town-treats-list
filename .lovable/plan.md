# Varredura pré-lançamento OfertasFly — 27/06

Auditoria estruturada em 6 frentes. Cada item é uma verificação + correção sob demanda. Você aprova o plano e eu executo frente por frente, reportando achados e aplicando fixes.

## 1. Fluxo de assinatura & cobrança (alto risco)
- Conferir textos de trial (14 dias) em **todas** as telas: `/anuncie`, `/painel-lojista/assinatura`, e-mails, success/cancel URLs.
- Validar `change-subscription-plan`, `customer-portal`, `reactivate-subscription` e `stripe-webhook` end-to-end (status, `current_period_end`, `cancel_at_period_end`).
- Conferir que plano Grátis não tenta abrir checkout e que o gating (`useSubscription`) bate com `max_offers` / `featured_slots` reais.
- Checar consistência de preços entre `PLAN_CATALOG` (front) e tabela `plans` (banco).

## 2. Fluxos de oferta (core do produto)
- Criar / editar / aprovar / expirar nos 4 tipos: oferta padrão, coletiva, leilão, invisível.
- Agendamento (`is_scheduled`, `scheduled_start_at`) e flash (`is_flash`, `flash_ends_at`) — verificar contagem regressiva e expiração automática (`flash-expire`, `auto-renew-offers`, `group-offer-expire`).
- Limites por plano (Starter 3 / Destaque 10 / Plus ilimitado) realmente bloqueando.

## 3. Painel lojista & Admin
- Loop em todas as rotas `/painel-lojista/*` e `/admin` testando estados vazios, loading e erro.
- Dashboard de Inteligência: KPIs, heatmap, top ofertas com dados reais.
- Aprovação/rejeição de ofertas, lojas e reviews pelo admin.

## 4. Experiência pública (visitante)
- Home, `/ofertas/:cidade`, `/ofertas/:cidade/:categoria`, `/loja/:slug`, páginas públicas de coletiva/leilão/invisível.
- Seletor de cidade, busca, filtros, favoritos, share.
- SEO: títulos, descriptions, JSON-LD, sitemap, canonical, OG tags.

## 5. UI/UX & responsividade
- Varredura visual mobile (375px) e desktop em todas as páginas-chave.
- Textos desatualizados (trial, preços, benefícios, copy de CTA).
- Estados de loading, vazio e erro padronizados.
- PWA: manifest, ícones, install banner, service worker.

## 6. Backend & segurança
- Rodar `supabase--linter` para checar RLS, índices e advisories.
- Rodar `security--run_security_scan` para varredura completa.
- Conferir grants nas tabelas `public.*` e policies sensíveis (`subscriptions`, `stores`, `user_roles`).
- Logs das edge functions críticas (erros recentes).

## Entregáveis por frente
Para cada frente acima eu entrego:
1. Lista de achados (bug / UI desatualizada / risco).
2. Severidade (bloqueia lançamento / importante / cosmético).
3. Correção aplicada ou proposta com escopo claro.

## Como prefere executar?
Posso ir **frente por frente em ordem** (1→6, recomendado) ou **paralelo por prioridade** (assinatura + ofertas primeiro, resto depois). Diga "pode ir" para começar pela frente 1.

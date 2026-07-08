# Plano — FlyScore 100% funcional

Hoje o FlyScore existe apenas como **visual** na home (`FlyScoreSection.tsx`) com valores fixos (`4,8`, `98%`, `96/100`). A tabela `company_flyscore` (colunas: `overall`, `pilares jsonb`, `updated_at`) já existe e é lida por `home-api.ts`, mas **nunca é preenchida** e não há UI para o lojista/usuário alimentá-la.

Este plano cobre: (1) modelo de cálculo, (2) coleta de dados do lojista, (3) avaliação pelo usuário, (4) recomputo automático, (5) exibição real na home e na página da loja.

---

## 1. Modelo dos 6 pilares (0–100 cada, média = FlyScore)

| Pilar | Fonte de dados | Regra |
|---|---|---|
| **Avaliações** | `offer_reviews` aprovados da loja | `min(100, media_estrelas*20 * fator_volume)` onde `fator_volume = min(1, count/20)` |
| **Atualização** | `offers.updated_at` / `offers.created_at` | 100 se houve oferta nova/editada nos últimos 30d; decai linearmente até 0 aos 120d |
| **Resposta** | novo campo `store_response_stats` (avg_response_minutes de mensagens/reservas) | 100 ≤ 60min, 0 ≥ 24h; interpolação log |
| **Informações** | preenchimento de `stores` (nome, endereço, cidade/UF, telefone, whatsapp, logo, cover, horário, categorias) | % de campos obrigatórios + opcionais preenchidos |
| **Engajamento** | `coupons_redeemed` + `offer_views` + `favorites` últimos 30d | normalizado por percentil dentro da cidade |
| **Presença Digital** | `stores.instagram`, `stores.website`, nº de fotos em `offers` (>=3), `cover_url` presente | soma ponderada de checks |

Score final: `overall = round(avg(pilares))`. Persistido em `company_flyscore.pilares` como `{avaliacoes:88, atualizacao:95, resposta:72, informacoes:100, engajamento:64, presenca:90}`.

---

## 2. Painel do Lojista — o que precisa ganhar UI

**Página nova `/painel-lojista/flyscore`** (aba dentro do painel) mostrando:

- Gauge do overall + barra por pilar com **status atual, meta e ações sugeridas** ("Adicione foto de capa +8 pts", "Responda mensagens em <1h", "Peça avaliação a clientes").
- Link direto para a ação que aumenta cada pilar (ex.: pilar "Informações" → botão "Completar dados" que abre `LojaForm` já rolado para o campo faltante).

**Campos novos em `stores`** (migração):

- `opening_hours jsonb` (semana + horários)
- `website text`
- `categories text[]` (múltiplas categorias para melhor match)
- `response_time_target_minutes int` (compromisso do lojista, opcional)

**Editar Dados** ganha seção "Sobre a empresa" com os campos acima e uploader de **galeria de fotos** (bucket `offer-images` sob `{store_id}/gallery/*`).

---

## 3. Avaliação pelo usuário — deixar clara e sempre acessível

Já existem `ReviewForm`, `ReviewList`, `ReviewPromptDialog`, mas:

- O prompt só aparece após ações específicas — **adicionar CTA "Avaliar esta loja" visível em `StorePage`** e em `OfferDetail` para qualquer usuário autenticado que já viu/resgatou cupom.
- Permitir **avaliação por loja** (não só por oferta): criar tabela `store_reviews` (rating 1-5, comment, user_id, store_id, status). Manter `offer_reviews` para experiência de compra específica; agregar as duas no pilar Avaliações.
- E-mail/notificação automática 48h após resgate de cupom: "Como foi sua experiência na {loja}?".
- Moderação: reviews entram como `pending`, admin aprova em `/admin/reviews` (já existe `AdminReviews.tsx`, revisar fluxo).

---

## 4. Recomputo do FlyScore

**Edge function `recompute-flyscore`** (Deno):

- Input: `store_id` (recomputa 1) ou vazio (batch — todas as lojas aprovadas).
- Executa consultas SQL para cada pilar, calcula, faz `upsert` em `company_flyscore`.

**Gatilhos:**

1. **Trigger SQL** em `offer_reviews`, `store_reviews`, `offers`, `coupons_redeemed`, `favorites` → enfileira `store_id` para recomputo (tabela `flyscore_recompute_queue` + `pg_notify`).
2. **Cron pg** (`pg_cron`) roda `recompute-flyscore` de hora em hora processando a fila.
3. **Trigger em `stores` update** → recomputo imediato do pilar Informações/Presença.
4. Botão manual no painel do lojista "Atualizar meu FlyScore agora" (rate-limited: 1x/hora).

---

## 5. Exibir dados reais em vez de mock

- `FlyScoreSection` da home passa a receber `overallMedio` e `pilaresMedios` agregados de `company_flyscore` (média das lojas aprovadas). Criar RPC `get_flyscore_aggregate(city?)` para retornar em 1 chamada.
- `CompanyCard` já tem `flyscore` — remover o `Math.round(90 + name.length % 10)` de fallback quando existe valor real; mostrar "—" ou "Novo" quando ainda não há score.
- Nova página pública `/loja/{slug}/flyscore` com detalhamento por pilar (transparência para o usuário final).

---

## Ordem de execução sugerida

1. **Migração**: campos novos em `stores`, tabela `store_reviews`, `flyscore_recompute_queue`, `store_response_stats`.
2. **Edge function** `recompute-flyscore` + triggers + cron.
3. **UI Painel do Lojista**: aba FlyScore + edição dos campos novos em `LojaForm`.
4. **UI Avaliação**: CTA visível, formulário de `store_reviews`, notificação pós-cupom.
5. **Home/CompanyCard**: consumir dados reais, remover mocks do `FlyScoreSection`.
6. **Página pública `/loja/{slug}/flyscore`** com detalhamento.

---

## Escopo mínimo (MVP) se quiser dividir em etapas

- Etapa 1: pilares **Avaliações + Informações + Atualização** (3 dos 6) já dão score útil sem precisar de stats de resposta/engajamento.
- Etapa 2: adicionar **Presença Digital** (fácil, só checar campos).
- Etapa 3: **Engajamento + Resposta** (dependem de coleta de eventos e mensagens — mais complexo).

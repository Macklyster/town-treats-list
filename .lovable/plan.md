## Leilão de Oferta — Leilão Reverso (preço cai com o tempo)

Novo tipo de oferta exclusivo do plano **Plus**: o preço inicial cai automaticamente em intervalos definidos até atingir um mínimo. O lojista informa a **quantidade de itens disponíveis**; cada cliente "reserva" uma unidade ao preço corrente, e o leilão encerra quando todas as unidades forem reservadas (ou quando o tempo expirar).

---

### 1. Banco de dados (migração)

**Nova tabela `auction_offers`**:

- `store_id`, `title`, `description`, `image_url`, `category_slug`, `conditions`
- `starting_price`, `min_price`, `decrement_amount`, `decrement_interval_minutes`
- **`total_quantity` (int, >= 1)** — quantidade total de itens ofertados
- **`reserved_quantity` (int, default 0)** — contador de unidades já reservadas
- `starts_at`, `ends_at`
- `status`: enum `auction_status` = `pending | approved | sold_out | expired | rejected`
- `share_token`, timestamps

**Nova tabela `auction_reservations`** (uma linha por unidade reservada):
- `auction_id`, `user_id`, `reserved_price`, `reserved_at`, `whatsapp_clicked_at`
- Único por `(auction_id, user_id)` — cada usuário só reserva 1 unidade

**Trigger `validate_auction_offer`**: `min_price < starting_price`, `decrement_amount > 0`, `decrement_interval_minutes >= 5`, `total_quantity >= 1`, exige plano Plus ativo.

**Trigger `set_auction_window`**: ao virar `approved`, calcula `starts_at = now()` e `ends_at = starts_at + ceil((starting - min) / decrement) * interval`.

**RPC `auction_state(p_token text)`**: retorna oferta + preço corrente + segundos para próximo decremento + `reserved_quantity` + `total_quantity` + se o usuário atual já reservou.

**RPC `reserve_auction(p_token text)`** (SECURITY DEFINER):
- Exige login; `SELECT ... FOR UPDATE` na linha do leilão
- Bloqueia se `status != 'approved'`, se usuário já reservou, ou se `reserved_quantity >= total_quantity`
- Calcula preço corrente, insere em `auction_reservations`, incrementa `reserved_quantity`
- Se atingir `total_quantity`, marca `status = 'sold_out'`
- Retorna preço travado + whatsapp da loja

**RLS**: public read em `approved`/`sold_out`; owner/admin gerenciam; reservations visíveis ao próprio usuário, dono da loja e admin.

**Realtime**: adicionar `auction_offers` e `auction_reservations` à publicação.

**Edge function `auction-expire`** (cron 5 min): marca `expired` quando `now() > ends_at` e ainda restam unidades.

**`app_settings`**: `auction_max_active_per_store` (default 1).

---

### 2. Frontend — Painel do Lojista

- **`NewOfferDropdown.tsx`**: opção "Leilão de Oferta" com badge **Plus**.
- **Nova rota** `/painel-lojista/leilao/:id?` → **`LeilaoForm.tsx`**:
  - Campos básicos (título, descrição, imagem, categoria, condições)
  - **Quantidade de itens disponíveis** (input numérico, mín. 1)
  - Preço inicial, preço mínimo, decremento (R$), intervalo (min)
  - Pré-visualização: escada de preços hora a hora até o mínimo + tempo total estimado + linha "Quantidade ofertada: N unidades"
- **`PainelLojista.tsx`**: card "Seu leilão ativo" com preço atual, **"X de N reservados"**, ações Editar / Copiar link / WhatsApp / Encerrar / Excluir.

### 3. Frontend — Cliente

- **`/leilao/:token`** → **`LeilaoPublic.tsx`**:
  - Preço grande animado, contagem regressiva até o próximo decremento
  - **Indicador de estoque**: "X de N unidades disponíveis" + barra de progresso
  - Botão "Reservar 1 unidade por R$ X" (exige login)
  - Estado pós-reserva: preço travado + botão WhatsApp; botão desabilitado com "Você já reservou"
  - Estado `sold_out`: badge "Esgotado"
  - Realtime: assina `auction_offers` e `auction_reservations` para atualizar preço, contador e status ao vivo
- **`/leiloes`** → **`Leiloes.tsx`**: login obrigatório; landing explicativa para deslogado; logado vê leilões ativos das lojas seguidas + da cidade. Card mostra preço corrente, próximo decremento e **"X de N restantes"**.
- **`Header.tsx`**: novo item "Leilões".
- **`App.tsx`**: rotas `/leilao/:token`, `/leiloes`, `/painel-lojista/leilao/:id?`.

### 4. Catálogo de planos e Admin

- **`src/data/plans.ts`**: feature "Leilão de Oferta — preço cai com o tempo" no plano **Plus**.
- **`AdminLeiloes.tsx`** (nova aba em `Admin.tsx`): moderação aprovar/rejeitar/encerrar/excluir, com colunas de quantidade e reservas.

### 5. Helpers

- **`src/lib/auction-api.ts`**: `fetchAuctionByToken`, `fetchAuctionsForUser`, `reserveAuction`, `subscribeAuction`, `computeCurrentPrice(...)` puro para tick local.

---

### Regras de negócio

| Item | Valor |
|---|---|
| Plano exigido | Plus |
| Limite ativo por loja | 1 (configurável) |
| Quantidade mínima | 1 unidade |
| Decremento mínimo | R$ 1, intervalo mínimo 5 min |
| Reserva por usuário | 1 unidade por leilão |
| Encerramento | `sold_out` quando todas reservadas, ou `expired` no tempo limite |
| Login para reservar | Sim |

### Fora do escopo

- Pagamento online (combinação via WhatsApp)
- Reserva de múltiplas unidades por usuário
- Fila de espera / notificações de "preço caiu"

Confirma para eu implementar?

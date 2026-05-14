## Avaliações e fotos de clientes (prova social pós-resgate)

Adicionar sistema de avaliações com estrelas, comentário curto e fotos opcionais, disparado automaticamente algumas horas após o usuário interagir com uma oferta (clique em WhatsApp/telefone ou QR scan).

### Fluxo do usuário

1. Usuário clica em "Pegar Oferta no WhatsApp", "Ligar para a Loja" ou escaneia QR — eventos já registrados em `offer_events`.
2. Após **3 horas**, o sistema marca a interação como elegível para avaliação.
3. Na próxima visita ao site (ou via push notification), o usuário logado vê um card "Como foi sua experiência na {Loja}?" com:
  - Estrelas 1–5 (obrigatório)
  - Comentário curto até 280 caracteres (opcional)
  - Upload de até 3 fotos (opcional)
4. Usuário pode pular ("Não resgatei" / "Lembrar depois" / "Não mostrar mais").
5. Avaliação enviada → entra com `status = 'pending'` para moderação leve (auto-aprovada se sem fotos e sem palavras bloqueadas; caso contrário fila admin).
6. Avaliação aprovada aparece na página da oferta, na página da loja, e contribui para a nota média exibida nos cards.

### Onde aparece a prova social

- **OfferDetail** (`/oferta/:id`) — nova seção "Avaliações de clientes" com média, distribuição de estrelas, lista paginada com fotos em galeria.
- **OfferCard** — pequena linha com ⭐ 4.8 (23) ao lado do nome da loja quando houver ≥3 avaliações.
- **StorePage** — agregado de todas as ofertas da loja.
- **FeaturedCarousel** — selo "★ 4.9" se aplicável.

### Gatilho do prompt de avaliação

- Componente global `ReviewPromptDialog` montado no layout, consulta a cada login/visita uma RPC `pending_reviews_for_user()` que retorna interações elegíveis (≥3h, sem avaliação, sem skip permanente).
- Push notification opcional ("Conte como foi sua experiência na {Loja}") via edge function cron rodando a cada 30 min, respeitando `notification_preferences`.

### Estrutura técnica

**Novas tabelas**

- `offer_reviews`: `id`, `offer_id`, `store_id`, `user_id`, `rating` (1–5), `comment`, `status` (pending/approved/rejected), `rejection_reason`, `created_at`, `updated_at`. Constraint UNIQUE(offer_id, user_id).
- `offer_review_photos`: `id`, `review_id`, `image_url`, `sort_order`.
- `review_prompts`: `id`, `user_id`, `offer_id`, `triggered_by_event_id`, `eligible_at`, `dismissed_at`, `dismissed_permanently` (bool). Permite controlar "lembrar depois" vs "não mostrar mais".

**RLS**

- `offer_reviews`: leitura pública apenas de `status='approved'`; usuário lê/insere/atualiza próprias; lojista lê todas da sua loja; admin gerencia tudo.
- `offer_review_photos`: mesma lógica via join com review.
- `review_prompts`: usuário gerencia os próprios; admin lê tudo.

**Storage**

- Novo bucket público `review-photos` com RLS por `auth.uid()` na pasta.

**Funções/RPC**

- `pending_reviews_for_user()` — retorna prompts elegíveis (interação ≥3h atrás, sem review, não dismissed permanentemente, próximo lembrete vencido).
- `offer_rating_summary(offer_id)` — média + contagem por estrela.
- `store_rating_summary(store_id)` — agregado.
- Edge function `generate-review-prompts` (cron a cada 30 min) — varre `offer_events` das últimas 7 dias com event_type em (whatsapp_click, phone_click, qr_scan), idade ≥3h, e cria registros em `review_prompts` se ainda não existir.
- Edge function `notify-review-request` (cron diário) — envia push para prompts criados há ≥6h ainda não vistos.
- Trigger em `offer_reviews` para auto-aprovar quando: sem fotos, comentário vazio ou rating ≥4 sem palavras bloqueadas.

**Componentes novos**

- `src/components/site/ReviewPromptDialog.tsx` — modal global.
- `src/components/site/ReviewForm.tsx` — estrelas, textarea, upload (reusa `ImageUploader`).
- `src/components/site/ReviewList.tsx` — lista com paginação + lightbox simples.
- `src/components/site/RatingStars.tsx` — display reutilizável (read-only e interativo).
- `src/components/site/RatingSummary.tsx` — média + barras de distribuição.
- Admin: nova aba em `Admin.tsx` para moderar reviews `pending`.

**Alterações em arquivos existentes**

- `OfferDetail.tsx` — incluir `<RatingSummary>` no card lateral e `<ReviewList>` abaixo da descrição.
- `OfferCard.tsx` — exibir ⭐ média ao lado do nome da loja.
- `StorePage.tsx` — bloco de avaliações agregadas.
- `App.tsx` (ou layout principal) — montar `<ReviewPromptDialog>` para usuários autenticados.
- `offers-api.ts` — incluir `rating_avg` e `rating_count` no `mapRow` via join/RPC.

### Considerações

- **Privacidade**: nome exibido = `profiles.full_name` (primeiro nome) + avatar; usuário pode marcar review como anônimo (futuro, não nesta fase).
- **Anti-spam**: 1 review por (offer, user). Rate limit no edge para não permitir mais de 5 reviews/dia por usuário.
- **Fotos**: máx 3, máx 5MB cada, JPG/PNG/WEBP. Compressão client-side antes do upload.
- **SEO**: incluir `AggregateRating` no JSON-LD da oferta quando houver reviews aprovadas.
- **i18n**: textos em PT-BR consistentes com o resto do app.

### Entregas em ordem

1. Migration: tabelas, RLS, bucket, RPCs, trigger de auto-aprovação.
2. Edge function `generate-review-prompts` + cron.
3. Componentes base: `RatingStars`, `RatingSummary`, `ReviewForm`, `ReviewList`.
4. `ReviewPromptDialog` global + integração no layout.
5. Integração em `OfferDetail`, `OfferCard`, `StorePage`.
6. Aba de moderação no Admin.
7. Edge function `notify-review-request` + cron diário.
8. JSON-LD `AggregateRating` no SEO.

### Perguntas antes de implementar

- Confirma janela de **3 horas** após interação? (alternativas: 1h, 6h, 24h), criar na aba de Condigurações (Admin)
- Reviews precisam de **moderação prévia sempre**, ou auto-aprovar baixo risco (≥4 estrelas, sem foto)?
- Permitir review **sem login** (via link/token enviado por push) ou exigir conta?
- Lojista pode **responder** a avaliações nesta primeira versão?
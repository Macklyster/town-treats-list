## O que vou construir

Três módulos que somam ao CMS existente, sem refazer o que já funciona.

### 1. Biblioteca de Mídia (reutilizável)

Nova tela `Biblioteca` em `/painel-lojista/midia` (lojista) e aba "Mídia" no `/admin` (todas as lojas).

- Nova tabela `media_assets` (por loja): `id`, `store_id`, `url`, `storage_path`, `filename`, `alt_text`, `width`, `height`, `bytes`, `tags[]`, `created_at`. RLS: dono da loja gerencia; admin tudo.
- Tabela de junção `offer_media`: `offer_id`, `media_id`, `position`, `is_cover` — permite a mesma foto em várias ofertas, com ordem e capa.
- Bucket `offer-images` continua sendo o storage; o upload passa a popular `media_assets`.
- UI: grid de miniaturas, busca por nome/tag, multi-upload por drag-drop, edição inline de alt-text, exclusão (com aviso se em uso), filtro "em uso / não usadas".
- No `OfertaForm`: novo seletor "Escolher da biblioteca" ao lado do upload atual, com checkbox para marcar capa e arrastar para reordenar.

### 2. Edição em massa de ofertas

Aprimorar a aba "Ofertas" do `/admin` e a lista do `/painel-lojista`:

- Checkbox por linha + "selecionar tudo".
- Barra de ações em lote: aprovar, rejeitar, pausar, excluir, mudar categoria, estender validade (+7/+15/+30d), marcar/desmarcar destaque.
- Confirmação única para o lote, com contagem de afetados.
- Filtros rápidos: status, categoria, cidade, período, "expira em 7d".

### 3. UI mais simples (não-técnico)

- Substituir as tabelas densas por **cards** com foto, título, status, atalhos (editar / duplicar / pausar / excluir).
- **Drag-and-drop** para reordenar fotos da oferta e categorias (já existe seta ↑↓ — adiciono dnd-kit por cima, mantendo as setas como fallback).
- **Preview ao vivo** no `OfertaForm`: painel lateral mostrando como a oferta aparecerá no site enquanto edita.
- **Duplicar oferta** (1 clique cria rascunho idêntico) — atalho muito pedido em CMS.
- Tooltips e textos de ajuda nos campos críticos (slug, validade, categoria).

## Detalhes técnicos

- **Migração SQL** (1 só): cria `media_assets` e `offer_media`, GRANTs, RLS (`store owner` + `admin`), índices em `store_id` e `offer_id`. Backfill: para cada `offers.image_url` existente, insere uma linha em `media_assets` (se não existir) e cria `offer_media` com `is_cover=true, position=0`. `offers.image_url` permanece (compatibilidade) e passa a ser derivado da capa em `offer_media`.
- **Frontend**: nova pasta `src/components/cms/` com `MediaLibrary.tsx`, `MediaPicker.tsx` (dialog reutilizável), `OfferBulkBar.tsx`, `OfferCard.tsx`, `SortablePhotos.tsx` (usa `@dnd-kit/core` + `@dnd-kit/sortable`).
- **Páginas alteradas**: `Admin.tsx` (nova aba Mídia + barra em lote), `PainelLojista.tsx` (cards + barra em lote + link Biblioteca), `OfertaForm.tsx` (MediaPicker + preview lateral + dnd).
- **Sem mudança** em rotas públicas, leilões, coletivas, cupons, geo, intel.

## Fora do escopo

- CMS headless externo (Strapi/Sanity) — não necessário, já temos Lovable Cloud.
- Editor de blocos rich-text (descrição continua textarea).
- Versionamento/histórico de mudanças.

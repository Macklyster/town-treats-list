## Objetivo

Permitir que o lojista adicione **múltiplas imagens** e **um vídeo curto** por anúncio, e exibir uma **galeria em carrossel** na página pública quando houver mais de uma mídia.

## Situação atual

- `OfertaForm` grava apenas `offers.image_url` (uma imagem). Já existe `MediaPicker`, mas ele só copia a URL da capa para `image_url`.
- Já existem no banco: tabela `media_assets` (com `tags[]`) e tabela `offer_media` (offer_id, media_id, position, is_cover) — infra pronta para múltiplas mídias, só falta usar de fato.
- `OfferDetail` renderiza uma única `<img src={offer.image}>`.
- `MediaLibrary` aceita apenas `image/*`.
- Bucket `offer-images` já é usado para imagens; vídeo pode viver no mesmo bucket.

## Plano

### 1. Backend leve (Cloud)
- Adicionar colunas em `media_assets`: `media_type text default 'image'` (`'image' | 'video'`), `duration_seconds int null`, `poster_url text null` (thumbnail do vídeo).
- Sem novas tabelas: `offer_media` continua ligando mídias à oferta com `position` e `is_cover`.
- Regra: no máximo **1 vídeo** e **até 8 imagens** por oferta (validado no cliente; capa deve ser imagem).
- Manter `offers.image_url` como compat: espelha a URL da capa (imagem) — já feito pela função `setOfferMedia`.

### 2. Upload de vídeo (`media-api.ts` + `MediaLibrary`)
- Aceitar `video/mp4` e `video/webm` até ~20 MB, duração até ~30 s (validado via `HTMLVideoElement` antes do upload).
- Gerar poster (frame do 0,5 s) via `<video>` + `canvas` e enviar como imagem `poster` no mesmo path (`{storeId}/{uuid}.jpg`).
- Registrar em `media_assets` com `media_type='video'`, `poster_url`, `duration_seconds`.
- `MediaLibrary`: aba/filtro "Todas / Imagens / Vídeos", input `accept="image/*,video/*"`, miniatura de vídeo com ícone ▶ sobre o poster.

### 3. Cadastro de oferta (`OfertaForm`)
- Substituir o par `ImageUploader` + `MediaPicker` atual por um bloco único **"Mídias do anúncio"**:
  - Lista ordenável (drag-and-drop simples com setas ↑↓) das mídias selecionadas.
  - Cada item: thumb, badge "Capa" / "Vídeo", botão "Definir como capa" (só imagens) e "Remover".
  - Botão "Adicionar mídias" abre o `MediaPicker` estendido (multi-seleção + upload direto).
  - Estado local: `mediaItems: { id, url, media_type, poster_url }[]` + `coverId`.
- Ao salvar (criar/editar): após o `insert/update` de `offers`, chamar `setOfferMedia(offerId, ids, coverId)` que já existe. Extender `setOfferMedia` para tolerar vídeos e continuar sincronizando `offers.image_url` com a URL da capa (imagem).
- Ao editar, pré-carregar via `listOfferMedia(offerId)`.
- Validações: pelo menos 1 imagem; capa obrigatoriamente imagem; máx. 1 vídeo.

### 4. Exibição pública (`OfferDetail`)
- Buscar `listOfferMedia(offer.id)` junto do detalhe. Se vazio, cair no fallback `offer.image` atual (compatível com ofertas antigas).
- Renderizar galeria:
  - **1 mídia** → mesmo layout de hoje.
  - **2+ mídias** → carrossel shadcn (`ui/carousel`, já usado no Hero) com:
    - Slides de imagem (`<img>`) e slide de vídeo (`<video controls playsInline poster={poster_url}>` sem autoplay para evitar consumo).
    - Setas minimalistas iguais aos outros carrosséis.
    - Tira de miniaturas (thumbs) abaixo, sincronizada com o slide ativo; clique navega direto.
    - Badges (`-X% OFF`, contagem regressiva flash) mantidos posicionados na moldura, não dentro do slide.
- `SEO`/JSON-LD: `image` continua sendo a capa (URL principal); adicionar `image` array com todas as URLs de imagem.

### 5. Compat e migração
- Ofertas antigas com só `image_url`: exibição intocada; ao editar, `mediaItems` inicia com um asset "virtual" (URL existente) ou vazio — usuário pode simplesmente adicionar novas mídias.
- Nenhum dado é apagado; `image_url` continua populado (sincronizado com a capa).

## Detalhes técnicos

- **Arquivos alterados**: `src/lib/media-api.ts`, `src/components/cms/MediaLibrary.tsx`, `src/components/cms/MediaPicker.tsx`, `src/pages/OfertaForm.tsx`, `src/pages/OfferDetail.tsx`.
- **Novo componente**: `src/components/site/OfferMediaCarousel.tsx` (carrossel + thumbs) e `src/components/cms/OfferMediaEditor.tsx` (lista ordenável no form).
- **Migração**: `alter table media_assets add column media_type text not null default 'image' check (media_type in ('image','video')), add column duration_seconds int, add column poster_url text;`
- **Storage**: reuso do bucket público `offer-images`; políticas atuais já cobrem vídeo (mesmo `store_id/…` prefix).
- **Performance**: `loading="lazy"` nas thumbs, `preload="metadata"` no `<video>`, poster para 1º paint sem baixar o vídeo.
- **A11y**: `aria-label` nos botões do carrossel, `alt` das imagens vindo de `alt_text`, controles nativos do vídeo.

## Fora do escopo

- Ofertas coletivas / leilões / eventos (usam formulários próprios; podem migrar depois seguindo o mesmo padrão).
- Trim/edição de vídeo no navegador — só validação de duração.
# Painel de SEO no Admin (lojas, categorias e anúncios)

## O que você vai ganhar

Uma nova aba **SEO** no Admin (grupo Plataforma) onde você escolhe uma loja, uma categoria ou um anúncio e ajusta:

- **Título no Google** (contador de até 60 caracteres)
- **Descrição no Google** (contador de até 160 caracteres)
- **Palavras-chave** (ex.: "farmácia de plantão", "pizza Douradina")
- **Imagem de compartilhamento** (opcional)

Uma **prévia ao vivo** mostra como o resultado fica no Google e no WhatsApp. Campos vazios usam o texto automático de hoje, então nada piora para quem você não editar. Um botão "Voltar ao automático" desfaz a edição.

## Onde vale

- **Lojas:** página da loja.
- **Categorias:** página da categoria em todas as cidades, com a cidade colocada sozinha (ex.: escreva "Alimentação em {cidade}"). Você também pode criar uma versão específica para uma cidade.
- **Anúncios (todos os tipos):** ofertas normais, coletivas, leilões, ofertas invisíveis e eventos.

A lista mostra um selo "Personalizado" ou "Automático" e avisa sobre título longo, descrição curta ou título repetido.

## Sobre palavras-chave (aviso honesto)

O Google não usa mais a tag de palavras-chave para ranquear. Por isso elas serão usadas onde contam: aparecem como sugestões para incluir no título e na descrição, entram nos dados estruturados da página e o painel avisa quando uma palavra não está no título nem na descrição. Isso ajuda, mas não garante posição na primeira página.

## Detalhes técnicos

- Nova tabela `seo_overrides` (entity_type: store | category | offer | group_offer | auction | geo_offer | event; entity_id/slug; city opcional; title, description, keywords text[], image_url, updated_by). Leitura pública só das colunas de SEO; escrita apenas admin via `has_role`. GRANTs + RLS.
- `route-seo.ts`: `storeMeta`, `cityMeta`, `offerMeta`, `eventMeta` e os metadados de coletiva/leilão/invisível consultam o override (via cliente público sem sessão, como `loadLocalSeo`) e caem no texto atual quando vazio. Placeholder `{cidade}` substituído na categoria; prioridade cidade+categoria > categoria geral > automático.
- Palavras-chave entram em `keywords` do JSON-LD e na meta `keywords`.
- Novo componente `AdminSeo.tsx` registrado na navegação agrupada do Admin com contador.
- Teste: override vazio usa automático; override preenchido substitui título/descrição; `{cidade}` é trocado.
- Publicar depois para o Google ler.
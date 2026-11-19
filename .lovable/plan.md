# Capa do anúncio no envio por WhatsApp (Divulgação)

## O que muda para você
- Cada card de anúncio na seção "Anúncios por empresa" passa a mostrar a foto de capa do anúncio, inteira (sem cortes).
- **No celular:** o botão **WhatsApp** abre o menu de compartilhamento com a **foto + texto + link** juntos; você escolhe o WhatsApp e o contato/grupo, e a imagem vai anexada.
- **No computador (ou celular sem suporte):** o WhatsApp abre com o texto pronto como hoje, e a prévia do link já mostra a capa. Um novo botão **Baixar imagem** salva a capa para anexar manualmente.
- Anúncios sem foto continuam funcionando só com texto.

Limite importante: o link direto do WhatsApp não aceita anexar imagem; por isso o envio da foto junto usa o compartilhamento do próprio celular.

## Detalhes técnicos
- `AdminDivulgacao.tsx`: incluir `image_url` (e capa de `offer_media` quando houver) no select de ofertas; adicionar `image` opcional em `Post`; renderizar `<img object-contain>` no card.
- Clique no WhatsApp: se `navigator.canShare({ files })`, buscar a imagem (fetch → Blob → File) e chamar `navigator.share({ files, text })` com a mensagem completa; senão manter o link `whatsappUrl` atual com cópia do texto. Pré-carregar o File ao renderizar para não perder a ativação do clique.
- Botão "Baixar imagem" via blob + `<a download>`.
- Teste unitário para o helper que decide entre compartilhamento com arquivo e link.

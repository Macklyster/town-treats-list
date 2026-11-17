# Redes sociais das lojas na Divulgação

## O que muda para você

- Nova seção **"Redes sociais"** dentro da aba Divulgação do Admin: lista de lojas aprovadas com busca, e para cada loja os campos **Instagram, Facebook, TikTok e site**, com botão Salvar.
- O Instagram reaproveita o campo que a loja já tem (o mesmo do cadastro do lojista); os demais são novos. Para os novos campos adicionar no cadastro da loja igual do Instagram.
- Os textos prontos de ofertas passam a incluir as redes da loja, por exemplo:
`📸 Siga: @lojaexemplo` e `👍 facebook.com/lojaexemplo`. Lojas sem redes cadastradas não mostram essas linhas.
- Aceita digitar `@usuario` ou o link completo; o sistema padroniza.

## Detalhes técnicos

- Migração: adicionar `facebook`, `tiktok`, `website` (text, nulos) em `stores`; RLS existente de update por admin/dono cobre a edição.
- Componente `AdminStoreSocials.tsx` renderizado em `AdminDivulgacao.tsx`; grava via cliente autenticado e registra em `admin_audit_log` (section "redes_sociais").
- Consulta de ofertas na Divulgação passa a trazer `instagram, facebook, tiktok, website` da loja; helper `formatSocials()` normaliza handles/URLs, com teste unitário.
- Campos também aparecem no bloco "Contato" da Gestão de Loja para manter consistência.
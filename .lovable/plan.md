# Aviso por e-mail de ofertas novas

## O que você vai receber
Dois e-mails automáticos para **macklyster@gmail.com**, enviados por notify.ofertasfly.com.br:

1. **Oferta aguardando aprovação**: quando um lojista (ou o Admin em uma loja gerenciada) cadastra uma oferta nova. Mostra o título, a loja, a cidade, o preço e a foto, com um botão "Revisar no Admin".
2. **Oferta publicada**: quando uma oferta é aprovada e entra no ar. Mostra os mesmos dados, com um botão "Ver oferta" que abre a página pública.

Regras:
- Cada oferta gera no máximo um e-mail de cada tipo, mesmo que seja editada ou aprovada de novo.
- Ofertas pausadas e reativadas não geram e-mail.
- O visual segue o OfertasFLY: azul-marinho e a logo.
- Os e-mails só começam a chegar quando o domínio de envio terminar a verificação. Hoje falta você adicionar os dois registros NS de "notify" no Registro.br. Até lá, tudo fica pronto e não sai nada.

## Passos
1. Preparar a estrutura de e-mails do app, ligada ao domínio já configurado.
2. Criar os dois modelos de e-mail em português.
3. Disparar o envio automaticamente quando uma oferta for criada ou aprovada, venha ela do lojista ou do Admin.
4. Testar com uma oferta de teste e conferir o histórico de envios em More → Emails.

## Detalhes técnicos
- Fazer o scaffold dos templates transacionais: `offer-pending-review` e `offer-published`, com destinatário fixo no servidor (`to`). Nenhum e-mail ou nome de template vem do navegador.
- Um trigger no banco, em `offers`, dispara no INSERT com status pending e no UPDATE que muda o status para approved. Ele chama, via pg_net, uma rota de servidor em `/api/public/hooks/offer-email`, autenticada por um segredo compartilhado guardado no vault e nas variáveis de ambiente do servidor.
- A rota confere o segredo, relê a oferta e a loja com o cliente admin e envia o e-mail. A chave de idempotência é `<template>-<offer_id>`, o que evita duplicidade.
- Destinatário suprimido ou domínio ainda não verificado são tratados como resultado normal e registrados no log, sem gerar erro.

# Assistente de IA nos anúncios e no SEO

## O que muda para o usuário
- **Lojista:** o botão "Sugerir com IA" aparece ao criar e ao editar todos os tipos de anúncio: oferta comum, Coletiva, Leilão e Oferta Invisível.
  - Planos **Destaque** e **Plus**: a IA já vem incluída.
  - **Grátis** e **Starter**: o botão aparece bloqueado, com duas opções: "Fazer upgrade" ou "Contratar IA por R$ 19/mês".
- **Admin:** usa a IA sem limite em qualquer anúncio, inclusive nos que cadastra para lojistas (Gestão de Loja).
- **Painel SEO do Admin:** novo botão "Sugerir com IA" que preenche título (até 60 caracteres), descrição (até 160) e palavras-chave para lojas, categorias, anúncios e eventos. Antes de salvar, você revisa e aplica tudo de uma vez ou campo por campo.
- **Assinatura:** a página do lojista ganha o cartão "Assistente de IA – R$ 19/mês", que se contrata e se cancela pelo mesmo checkout do Stripe.

## Etapas
1. **Liberação por plano:** marcar "ai_assist" nos planos Destaque e Plus e criar um registro de adicional contratado por loja.
2. **Cobrança do adicional:** criar o produto de R$ 19/mês no Stripe, contratá-lo pelo checkout e ativá-lo ou desativá-lo pelo aviso de pagamento (webhook) que já existe.
3. **Trava no servidor:** a sugestão só é gerada se quem pede for admin ou se a loja tiver o plano certo ou o adicional ativo. Caso contrário, aparece uma mensagem clara com o caminho para o upgrade.
4. **IA nos formulários:** adaptar o botão atual para cada tipo de anúncio (Coletiva com faixas de preço, Leilão com lance inicial, Invisível com o texto do benefício).
5. **IA no SEO:** gerar sugestões a partir do nome, da cidade, da categoria e das ofertas da loja ou página.
6. **Testes:** Destaque e Plus liberados; Grátis e Starter bloqueados sem o adicional e liberados com ele; admin sempre liberado.

## Detalhes técnicos
- Nova tabela `store_addons` (store_id, addon='ai_assist', status, stripe_subscription_id, current_period_end), com GRANT e RLS: o dono da loja lê, o admin gerencia e a escrita fica com o service role (webhook).
- Função SQL `store_has_ai_assist(store_id)`, definida como security definer e usada pelo servidor.
- `suggest-offer` passa a receber `offer_type` e `store_id` e checa a permissão. Novo handler `suggest-seo` para o SEO. Os dois migram para o modelo padrão atual pela API de Responses com saída JSON estrita e streaming.
- Hook `useAiAssist(storeId)` para mostrar ou bloquear o botão; a regra de verdade fica no servidor.
- Erros 402, 403 e 429 mostram mensagens próprias em português.

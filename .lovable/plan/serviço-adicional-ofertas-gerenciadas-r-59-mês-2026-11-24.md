# Serviço adicional: Ofertas Gerenciadas (R$ 59/mês)

## O que muda para o lojista
- Novo cartão "Ofertas Gerenciadas pela equipe OfertasFly" na página de Assinatura, ao lado do cartão do Assistente de IA.
- Disponível para Starter, Destaque e Plus. No plano Grátis o cartão aparece bloqueado com "Fazer upgrade".
- Contratação pelo Stripe (R$ 59/mês); cancelamento pelo portal de pagamento.
- Quando ativo, o painel mostra a etiqueta de gestão que já existe.

## O que muda para o Admin
- Ao contratar, a loja é marcada automaticamente como "Gestão de Ofertas (serviço contratado)" na Gestão de Loja, com data de início. Ao cancelar, a marcação é desligada.
- A chave manual continua existindo para negócios fechados pelo time comercial sem Stripe.
- A loja passa a aparecer na lista de lojas gerenciadas, liberando o cadastro de ofertas pelo Admin.

## Regras
- Plano Grátis não pode contratar (validado no servidor, não só na tela).
- Se o lojista voltar para o Grátis, o serviço é cancelado no fim do período.

## Detalhes técnicos
- Reusar `store_addons` com addon `managed_offers`; RPC `store_has_managed_offers`.
- `create-checkout.ts`: novo ramo `addon === "managed_offers"` checando plano pago, preço Stripe criado para R$ 59/mês.
- `stripe-webhook`: ativar/desativar addon e sincronizar `stores.managed_offers` / `managed_offers_since`; deploy da função.
- Novo `ManagedOffersAddonCard.tsx` seguindo `AiAddonCard.tsx`.
- Teste: plano Grátis bloqueado, Starter/Destaque/Plus permitidos.

# Gestão de Ofertas pelo Admin (serviço contratado)

## Objetivo
Permitir que a equipe OfertasFly cadastre e gerencie todas as modalidades de ofertas (Oferta comum/Relâmpago/Agendada, Coletiva, Leilão, Oferta Invisível, Evento, Cupons e Mídias) em nome de lojistas que contrataram o serviço "Gestão de Ofertas".

## Como vai funcionar
1. **Ativar o serviço por loja**: em Admin → Gestão de Loja, novo interruptor "Gestão de Ofertas contratada" (com data de início e observação opcional).
2. **Nova aba no Admin: "Ofertas Gerenciadas"**
   - Lista apenas as lojas com o serviço ativo, com busca por nome/cidade e contador de ofertas.
   - Ao escolher a loja, o admin vê todas as ofertas dela (todas as modalidades) com editar, pausar, duplicar e excluir.
   - Botão "Nova oferta" com o mesmo menu do lojista (Oferta, Coletiva, Leilão, Invisível, Evento).
3. **Mesmos formulários do lojista**: os formulários atuais passam a aceitar a loja escolhida pelo admin, com faixa no topo "Você está cadastrando para: [Loja]". Todas as opções ficam iguais (mídias múltiplas/vídeo, sugestão por IA, relâmpago, agendamento, renovação automática).
4. **Regras mantidas**: limites do plano da loja (quantidade de ofertas, destaques) continuam valendo; as ofertas criadas pelo admin já entram aprovadas.
5. **Histórico**: cada criação/edição feita pelo admin fica registrada no log de auditoria; o lojista vê a etiqueta "Gerenciada pela OfertasFly" na oferta.

## Detalhes técnicos
- Migração: `stores.managed_offers boolean default false`, `managed_offers_since timestamptz`, `managed_offers_notes text`; coluna `offers.created_by_admin boolean default false` (e equivalentes nas demais tabelas de oferta).
- Políticas: admins (`has_role(auth.uid(),'admin')`) com INSERT/UPDATE/DELETE em offers, group_offers, auction_offers, geo_offers, events, coupons, media_assets e offer_media — restrito a lojas com `managed_offers = true` (exceto moderação já existente). Gatilho de auditoria grava em `admin_audit_log`.
- Rotas novas protegidas por admin: `/admin/loja/:storeId/oferta/:id?`, `/coletiva`, `/leilao`, `/oferta-invisivel`, `/evento`. Os formulários (OfertaForm, ColetivaForm, LeilaoForm, OfertaInvisivelForm, EventoForm) recebem `storeId` via parâmetro em vez de buscar por `owner_id`, e redirecionam de volta para a aba do Admin.
- `useSubscription(storeId)` reutilizado para os limites do plano; MediaPicker/upload usando o storeId da loja gerenciada (ajustar política do bucket para admin).
- Novo componente `AdminManagedOffers.tsx` e contagem na aba, seguindo o padrão das demais abas.

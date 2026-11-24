# Serviços adicionais na página Anuncie

Nova seção "Serviços adicionais" logo abaixo dos planos (antes do formulário de contato), explicando os dois adicionais já existentes.

## Conteúdo

**Assistente de IA — R$ 19/mês**
- Sugere título, descrição e palavras-chave ao criar/editar ofertas, Coletivas, Leilões e Ofertas Invisíveis.
- Já incluído nos planos Destaque e Plus (selo "Incluso no Destaque e Plus").
- Para Grátis e Starter: contratado como adicional.

**Ofertas Gerenciadas pela equipe OfertasFly — R$ 59/mês**
- Nossa equipe cadastra e mantém suas ofertas, cupons e imagens.
- Disponível para Starter, Destaque e Plus (não disponível no Grátis).
- Ideal para quem não tem tempo de cadastrar.

**Como contratar (3 passos)**
1. Escolha um plano e crie sua conta.
2. No Painel do Lojista, abra Assinatura.
3. Ative o adicional no cartão do serviço; cancele quando quiser pelo portal de pagamento.

Botões em cada cartão: "Contratar" (leva ao cadastro/assinatura, mesmo destino dos planos) e "Falar com um consultor" (rola até o formulário). Link "Serviços adicionais" também no topo da seção de planos.

## Detalhes técnicos
- Editar apenas `src/pages/Anuncie.tsx`: array local `addons` e nova `<section id="servicos">` usando `SectionHeading`, tokens de cor existentes (`text-highlight`, `bg-highlight-soft`) e ícones lucide (Sparkles, Users).
- Preços fixos em texto conforme os valores já cobrados; sem mudanças de banco ou pagamento.

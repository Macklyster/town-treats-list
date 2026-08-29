# FlyPontos — Programa de Fidelidade OfertasFly

Programa de fidelidade **por lojista**: cada loja parceira tem sua própria carteira de pontos, regras e catálogo de recompensas. O consumidor acumula pontos em cada loja que segue/compra, evolui de nível, cumpre missões, ganha selos e pode usar crédito (cashback) na própria loja.

## Como o consumidor ganha pontos

Todos os valores são configuráveis pelo lojista (com padrões sugeridos):

| Ação | Pontos padrão | Limite |
| --- | --- | --- |
| Seguir a loja | 20 | 1 vez |
| Favoritar oferta | 5 | 3/dia por loja |
| Avaliar oferta (aprovada) | 30 | 1 por oferta |
| Avaliação com foto | +15 | 1 por avaliação |
| Compartilhar oferta | 5 | 3/dia |
| Check-in por geolocalização na loja | 15 | 1/dia |
| Resgatar cupom | 10 | por cupom |
| **Compra validada pelo lojista (QR)** | 1 ponto por R$ 1 (multiplicador do nível) | por validação |
| Missões e streaks | variável | por missão |

Pontos de engajamento são creditados automaticamente. Pontos de compra só existem quando o lojista valida — é a trava anti-fraude do programa.

## Validação pelo lojista (QR)

- O consumidor abre "Meu QR" no app: um token rotativo de curta duração.
- O lojista, no painel, abre "Validar cliente", lê o QR (câmera) ou digita o código, informa o valor da compra e confirma.
- A validação credita pontos, gera cashback (se configurado) e dispara progresso das missões.
- Alternativa sem câmera: o lojista gera um código de 6 dígitos por venda e o cliente digita no app.

## Níveis (por loja)

Bronze → Prata → Ouro → Diamante, com limiares e benefícios definidos pelo lojista:
- multiplicador de pontos (ex.: 1x / 1,2x / 1,5x / 2x);
- acesso antecipado às ofertas relâmpago da loja;
- desconto extra fixo;
- recompensa de aniversário de nível.

O nível considera pontos ganhos nos últimos 12 meses (evita nível eterno) e é recalculado a cada crédito.

## Recompensas

Catálogo por loja, criado pelo lojista:
1. **Cupons exclusivos** — resgate por pontos, gerando um cupom único (reaproveita o fluxo atual de cupons/`claim_unique_coupon`).
2. **Crédito/cashback** — % da compra validada vira saldo em reais utilizável só naquela loja; o lojista abate o saldo na próxima validação.
3. **Brindes e experiências** — item físico com estoque e retirada validada pelo lojista.
4. **Nível/benefício** — desbloqueio automático, sem custo de pontos.

Saldo de cashback e pontos têm validade configurável (padrão: 12 meses), com aviso por push antes de expirar.

## Missões, selos e ranking

- **Missões da loja**: "avalie 2 ofertas nesta semana", "volte em 15 dias", "traga um amigo".
- **Missões OfertasFly** (globais, valem selos e não pontos de loja): "descubra 3 categorias", "primeira avaliação com foto".
- **Streak** de visitas semanais com bônus crescente.
- **Selos** no perfil público do consumidor e **ranking mensal por cidade** (opt-in), exibindo apelido e selos — sem dados sensíveis.
- **Indicação**: quem convida ganha pontos quando o convidado tem a primeira compra validada.

## O que o lojista vê e configura

Nova aba "Fidelidade" no painel do lojista:
- Ativar/desativar o programa e escolher as regras de pontuação.
- Níveis, multiplicadores e benefícios.
- Catálogo de recompensas (pontos, estoque, validade).
- Missões da loja.
- Tela "Validar cliente" (QR/código + valor).
- Relatórios: membros, pontos emitidos vs. resgatados, ticket médio de membro vs. não membro, taxa de retorno, passivo de pontos e cashback.

Disponibilidade por plano: Starter (pontos + níveis), Destaque (+ missões e cashback), Plus (+ ranking, relatórios avançados e recompensas ilimitadas).

## O que o consumidor vê

- **/fidelidade** — carteira: cards por loja com pontos, nível, barra de progresso, missões ativas e recompensas ao alcance; "Meu QR" fixo no topo.
- **/fidelidade/:slug** — extrato da loja, catálogo de recompensas, histórico de resgates, saldo de cashback.
- Na página da loja e no detalhe da oferta: bloco "Ganhe pontos aqui" com adesão em 1 toque.
- Recompensas resgatadas aparecem em "Meus cupons".
- Push: pontos creditados, nível novo, recompensa ao alcance, pontos expirando.

## Antifraude e privacidade

- Créditos só por funções no servidor, nunca pelo cliente.
- Idempotência por ação/dia/oferta; limites diários; check-in exige raio da loja.
- QR do cliente expira em 60s e é de uso único.
- Adesão explícita ao programa por loja; ranking é opt-in; loja vê apelido, nível e histórico de pontos — não vê dados de outras lojas.

## Detalhes técnicos

**Banco (novas tabelas, todas com RLS + GRANT):**
- `loyalty_programs` (por `store_id`): ativo, regras de pontuação em `jsonb`, `points_expire_months`, `cashback_percent`, `terms`.
- `loyalty_tiers`: nome, `min_points`, `multiplier`, benefícios.
- `loyalty_memberships`: `user_id` + `store_id`, `points_balance`, `points_lifetime`, `tier_id`, `credit_cents`, `joined_at`.
- `loyalty_ledger`: cada crédito/débito com `reason`, `points`, `ref_type`/`ref_id`, `expires_at`, chave de idempotência única.
- `loyalty_rewards` e `loyalty_redemptions`: catálogo e resgates (ligados a `coupon_redemptions` quando geram cupom).
- `loyalty_missions` e `loyalty_mission_progress`.
- `loyalty_checkin_tokens`: QR rotativo do consumidor.
- `loyalty_badges` e `loyalty_user_badges` (globais).
- `loyalty_city_ranking` como view materializada mensal.

**Funções security definer:** `loyalty_join(store_id)`, `loyalty_award(user, store, reason, ref)` (idempotente, aplica multiplicador e limites), `loyalty_issue_qr()`, `loyalty_validate_purchase(token, amount_cents)` (só dono da loja), `loyalty_redeem_reward(reward_id)`, `loyalty_state(store_id)`, `loyalty_wallet()`, `loyalty_store_report(store_id, days)`.

**Triggers:** créditos automáticos ao inserir em `store_followers`, `favorites`, `offer_reviews` (ao aprovar), `coupon_redemptions` e em eventos de compartilhamento (`offer_events`).

**Edge functions:** `loyalty-expire-points` (cron diário: expira pontos/cashback e avisa por push), `loyalty-mission-rollup` (fecha missões e streaks), `notify-loyalty` (pushes do programa).

**Frontend:** `src/lib/loyalty-api.ts`, `src/hooks/useLoyalty.ts`, componentes `LoyaltyCard`, `LoyaltyQrDialog`, `TierProgress`, `RewardCard`, `MissionList`, `ValidateCustomerDialog`; páginas `Fidelidade.tsx`, `FidelidadeLoja.tsx` e aba `PainelFidelidade` no painel do lojista. Visual seguindo os tokens semânticos atuais, sem cores hardcoded.

## Ordem de implementação

1. Banco + funções + RLS/GRANT.
2. Adesão, ledger e créditos automáticos de engajamento.
3. QR do consumidor + validação pelo lojista.
4. Níveis, catálogo de recompensas e resgates.
5. Cashback em crédito.
6. Missões, streaks, selos e ranking.
7. Relatórios do lojista, pushes e expiração por cron.

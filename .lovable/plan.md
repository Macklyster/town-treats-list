## Diagnóstico atual

**Catálogo (`src/data/plans.ts`) — exibido em /anuncie e /assinatura:**
- Grátis — R$ 0 — 1 oferta/mês
- Básico — R$ 79/mês — 3 ofertas
- Destaque — R$ 149/mês — 10 ofertas + selo, agendamento, relâmpago, dashboard (plano em destaque)
- Plus — R$ 249/mês — ilimitado + coletivas, leilão, invisível, consultor

**Banco (`plans`):** preços diferentes do catálogo (Básico R$ 49, Destaque R$ 99, Plus R$ 199). Só o catálogo é mostrado, mas o checkout lê do banco → inconsistência que pode quebrar a confiança no momento do pagamento.

**Promo atual:** banner "2 meses grátis" no anual — mas não existe plano anual nem toggle mensal/anual implementado.

## Problemas de conversão identificados

1. **Salto grande de R$ 79 → R$ 149 (+89%)** entre Básico e Destaque. Boa parte dos lojistas que querem testar agendamento/relâmpago vão travar aqui.
2. **Plano Grátis quase inútil** (1 oferta/mês). Não gera hábito nem mostra valor da plataforma → poucos viram pagantes.
3. **Sem trial nos planos pagos.** Lojista precisa colocar cartão sem nunca ter testado o painel.
4. **Sem opção anual de verdade.** O banner "2 meses grátis" promete algo que não existe → frustra na hora de assinar.
5. **Destaque tem 9 benefícios, Plus tem 14** — diferença visual grande, mas o "OfertasFly Coletiva / Leilão / Invisível" são features que poucos lojistas vão usar logo de cara. O Plus parece "caro demais para o que sobra de útil no dia a dia".
6. **Preços do banco desalinhados com catálogo** — risco operacional independente da estratégia.

## Estratégia proposta

### A. Reposicionar o funil (4 níveis → mesma quantidade, mas com ponte melhor)

```text
Grátis    Starter         Destaque       Plus
R$ 0      R$ 49/mês       R$ 129/mês     R$ 249/mês
1 oferta  3 ofertas       10 ofertas     ilimitado
                          (mais popular)
```

- **Grátis** continua, mas vira "Teste por 14 dias do Destaque" no onboarding (CTA principal). Quem não converter cai automaticamente no Grátis (1 oferta/mês) — não perde a conta.
- **Starter** (renomeia Básico) — R$ 49: preço de entrada psicológico abaixo de R$ 50. Inclui agendamento de ofertas (hoje só no Destaque) para já tirar uma objeção comum.
- **Destaque** vira R$ 129 (era 149) — reduz salto Starter→Destaque para 2,6x (era 1,9x mas com diferença absoluta menor). Continua "mais popular".
- **Plus** mantém R$ 249, mas reforça os 3 produtos exclusivos (Coletiva, Leilão, Invisível) como "kit de aquisição viral".

### B. Adicionar toggle Mensal / Anual com 2 meses grátis

- Anual = 10× o valor mensal (dois meses gratis), cobrado uma vez.
- Toggle no topo da seção de planos em `/anuncie#planos` e em `/painel-lojista/assinatura`.
- Cria um segundo preço por plano (mensal e anual) no banco e no catálogo.
- Resolve a promessa do banner atual + aumenta LTV e reduz churn no primeiro mês.

### C. Trial de 14 dias no Destaque

- Botão principal do hero passa a ser "Testar 14 dias grátis" em vez de "Quero anunciar".
- Sem cobrança no cartão durante o trial; só cobra no dia 15 se não cancelar.
- Reduz a fricção do "será que vale R$ 129?".

### D. Ajustes de copy / prova social (sem mexer em features)

- Adicionar "garantia de 7 dias" no Destaque e Plus → devolve dinheiro se cancelar na primeira semana.
- Adicionar microcopy abaixo de cada preço: "cancele quando quiser", "sem fidelidade", "suporte humano".
- Adicionar comparativo lado-a-lado de features-chave (tabela) abaixo dos cards, para o lojista enxergar rapidamente o que ganha subindo de plano.

### E. Higiene: alinhar banco × catálogo

- Atualizar `plans` no banco para os novos preços (Starter 4900, Destaque 12900, Plus 24900) com colunas separadas para mensal/anual e `stripe_price_id` por variação.
- `Assinatura.tsx` passa a ler também o ciclo (mensal/anual) escolhido.

## O que precisa ser feito (resumo de execução)

1. Editar `src/data/plans.ts`: renomear "Básico" → "Starter", adicionar campo `priceCentsYearly`, mover "Agendamento de ofertas" para Starter, ajustar preço do Destaque para R$ 129.
2. Adicionar toggle Mensal/Anual nas seções de planos em `src/pages/Anuncie.tsx` e `src/pages/Assinatura.tsx`.
3. Migração no banco: adicionar `price_cents_yearly`, `stripe_price_id_yearly`, atualizar valores e slugs, manter compatibilidade do `basico` → `starter` ou redirecionar.
4. Trial de 14 dias: adicionar `trial_period_days: 14` no `create-checkout` para o plano Destaque + atualizar CTA do hero.
5. Adicionar tabela comparativa abaixo dos cards de plano + selos de garantia/sem fidelidade.

## Decisões que preciso confirmar antes de implementar

- Topo da régua de preços (R$ 49 / 129 / 249) está OK ou prefere outros valores?
- Quer mesmo o trial de 14 dias do Destaque, ou prefere manter o Grátis como porta de entrada única?
- Em qual plano o trial deve cair (Destaque) e o Grátis fica como fallback pós-trial?
- Posso renomear "Básico" para "Starter" ou prefere outro nome (ex.: "Essencial")?
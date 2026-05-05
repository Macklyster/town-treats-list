## Objetivo
No formulário de oferta, transformar o campo livre **Condições** em uma combinação de:
- **Checkboxes de formas de pagamento** (com ícones)
- Campo de texto livre para outras condições

E na página pública da oferta, exibir as formas de pagamento como **badges com ícones** em vez de texto puro.

## Como funciona sem mudar o banco
O campo `conditions` (texto) continua existindo. Codificamos os métodos de pagamento como uma tag no início:

```
[pgto:pix,credito,debito]
Outras condições escritas pelo lojista...
```

Helper `parseConditions` separa a tag do texto livre, `buildConditions` monta de volta. Sem migração.

## Formas de pagamento suportadas (com ícones lucide)
- PIX — `QrCode`
- Cartão de Crédito — `CreditCard`
- Cartão de Débito — `Wallet`
- Dinheiro — `Banknote`
- Boleto — `Receipt`
- Vale Alimentação/Refeição — `UtensilsCrossed`

## Mudanças
1. **`src/lib/payment-methods.ts`** (novo) — lista de métodos + ícones + `parseConditions` / `buildConditions`.
2. **`src/pages/OfertaForm.tsx`**
   - Estado separado: `paymentMethods: string[]` e `conditionsText: string`.
   - No load de oferta existente, usar `parseConditions` para popular ambos.
   - UI: substituir Textarea Condições por:
     - Bloco "Formas de pagamento aceitas" com grid de checkboxes (ícone + label)
     - Textarea menor abaixo: "Outras condições (opcional)"
   - No submit, gravar `conditions = buildConditions(paymentMethods, conditionsText)`.
3. **`src/pages/OfferDetail.tsx`**
   - Usar `parseConditions` ao renderizar.
   - Mostrar bloco "Formas de pagamento aceitas" com badges (ícone + nome) acima do bloco "Condições" (texto livre, só se houver).
4. **`src/components/site/OfferCard.tsx`** (opcional — pequeno) — mostrar mini-ícones dos primeiros 3 métodos no rodapé do card, se existirem. Mantém leve.

Posso seguir?
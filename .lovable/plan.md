# QR Code da oferta para impressão

Cada oferta ganha um QR Code imprimível que aponta para uma URL rastreada. Ao escanear na vitrine, o cliente cai na página da oferta e contamos como uma conversão offline→online.

## Fluxo

1. Lojista abre a oferta no painel → clica em **"QR Code para vitrine"**
2. Abre um modal com:
   - Cartaz pronto para impressão (A6 ou A5) com logo OfertasFly, título da oferta, preço, desconto e o QR
   - Botões: **Imprimir**, **Baixar PNG**, **Baixar PDF**
3. O QR aponta para `https://ofertasfly.com.br/oferta/{id}?src=qr&store={slug}`
4. Na página da oferta, detectamos `?src=qr` e disparamos um evento `qr_scan` em `offer_events`
5. No painel, mostramos uma métrica nova: **Escaneamentos do QR**

## Mudanças

### Frontend
- `src/components/site/OfferQrDialog.tsx` (novo): modal com layout do cartaz, gera QR usando `qrcode` (npm), botão imprimir (`window.print()` com `@media print`), download PNG (canvas → blob), download PDF (`jspdf` ou via canvas + `print-to-pdf`).
- `src/pages/PainelLojista.tsx`: novo botão "QR Code" em cada linha da tabela de ofertas; nova coluna "Scans QR" no resumo.
- `src/pages/OfferDetail.tsx`: ao montar, se `searchParams.get("src") === "qr"`, dispara `trackOfferEvent(offer.id, "qr_scan")` (uma vez por sessão).
- `src/lib/offer-events.ts`: garantir que `qr_scan` é um event_type aceito (a função `track_offer_event` já aceita qualquer string).

### Bibliotecas
- `qrcode` (gera QR como dataURL/canvas, ~20kb)
- `jspdf` (opcional, só para botão "Baixar PDF" — pode ficar fora se preferir só PNG + Imprimir)

### Sem mudança de schema
A tabela `offer_events` e a função `track_offer_event` já suportam qualquer event_type. Apenas vamos contar `qr_scan` no painel.

### Cartaz (preview do modal)
```
┌────────────────────────────┐
│  OfertasFly  (logo)        │
│                            │
│  [Título da oferta]        │
│                            │
│   R$ 59,90                 │
│   ~~R$ 99~~  -40% OFF      │
│                            │
│      ┌─────────┐           │
│      │  QR     │           │
│      │  CODE   │           │
│      └─────────┘           │
│                            │
│  Aponte a câmera           │
│  ofertasfly.com.br         │
└────────────────────────────┘
```

## Fora do escopo
- Geração de QR em lote para várias ofertas
- Templates customizáveis de cartaz (cores/fontes do lojista)
- Métricas de heatmap por horário do scan (já cabe no dashboard existente depois, sem ação aqui)

## Sobre a oferta editada que não aparece para clientes (mensagem anterior)
Suspeita rápida: o `OfertaForm` força `status: "pending"` em **toda** edição, então uma oferta que estava `approved` volta para `pending` ao salvar e some do site até nova aprovação. Quer que eu trate isso junto (ex.: só voltar para pending se mudar título/preço/imagem) ou abrimos em outra task?
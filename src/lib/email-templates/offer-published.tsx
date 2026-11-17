import * as React from 'react'
import type { TemplateEntry } from './registry'
import { OfferNotice, type OfferNoticeProps } from './offer-notice-layout'

const Email = (p: OfferNoticeProps) => (
  <OfferNotice p={p} heading="Oferta publicada" intro="Esta oferta foi aprovada e já está visível para os clientes." cta="Ver oferta" preview={`Oferta no ar: ${p.title ?? ''}`} />
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `Oferta no ar: ${d['title'] ?? 'oferta'}`,
  displayName: 'Oferta publicada',
  to: 'macklyster@gmail.com',
  previewData: { title: 'Gillette Mach3 - 2 unidades', storeName: 'Drogamais', city: 'Douradina/PR', promoPrice: 'R$ 19,90', originalPrice: 'R$ 29,90', ctaUrl: 'https://ofertasfly.com.br/oferta/exemplo' },
} satisfies TemplateEntry

import * as React from 'react'
import type { TemplateEntry } from './registry'
import { OfferNotice, type OfferNoticeProps } from './offer-notice-layout'

const Email = (p: OfferNoticeProps) => (
  <OfferNotice p={p} heading="Nova oferta aguardando aprovação" intro="Uma oferta acabou de ser cadastrada e precisa da sua análise." cta="Revisar no Admin" preview={`Nova oferta para aprovar: ${p.title ?? ''}`} />
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `Nova oferta para aprovar: ${d['title'] ?? 'oferta'}`,
  displayName: 'Oferta aguardando aprovação',
  to: 'macklyster@gmail.com',
  previewData: { title: 'Gillette Mach3 - 2 unidades', storeName: 'Drogamais', city: 'Douradina/PR', promoPrice: 'R$ 19,90', originalPrice: 'R$ 29,90', ctaUrl: 'https://ofertasfly.com.br/admin' },
} satisfies TemplateEntry

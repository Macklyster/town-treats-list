import * as React from 'react'
import { Body, Button, Container, Head, Heading, Html, Img, Preview, Section, Text } from '@react-email/components'

export interface OfferNoticeProps {
  title?: string
  storeName?: string
  city?: string
  promoPrice?: string
  originalPrice?: string
  imageUrl?: string
  ctaUrl?: string
}

export function OfferNotice({ heading, intro, cta, preview, p }: { heading: string; intro: string; cta: string; preview: string; p: OfferNoticeProps }) {
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}><Text style={brand}>OfertasFLY</Text></Section>
          <Heading style={h1}>{heading}</Heading>
          <Text style={text}>{intro}</Text>
          {p.imageUrl ? <Img src={p.imageUrl} alt={p.title ?? 'Oferta'} width="100%" style={img} /> : null}
          <Text style={title}>{p.title ?? 'Oferta sem título'}</Text>
          <Text style={muted}>{p.storeName ?? 'Loja'}{p.city ? ` · ${p.city}` : ''}</Text>
          {p.promoPrice ? (
            <Text style={price}>
              {p.originalPrice ? <span style={strike}>{p.originalPrice}</span> : null} {p.promoPrice}
            </Text>
          ) : null}
          {p.ctaUrl ? <Button href={p.ctaUrl} style={button}>{cta}</Button> : null}
        </Container>
      </Body>
    </Html>
  )
}

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const header = { backgroundColor: '#02051f', borderRadius: '12px', padding: '14px 20px', marginBottom: '20px' }
const brand = { color: '#ffffff', fontSize: '20px', fontWeight: 700, margin: 0 }
const h1 = { color: '#02051f', fontSize: '22px', margin: '0 0 8px' }
const text = { color: '#333333', fontSize: '15px', lineHeight: '22px' }
const img = { borderRadius: '12px', margin: '12px 0', maxWidth: '100%' }
const title = { color: '#02051f', fontSize: '18px', fontWeight: 700, margin: '8px 0 2px' }
const muted = { color: '#666666', fontSize: '14px', margin: '0 0 8px' }
const price = { color: '#15803d', fontSize: '20px', fontWeight: 700, margin: '4px 0 16px' }
const strike = { color: '#999999', fontSize: '14px', textDecoration: 'line-through', fontWeight: 400 }
const button = { backgroundColor: '#02051f', color: '#ffffff', borderRadius: '10px', padding: '12px 22px', fontSize: '15px', fontWeight: 700, textDecoration: 'none' }

import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const Body = z.object({ offer_id: z.string().uuid(), kind: z.enum(['pending', 'published']) })
const SITE = 'https://ofertasfly.com.br'
const brl = (n: number | null | undefined) =>
  n == null ? undefined : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n))

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return r === 0
}

export const Route = createFileRoute('/api/public/hooks/offer-email')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const provided = request.headers.get('x-hook-secret') ?? ''
        const parsed = Body.safeParse(await request.json().catch(() => null))
        if (!provided || !parsed.success) return new Response('bad request', { status: 400 })

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
        const { data: secretRow } = await supabaseAdmin
          .from('internal_hook_secrets' as never).select('secret').eq('name', 'offer_email').maybeSingle()
        const secret = (secretRow as { secret?: string } | null)?.secret
        if (!secret || !safeEqual(provided, secret)) return new Response('unauthorized', { status: 401 })

        const { offer_id, kind } = parsed.data
        const { data: offer } = await supabaseAdmin
          .from('offers')
          .select('id,title,image_url,promo_price,original_price,status,stores(name,city,state)')
          .eq('id', offer_id).maybeSingle()
        if (!offer) return new Response('not found', { status: 404 })

        const store = (offer as any).stores as { name?: string; city?: string; state?: string } | null
        const templateName = kind === 'pending' ? 'offer-pending-review' : 'offer-published'
        const { sendTemplateEmail } = await import('@/lib/email-templates/send-email')
        try {
          const result = await sendTemplateEmail(templateName, 'macklyster@gmail.com', {
            idempotencyKey: `${templateName}-${offer_id}`,
            templateData: {
              title: offer.title,
              storeName: store?.name,
              city: store?.city ? `${store.city.trim()}/${store.state ?? ''}` : undefined,
              promoPrice: brl(offer.promo_price),
              originalPrice: brl(offer.original_price),
              imageUrl: offer.image_url ?? undefined,
              ctaUrl: kind === 'pending' ? `${SITE}/admin` : `${SITE}/oferta/${offer_id}`,
            },
          })
          return Response.json({ ok: true, sent: result.sent })
        } catch (e) {
          console.error('offer-email send failed', e)
          return Response.json({ ok: false, error: (e as Error).message }, { status: 502 })
        }
      },
    },
  },
})

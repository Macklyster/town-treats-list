import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, Link2, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";
import { formatSocials } from "@/lib/socials";
import { AdminStoreSocials } from "./AdminStoreSocials";

const SITE = "https://ofertasfly.com.br";
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type Post = { id: string; group: string; title: string; text: string; url: string };

export function whatsappUrl(text: string, url: string) {
  return `https://wa.me/?text=${encodeURIComponent(`${text}\n\n${url}`)}`;
}

export function AdminDivulgacao() {
  const [offers, setOffers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  const [reload, setReload] = useState(0);
  useEffect(() => {
    supabase.from("offers").select("id,title,promo_price,original_price,type,store:stores(name,city,instagram,facebook,tiktok,website)")
      .eq("status", "approved").order("created_at", { ascending: false }).limit(6)
      .then(({ data }) => setOffers(data ?? []));
    supabase.from("events").select("title,slug,starts_at,city").gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true }).limit(4)
      .then(({ data }) => setEvents(data ?? []));
  }, [reload]);

  const posts = useMemo<Post[]>(() => {
    const list: Post[] = [
      { id: "geral", group: "Público geral", title: "Convite para economizar",
        text: "🔥 Ofertas, cupons e descontos das lojas da sua cidade em um só lugar!\n\n💸 Economize todo dia com o OfertasFly. Acesse e confira 👇", url: SITE },
      { id: "lojista", group: "Captação de lojistas", title: "Cadastre sua empresa",
        text: "🏪 Tem um comércio? Divulgue suas ofertas para milhares de clientes da sua cidade!\n\n✅ Cadastro simples\n✅ Comece grátis\n✅ Mais clientes na sua porta\n\nCadastre sua empresa no OfertasFly 👇", url: `${SITE}/anuncie` },
      { id: "fidelidade", group: "Fidelidade", title: "FlyPontos",
        text: "⭐ Sabia que comprando nas lojas parceiras você acumula FlyPontos e troca por recompensas?\n\nVeja como funciona 👇", url: `${SITE}/fidelidade/como-funciona` },
      { id: "eventos", group: "Eventos", title: "Agenda da cidade",
        text: events.length
          ? `📅 Próximos eventos:\n${events.map((e) => `• ${e.title} — ${new Date(e.starts_at).toLocaleDateString("pt-BR")}${e.city ? ` (${e.city})` : ""}`).join("\n")}\n\nVeja a agenda completa 👇`
          : "📅 Shows, feiras e happy hours da sua cidade em um só lugar. Confira a agenda 👇",
        url: `${SITE}/eventos` },
      { id: "app", group: "Instale o app", title: "Atalho no celular",
        text: "📲 Tenha o OfertasFly na tela do seu celular! Abra o site e toque em \"Adicionar à tela inicial\". Rápido e sem ocupar espaço 👇", url: SITE },
    ];
    for (const o of offers) {
      const promo = Number(o.promo_price) || 0;
      const orig = Number(o.original_price) || 0;
      const price = promo > 0 ? `\n💰 ${orig > promo ? `De ${brl(orig)} por ` : "Por "}${brl(promo)}` : o.type === "brinde" ? "\n🎁 Brinde grátis" : "";
      list.push({ id: o.id, group: "Ofertas recentes", title: o.title,
        text: `🔥 ${o.title}\n🏪 ${o.store?.name ?? ""}${o.store?.city ? ` — ${o.store.city}` : ""}${price}${(() => { const s = formatSocials(o.store ?? {}); return s.length ? `\n\n${s.join("\n")}` : ""; })()}\n\nCorre que é por tempo limitado 👇`,
        url: `${SITE}/oferta/${o.id}` });
    }
    return list;
  }, [offers, events]);

  const copy = async (value: string, msg: string) => {
    await navigator.clipboard.writeText(value);
    toast.success(msg);
  };
  const share = async (p: Post) => {
    if (navigator.share) {
      try { await navigator.share({ title: p.title, text: p.text, url: p.url }); } catch { /* cancelado */ }
    } else copy(`${p.text}\n\n${p.url}`, "Texto copiado");
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Divulgação</h2>
        <p className="text-sm text-muted-foreground">Postagens prontas para WhatsApp, Instagram e Facebook. Os links já mostram foto e título ao colar.</p>
      </div>
      <AdminStoreSocials onSaved={() => setReload((n) => n + 1)} />
      <div className="grid gap-4 md:grid-cols-2">
        {posts.map((p) => (
          <Card key={p.id} className="flex flex-col gap-3 p-4">
            <div>
              <p className="text-xs font-semibold uppercase text-primary">{p.group}</p>
              <h3 className="font-semibold">{p.title}</h3>
            </div>
            <pre className="flex-1 whitespace-pre-wrap rounded-md bg-muted p-3 font-sans text-sm">{p.text}{"\n\n"}{p.url}</pre>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="discount" size="sm">
                <a href={whatsappUrl(p.text, p.url)} target="_blank" rel="noopener noreferrer"><MessageCircle className="mr-1 h-4 w-4" />WhatsApp</a>
              </Button>
              <Button size="sm" variant="outline" onClick={() => copy(`${p.text}\n\n${p.url}`, "Texto copiado")}><Copy className="mr-1 h-4 w-4" />Copiar texto</Button>
              <Button size="sm" variant="outline" onClick={() => copy(p.url, "Link copiado")}><Link2 className="mr-1 h-4 w-4" />Copiar link</Button>
              <Button size="sm" variant="ghost" onClick={() => share(p)}><Share2 className="mr-1 h-4 w-4" />Compartilhar</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

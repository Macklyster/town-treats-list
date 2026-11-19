import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, Link2, MessageCircle, Share2, Download, ChevronsUpDown, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { toast } from "sonner";
import { formatSocials } from "@/lib/socials";
import { canShareImage, copyMarketingText, loadImageFile, marketingMessage, whatsappUrl } from "@/lib/marketing-share";
import { AdminStoreSocials } from "./AdminStoreSocials";
import { applyMarketingOfferFilters } from "@/lib/marketing-offer-filters";

const SITE = "https://ofertasfly.com.br";
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type Post = { id: string; group: string; title: string; text: string; url: string; image?: string | null };

export function AdminDivulgacao() {
  const [offers, setOffers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  const [reload, setReload] = useState(0);
  const [stores, setStores] = useState<{ id: string; name: string; city: string | null }[]>([]);
  const [storeId, setStoreId] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [offersError, setOffersError] = useState(false);
  const [openStore, setOpenStore] = useState(false);
  useEffect(() => { const t = setTimeout(() => setDq(q.trim()), 300); return () => clearTimeout(t); }, [q]);
  useEffect(() => { setPage(1); }, [storeId, city, type, dq]);
  useEffect(() => {
    supabase.from("stores").select("id,name,city").eq("approved", true).order("name")
      .then(({ data }) => setStores((data as any) ?? []));
  }, []);
  const cities = useMemo(() => [...new Set(stores.map((s) => s.city?.trim()).filter(Boolean) as string[])].sort(), [stores]);
  useEffect(() => {
    let cancel = false;
    setLoading(true);
    setOffersError(false);
    const qb = applyMarketingOfferFilters(supabase.from("offers")
      .select("id,title,image_url,promo_price,original_price,type,offer_media(is_cover,media:media_assets(url,media_type)),store:stores!inner(name,city,instagram,facebook,tiktok,website)", { count: "exact" }),
      { storeId, city, type, title: dq });
    qb.order("created_at", { ascending: false }).range(0, page * 12 - 1).then(({ data, count, error }) => {
      if (cancel) return;
      setOffersError(Boolean(error));
      setOffers(data ?? []); setTotal(count ?? 0); setLoading(false);
    });
    return () => { cancel = true; };
  }, [reload, storeId, city, type, dq, page]);
  useEffect(() => {
    supabase.from("events").select("title,slug,starts_at,city").gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true }).limit(4)
      .then(({ data }) => setEvents(data ?? []));
  }, []);

  const fixedPosts = useMemo<Post[]>(() => [
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
  ], [events]);
  const offerPosts = useMemo<Post[]>(() => {
    const list: Post[] = [];
    for (const o of offers) {
      const promo = Number(o.promo_price) || 0;
      const orig = Number(o.original_price) || 0;
      const price = promo > 0 ? `\n💰 ${orig > promo ? `De ${brl(orig)} por ` : "Por "}${brl(promo)}` : o.type === "brinde" ? "\n🎁 Brinde grátis" : "";
      list.push({ id: o.id, group: o.type === "cupom" ? "Cupom" : o.type === "brinde" ? "Brinde" : "Oferta", title: o.title,
        text: `🔥 ${o.title}\n🏪 ${o.store?.name ?? ""}${o.store?.city ? ` — ${o.store.city}` : ""}${price}${(() => { const s = formatSocials(o.store ?? {}); return s.length ? `\n\n${s.join("\n")}` : ""; })()}\n\nCorre que é por tempo limitado 👇`,
        url: `${SITE}/oferta/${o.id}`,
        image: (o.offer_media ?? []).find((m: any) => m.is_cover && m.media?.media_type !== "video")?.media?.url ?? o.image_url });
    }
    return list;
  }, [offers]);

  const [files, setFiles] = useState<Record<string, File>>({});
  useEffect(() => {
    // Preload covers so sharing starts inside the click without losing user activation.
    for (const p of offerPosts) {
      if (!p.image || files[p.id]) continue;
      loadImageFile(p.image, `oferta-${p.id}`).then((f) => setFiles((m) => ({ ...m, [p.id]: f }))).catch(() => {});
    }
  }, [offerPosts]); // eslint-disable-line react-hooks/exhaustive-deps
  const download = async (p: Post) => {
    try {
      const f = files[p.id] ?? await loadImageFile(p.image!, `oferta-${p.id}`);
      const a = document.createElement("a"); a.href = URL.createObjectURL(f); a.download = f.name; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch { window.open(p.image!, "_blank"); }
  };
  const copy = async (value: string, msg: string) => {
    try {
      await copyMarketingText(value);
      toast.success(msg);
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto da postagem e copie manualmente.");
    }
  };
  const share = async (p: Post) => {
    if (navigator.share) {
      try { await navigator.share({ title: p.title, text: p.text, url: p.url }); } catch { /* cancelado */ }
    } else await copy(marketingMessage(p.text, p.url), "Texto copiado");
  };

  const renderCards = (list: Post[]) => (
      <>
        {list.map((p) => (
          <Card key={p.id} className="flex flex-col gap-3 p-4">
            <div>
              <p className="text-xs font-semibold uppercase text-primary">{p.group}</p>
              <h3 className="font-semibold">{p.title}</h3>
            </div>
            {p.image && <img src={p.image} alt={`Capa: ${p.title}`} loading="lazy" className="h-48 w-full rounded-md bg-muted object-contain" />}
            <pre className="flex-1 whitespace-pre-wrap rounded-md bg-muted p-3 font-sans text-sm">{p.text}{"\n\n"}{p.url}</pre>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="discount" size="sm">
                <a href={whatsappUrl(p.text, p.url)} target="_blank" rel="noopener noreferrer"
                  onClick={(e) => {
                    const f = files[p.id];
                    if (canShareImage(navigator, f)) {
                      e.preventDefault();
                      navigator.share({ files: [f!], text: marketingMessage(p.text, p.url) }).catch(() => {});
                      return;
                    }
                    // Start copying during the click; never await before opening WhatsApp.
                    void copyMarketingText(marketingMessage(p.text, p.url)).catch(() => {
                      toast.warning("Se a mensagem não aparecer no WhatsApp, volte e use Copiar texto.");
                    });
                  }}><MessageCircle className="mr-1 h-4 w-4" />WhatsApp</a>
              </Button>
              <Button size="sm" variant="outline" onClick={() => copy(marketingMessage(p.text, p.url), "Texto copiado")}><Copy className="mr-1 h-4 w-4" />Copiar texto</Button>
              <Button size="sm" variant="outline" onClick={() => copy(p.url, "Link copiado")}><Link2 className="mr-1 h-4 w-4" />Copiar link</Button>
              {p.image && <Button size="sm" variant="outline" onClick={() => download(p)}><Download className="mr-1 h-4 w-4" />Baixar imagem</Button>}
              <Button size="sm" variant="ghost" onClick={() => share(p)}><Share2 className="mr-1 h-4 w-4" />Compartilhar</Button>
            </div>
          </Card>
        ))}
      </>
  );
  const storeName = stores.find((s) => s.id === storeId)?.name;
  const hasFilters = storeId || city || type || q;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Divulgação</h2>
        <p className="text-sm text-muted-foreground">Postagens prontas para WhatsApp, Instagram e Facebook. Os links já mostram foto e título ao colar.</p>
      </div>
      <AdminStoreSocials onSaved={() => setReload((n) => n + 1)} />
      <div className="grid gap-4 md:grid-cols-2">
        {renderCards(fixedPosts)}
      </div>
      <section className="space-y-3 pt-4">
        <div>
          <h3 className="text-lg font-bold">Anúncios por empresa</h3>
          <p className="text-sm text-muted-foreground">Filtre para encontrar o anúncio que quer divulgar.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Popover open={openStore} onOpenChange={setOpenStore}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" aria-label="Empresa" className="justify-between font-normal">
                <span className="truncate">{storeName ?? "Todas as empresas"}</span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar empresa..." />
                <CommandList>
                  <CommandEmpty>Nenhuma empresa encontrada.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem value="__todas" onSelect={() => { setStoreId(""); setOpenStore(false); }}>Todas as empresas</CommandItem>
                    {stores.map((s) => (
                      <CommandItem key={s.id} value={`${s.name} ${s.city ?? ""} ${s.id}`} onSelect={() => { setStoreId(s.id); setOpenStore(false); }}>
                        <Check className={`mr-2 h-4 w-4 ${storeId === s.id ? "opacity-100" : "opacity-0"}`} />
                        <span className="truncate">{s.name}</span>
                        {s.city && <span className="ml-auto text-xs text-muted-foreground">{s.city}</span>}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <select aria-label="Cidade" value={city} onChange={(e) => setCity(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Todas as cidades</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select aria-label="Tipo" value={type} onChange={(e) => setType(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Todos os tipos</option>
            <option value="desconto">Desconto</option>
            <option value="cupom">Cupom</option>
            <option value="brinde">Brinde</option>
          </select>
          <Input placeholder="Buscar pelo título..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar pelo título" />
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{loading ? "Carregando..." : offersError ? "Falha ao carregar anúncios" : `${total} anúncio${total === 1 ? "" : "s"} encontrado${total === 1 ? "" : "s"}`}</span>
          {hasFilters && (
            <Button size="sm" variant="ghost" onClick={() => { setStoreId(""); setCity(""); setType(""); setQ(""); }}>
              <X className="mr-1 h-4 w-4" />Limpar filtros
            </Button>
          )}
        </div>
        {!loading && offersError ? (
          <div role="alert" className="flex flex-wrap items-center justify-center gap-3 bg-muted p-6 text-sm">
            <span>Não foi possível carregar os anúncios. Tente novamente.</span>
            <Button variant="outline" size="sm" onClick={() => setReload((n) => n + 1)}>Tentar novamente</Button>
          </div>
        ) : !loading && offerPosts.length === 0 ? (
          <p className="rounded-md bg-muted p-6 text-center text-sm text-muted-foreground">Nenhum anúncio ativo encontrado com esses filtros.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">{renderCards(offerPosts)}</div>
        )}
        {offerPosts.length < total && (
          <div className="flex justify-center">
            <Button variant="outline" disabled={loading} onClick={() => setPage((n) => n + 1)}>Carregar mais</Button>
          </div>
        )}
      </section>
    </div>
  );
}

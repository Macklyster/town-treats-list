import { useEffect, useState } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { PageHero } from "@/components/site/PageHero";
import { SectionCard } from "@/components/site/SectionCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as LucideIcons from "lucide-react";
import { Check, X, Star, Pencil, Trash2, ArrowUp, ArrowDown, Plus, Tag, Copy, Images } from "lucide-react";
import { AdminBroadcast } from "@/components/admin/AdminBroadcast";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { AdminDutySettings } from "@/components/admin/AdminDutySettings";
import { AdminReviews } from "@/components/admin/AdminReviews";
import { AdminColetivas } from "@/components/admin/AdminColetivas";
import { AdminLeiloes } from "@/components/admin/AdminLeiloes";
import { AdminOfertasInvisiveis } from "@/components/admin/AdminOfertasInvisiveis";
import { AdminMedia } from "@/components/admin/AdminMedia";
import { AdminEventos } from "@/components/admin/AdminEventos";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { OfferBulkBar } from "@/components/cms/OfferBulkBar";
import { duplicateOffer } from "@/lib/media-api";
import { StoreApproveDialog } from "@/components/admin/StoreApproveDialog";

type Category = {
  slug: string;
  name: string;
  icon: string | null;
  sort_order: number;
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const CategoryIcon = ({ name, className }: { name?: string | null; className?: string }) => {
  const Icon = (name && (LucideIcons as any)[name]) || Tag;
  return <Icon className={className} />;
};

type AdminOffer = {
  id: string;
  title: string;
  status: string;
  featured: boolean;
  is_flash: boolean;
  flash_ends_at: string | null;
  flash_duration_hours: number | null;
  store: { name: string } | null;
};
type AdminStore = {
  id: string;
  name: string;
  approved: boolean;
  owner_id: string;
  featured_badge: boolean;
  plan_slug?: string | null;
  plan_name?: string | null;
  subscription_status?: string | null;
  trial_days_override?: number | null;
  trial_granted_at?: string | null;
  trial_ends_at?: string | null;
};

const ELIGIBLE_PLANS = new Set(["destaque", "plus"]);
const ACTIVE_SUB_STATUSES = new Set(["active", "trialing", "past_due"]);

export default function Admin() {
  const [offers, setOffers] = useState<AdminOffer[]>([]);
  const [stores, setStores] = useState<AdminStore[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [eventCount, setEventCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [coletivaCount, setColetivaCount] = useState(0);
  const [leilaoCount, setLeilaoCount] = useState(0);
  const [invisivelCount, setInvisivelCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedOffers, setSelectedOffers] = useState<string[]>([]);
  const [approveStore, setApproveStore] = useState<AdminStore | null>(null);

  const toggleSelect = (id: string) =>
    setSelectedOffers((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleSelectAll = () =>
    setSelectedOffers((prev) => (prev.length === offers.length ? [] : offers.map((o) => o.id)));

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateOffer(id);
      toast.success("Oferta duplicada como rascunho");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState<Category>({ slug: "", name: "", icon: "", sort_order: 0 });
  const [slugTouched, setSlugTouched] = useState(false);

  const load = async () => {
    setLoading(true);
    const [
      { data: offs },
      { data: sts },
      { data: cats },
      { data: subs },
      { count: eventCountResult },
      { count: notificationCountResult },
      { count: reviewCountResult },
      { count: coletivaCountResult },
      { count: leilaoCountResult },
      { count: invisivelCountResult },
    ] = await Promise.all([
      supabase
        .from("offers")
        .select("id,title,status,featured,is_flash,flash_ends_at,flash_duration_hours, store:stores(name)")
        .order("created_at", { ascending: false }),
      supabase
        .from("stores")
        .select("id,name,approved,owner_id,featured_badge,trial_days_override,trial_granted_at")
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("slug,name,icon,sort_order").order("sort_order", { ascending: true }),
      supabase
        .from("subscriptions")
        .select("store_id,status,current_period_end,plan:plans(slug,name,sort_order)")
        .order("created_at", { ascending: false }),
      supabase.from("events" as any).select("*", { count: "exact", head: true }),
      supabase.from("notifications_log" as any).select("*", { count: "exact", head: true }),
      supabase.from("offer_reviews" as any).select("*", { count: "exact", head: true }),
      supabase.from("group_offers" as any).select("*", { count: "exact", head: true }),
      supabase.from("auction_offers" as any).select("*", { count: "exact", head: true }),
      supabase.from("geo_offers" as any).select("*", { count: "exact", head: true }),
    ]);
    const subsByStore = new Map<
      string,
      { plan_slug: string | null; plan_name: string | null; status: string; current_period_end: string | null }
    >();
    (subs ?? []).forEach((row: any) => {
      if (!row.store_id) return;
      const existing = subsByStore.get(row.store_id);
      const isActive = ACTIVE_SUB_STATUSES.has(row.status);
      // prefer most recent active sub (subs are ordered by created_at desc)
      if (!existing && isActive) {
        subsByStore.set(row.store_id, {
          plan_slug: row.plan?.slug ?? null,
          plan_name: row.plan?.name ?? null,
          status: row.status,
          current_period_end: row.current_period_end ?? null,
        });
      }
    });
    setOffers((offs ?? []) as any);
    setStores(
      ((sts ?? []) as any[]).map((s) => {
        const sub = subsByStore.get(s.id);
        return {
          ...s,
          plan_slug: sub?.plan_slug ?? null,
          plan_name: sub?.plan_name ?? null,
          subscription_status: sub?.status ?? null,
          trial_ends_at: sub?.status === "trialing" ? sub?.current_period_end ?? null : null,
        } as AdminStore;
      }),
    );
    setCategories((cats ?? []) as any);
    setEventCount(eventCountResult ?? 0);
    setNotificationCount(notificationCountResult ?? 0);
    setReviewCount(reviewCountResult ?? 0);
    setColetivaCount(coletivaCountResult ?? 0);
    setLeilaoCount(leilaoCountResult ?? 0);
    setInvisivelCount(invisivelCountResult ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNewCategory = () => {
    setEditingCat(null);
    setSlugTouched(false);
    setCatForm({ slug: "", name: "", icon: "", sort_order: (categories.at(-1)?.sort_order ?? 0) + 1 });
    setCatDialogOpen(true);
  };

  const openEditCategory = (c: Category) => {
    setEditingCat(c);
    setSlugTouched(true);
    setCatForm({ ...c, icon: c.icon ?? "" });
    setCatDialogOpen(true);
  };

  const saveCategory = async () => {
    const name = catForm.name.trim();
    const slug = slugify(catForm.slug || name);
    if (!name || !slug) return toast.error("Nome e slug são obrigatórios");
    const payload = { name, slug, icon: catForm.icon?.trim() || null, sort_order: catForm.sort_order };
    const { error } = editingCat
      ? await supabase.from("categories").update(payload).eq("slug", editingCat.slug)
      : await supabase.from("categories").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editingCat ? "Categoria atualizada" : "Categoria criada");
    setCatDialogOpen(false);
    load();
  };

  const deleteCategory = async (slug: string) => {
    const { error } = await supabase.from("categories").delete().eq("slug", slug);
    if (error) return toast.error(error.message);
    toast.success("Categoria excluída");
    load();
  };

  const moveCategory = async (index: number, dir: -1 | 1) => {
    const a = categories[index];
    const b = categories[index + dir];
    if (!a || !b) return;
    const { error } = await supabase
      .from("categories")
      .upsert([
        { slug: a.slug, name: a.name, icon: a.icon, sort_order: b.sort_order },
        { slug: b.slug, name: b.name, icon: b.icon, sort_order: a.sort_order },
      ], { onConflict: "slug" });
    if (error) return toast.error(error.message);
    load();
  };

  const updateOffer = async (id: string, patch: { status?: "pending" | "approved" | "rejected" | "paused"; featured?: boolean; is_flash?: boolean; flash_duration_hours?: number }) => {
    const before = offers.find((x) => x.id === id);
    const { error } = await supabase.from("offers").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Atualizado");
    // Auto-notify followers when a flash offer becomes approved
    if (before?.is_flash && before.status !== "approved" && patch.status === "approved") {
      supabase.functions.invoke("notify-flash-offer", {
        body: { offer_id: id, audience: "store_followers" },
      }).then(({ data, error: e }) => {
        if (e) toast.error("Falha ao notificar seguidores");
        else toast.success(`Alerta enviado para ${data?.success ?? 0} seguidor(es)`);
      });
    }
    load();
  };

  const sendFlashBroadcast = async (id: string) => {
    const { data, error } = await supabase.functions.invoke("notify-flash-offer", {
      body: { offer_id: id, audience: "broadcast" },
    });
    if (error) return toast.error("Falha ao enviar broadcast");
    toast.success(`Broadcast enviado para ${data?.success ?? 0} usuário(s)`);
  };

  const updateStore = async (
    id: string,
    patch: { approved?: boolean; featured_badge?: boolean },
  ) => {
    const { error } = await supabase.from("stores").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Atualizado");
    load();
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container flex-1 space-y-8 py-8 md:py-10">
        <PageHero
          eyebrow="Administração"
          title="Painel Admin"
          subtitle="Aprove ofertas, gerencie lojistas e destaques da plataforma."
          crumbs={[{ label: "Admin" }]}
          compact
        />


        <Tabs defaultValue="offers">
          <TabsList>
            <TabsTrigger value="offers">Ofertas ({offers.length})</TabsTrigger>
            <TabsTrigger value="stores">Lojas ({stores.length})</TabsTrigger>
            <TabsTrigger value="categories">Categorias ({categories.length})</TabsTrigger>
            <TabsTrigger value="notifications">Notificações ({notificationCount})</TabsTrigger>
            <TabsTrigger value="reviews">Avaliações ({reviewCount})</TabsTrigger>
            <TabsTrigger value="coletivas">Coletivas ({coletivaCount})</TabsTrigger>
            <TabsTrigger value="leiloes">Leilões ({leilaoCount})</TabsTrigger>
            <TabsTrigger value="invisiveis">Invisíveis ({invisivelCount})</TabsTrigger>
            <TabsTrigger value="eventos">Eventos ({eventCount})</TabsTrigger>
            <TabsTrigger value="media">Mídia</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="offers" className="mt-6">
            <SectionCard eyebrow="Moderação" title="Ofertas" description="Aprove, rejeite, destaque ou dispare relâmpagos das ofertas enviadas.">
              {loading ? <p>Carregando…</p> : (

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-muted-foreground">
                        <tr>
                          <th className="py-2 w-8">
                            <Checkbox
                              checked={offers.length > 0 && selectedOffers.length === offers.length}
                              onCheckedChange={toggleSelectAll}
                              aria-label="Selecionar todas"
                            />
                          </th>
                          <th className="py-2">Título</th><th>Loja</th><th>Status</th><th>Relâmpago</th><th>Destaque</th><th className="text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {offers.map((o) => (
                          <tr key={o.id} className={selectedOffers.includes(o.id) ? "bg-muted/40" : ""}>
                            <td className="py-3">
                              <Checkbox
                                checked={selectedOffers.includes(o.id)}
                                onCheckedChange={() => toggleSelect(o.id)}
                                aria-label={`Selecionar ${o.title}`}
                              />
                            </td>
                            <td className="py-3 font-medium text-foreground">{o.title}</td>
                            <td>{o.store?.name ?? "—"}</td>
                            <td><Badge variant={o.status === "approved" ? "default" : "secondary"}>{o.status}</Badge></td>
                            <td>
                              <div className="inline-flex items-center gap-2">
                                <Switch
                                  checked={o.is_flash}
                                  onCheckedChange={(v) => updateOffer(o.id, { is_flash: v })}
                                  aria-label="Marcar como relâmpago"
                                />
                                {o.is_flash && (
                                  <Input
                                    type="number"
                                    min={1}
                                    max={72}
                                    defaultValue={o.flash_duration_hours ?? 2}
                                    className="h-8 w-16"
                                    onBlur={(e) => {
                                      const v = Math.max(1, Math.min(72, parseInt(e.target.value || "0") || 2));
                                      if (v !== o.flash_duration_hours) updateOffer(o.id, { flash_duration_hours: v });
                                    }}
                                  />
                                )}
                              </div>
                            </td>
                            <td>{o.featured ? <Star className="h-4 w-4 fill-accent text-accent text-[#10100f]" /> : "—"}</td>
                            <td className="text-right">
                              <div className="inline-flex gap-2">
                                {o.status !== "approved" && (
                                  <Button size="sm" variant="accent" onClick={() => updateOffer(o.id, { status: "approved" })}>
                                    <Check className="h-3.5 w-3.5" /> Aprovar
                                  </Button>
                                )}
                                {o.status !== "rejected" && (
                                  <Button size="sm" variant="outline" onClick={() => updateOffer(o.id, { status: "rejected" })}>
                                    <X className="h-3.5 w-3.5" /> Rejeitar
                                  </Button>
                                )}
                                <Button size="sm" variant="ghost" onClick={() => updateOffer(o.id, { featured: !o.featured })}>
                                  <Star className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="sm" variant="ghost" title="Duplicar" onClick={() => handleDuplicate(o.id)}>
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                                {o.is_flash && o.status === "approved" && (
                                  <Button size="sm" variant="outline" onClick={() => sendFlashBroadcast(o.id)}>
                                    📣 Broadcast
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </SectionCard>

            <div className="mt-4">
              <OfferBulkBar
                ids={selectedOffers}
                categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
                onCleared={() => setSelectedOffers([])}
                onDone={() => {
                  setSelectedOffers([]);
                  load();
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="stores" className="mt-6">
            <SectionCard eyebrow="Lojistas" title="Lojas" description="Aprove lojas, gerencie planos e ative o selo de destaque.">

                <TooltipProvider>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-muted-foreground">
                        <tr>
                          <th className="py-2">Nome</th>
                          <th>Status</th>
                          <th>Plano</th>
                          <th>Teste grátis</th>
                          <th>Selo Destaque</th>
                          <th className="text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {stores.map((s) => {
                          const eligible =
                            s.approved && !!s.plan_slug && ELIGIBLE_PLANS.has(s.plan_slug);
                          const checked = !!s.featured_badge;
                          const switchEl = (
                            <Switch
                              checked={checked}
                              disabled={!eligible && !checked}
                              onCheckedChange={(v) => updateStore(s.id, { featured_badge: v })}
                              aria-label="Selo Loja Destaque"
                            />
                          );
                          return (
                            <tr key={s.id}>
                              <td className="py-3 font-medium text-foreground">{s.name}</td>
                              <td>
                                <Badge variant={s.approved ? "default" : "secondary"}>
                                  {s.approved ? "Aprovada" : "Pendente"}
                                </Badge>
                              </td>
                              <td>
                                {s.plan_name ? (
                                  <Badge variant={ELIGIBLE_PLANS.has(s.plan_slug ?? "") ? "default" : "secondary"}>
                                    {s.plan_name}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                              <td className="text-muted-foreground">
                                {s.trial_ends_at ? (
                                  <Badge variant="default">
                                    Trial {s.trial_days_override ?? "—"}d até{" "}
                                    {new Date(s.trial_ends_at).toLocaleDateString("pt-BR")}
                                  </Badge>
                                ) : s.trial_days_override ? (
                                  <span className="text-xs">{s.trial_days_override} dias no checkout</span>
                                ) : (
                                  <span className="text-xs">Padrão</span>
                                )}
                              </td>
                              <td>
                                {eligible || checked ? (
                                  switchEl
                                ) : (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="inline-block">{switchEl}</span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Disponível apenas para planos Destaque e Plus
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </td>
                              <td className="text-right">
                                <Button
                                  size="sm"
                                  variant={s.approved ? "outline" : "accent"}
                                  onClick={() =>
                                    s.approved
                                      ? updateStore(s.id, { approved: false })
                                      : setApproveStore(s)
                                  }
                                >
                                  {s.approved ? "Suspender" : "Aprovar"}
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </TooltipProvider>
                <StoreApproveDialog
                  open={!!approveStore}
                  onOpenChange={(v) => !v && setApproveStore(null)}
                  store={approveStore}
                  onDone={load}
                />
            </SectionCard>
          </TabsContent>

          <TabsContent value="categories" className="mt-6">
            <SectionCard
              eyebrow="Taxonomia"
              title="Categorias"
              description="Organize as categorias exibidas em toda a plataforma."
              action={
                <Button size="sm" variant="accent" onClick={openNewCategory}>
                  <Plus className="h-4 w-4" /> Nova categoria
                </Button>
              }
            >
              <div className="overflow-x-auto">

                  <table className="w-full text-sm">
                    <thead className="text-left text-muted-foreground">
                      <tr>
                        <th className="py-2 w-16">Ordem</th>
                        <th>Nome</th>
                        <th>Slug</th>
                        <th>Ícone</th>
                        <th className="text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {categories.map((c, i) => (
                        <tr key={c.slug}>
                          <td className="py-3">
                            <div className="inline-flex items-center gap-1">
                              <span className="w-6 text-muted-foreground">{c.sort_order}</span>
                              <Button size="icon" variant="ghost" className="h-7 w-7" disabled={i === 0} onClick={() => moveCategory(i, -1)}>
                                <ArrowUp className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7" disabled={i === categories.length - 1} onClick={() => moveCategory(i, 1)}>
                                <ArrowDown className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                          <td className="font-medium text-foreground">
                            <div className="inline-flex items-center gap-2">
                              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-accent/15 text-accent-strong">
                                <CategoryIcon name={c.icon} className="h-4 w-4" />
                              </span>
                              {c.name}
                            </div>
                          </td>
                          <td className="text-muted-foreground">{c.slug}</td>
                          <td className="text-muted-foreground">{c.icon ?? "—"}</td>
                          <td className="text-right">
                            <div className="inline-flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => openEditCategory(c)}>
                                <Pencil className="h-3.5 w-3.5" /> Editar
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="ghost">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta ação não pode ser desfeita. Ofertas vinculadas a "{c.name}" podem ficar sem categoria.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteCategory(c.slug)}>Excluir</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {categories.length === 0 && !loading && (
                        <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">Nenhuma categoria cadastrada.</td></tr>
                      )}
                    </tbody>
                  </table>
              </div>
            </SectionCard>


          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <AdminBroadcast />
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <AdminReviews />
          </TabsContent>

          <TabsContent value="coletivas" className="mt-6">
            <AdminColetivas />
          </TabsContent>

          <TabsContent value="leiloes" className="mt-6">
            <AdminLeiloes />
          </TabsContent>

          <TabsContent value="invisiveis" className="mt-6">
            <AdminOfertasInvisiveis />
          </TabsContent>

          <TabsContent value="eventos" className="mt-6">
            <AdminEventos />
          </TabsContent>

          <TabsContent value="media" className="mt-6">
            <AdminMedia />
          </TabsContent>



          <TabsContent value="settings" className="mt-6">
            <AdminSettings />
            <div className="mt-6"><AdminDutySettings /></div>
          </TabsContent>
        </Tabs>

        <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCat ? "Editar categoria" : "Nova categoria"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cat-name">Nome</Label>
                <Input
                  id="cat-name"
                  value={catForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setCatForm((f) => ({
                      ...f,
                      name,
                      slug: slugTouched ? f.slug : slugify(name),
                    }));
                  }}
                  maxLength={60}
                  placeholder="Ex: Alimentação"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-slug">Slug</Label>
                <Input
                  id="cat-slug"
                  value={catForm.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setCatForm((f) => ({ ...f, slug: e.target.value }));
                  }}
                  onBlur={(e) => setCatForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                  maxLength={60}
                  placeholder="alimentacao"
                  disabled={!!editingCat}
                />
                {editingCat && (
                  <p className="text-xs text-muted-foreground">O slug não pode ser alterado após a criação.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-icon">Ícone (Lucide)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="cat-icon"
                    value={catForm.icon ?? ""}
                    onChange={(e) => setCatForm((f) => ({ ...f, icon: e.target.value }))}
                    maxLength={40}
                    placeholder="Ex: UtensilsCrossed, Sparkles, ShoppingBag"
                  />
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent-strong">
                    <CategoryIcon name={catForm.icon} className="h-5 w-5" />
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use o nome PascalCase de um ícone do{" "}
                  <a href="https://lucide.dev/icons" target="_blank" rel="noreferrer" className="underline">
                    lucide.dev
                  </a>
                  .
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-order">Ordem</Label>
                <Input
                  id="cat-order"
                  type="number"
                  value={catForm.sort_order}
                  onChange={(e) => setCatForm((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCatDialogOpen(false)}>Cancelar</Button>
              <Button variant="accent" onClick={saveCategory}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}

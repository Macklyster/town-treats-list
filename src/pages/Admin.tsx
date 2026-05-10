import { useEffect, useState } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
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
import { Check, X, Star, Pencil, Trash2, ArrowUp, ArrowDown, Plus, Tag } from "lucide-react";
import { AdminBroadcast } from "@/components/admin/AdminBroadcast";

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
  store: { name: string } | null;
};
type AdminStore = {
  id: string;
  name: string;
  approved: boolean;
  owner_id: string;
};

export default function Admin() {
  const [offers, setOffers] = useState<AdminOffer[]>([]);
  const [stores, setStores] = useState<AdminStore[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState<Category>({ slug: "", name: "", icon: "", sort_order: 0 });
  const [slugTouched, setSlugTouched] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: offs }, { data: sts }, { data: cats }] = await Promise.all([
      supabase
        .from("offers")
        .select("id,title,status,featured, store:stores(name)")
        .order("created_at", { ascending: false }),
      supabase.from("stores").select("id,name,approved,owner_id").order("created_at", { ascending: false }),
      supabase.from("categories").select("slug,name,icon,sort_order").order("sort_order", { ascending: true }),
    ]);
    setOffers((offs ?? []) as any);
    setStores((sts ?? []) as any);
    setCategories((cats ?? []) as any);
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

  const updateOffer = async (id: string, patch: { status?: "pending" | "approved" | "rejected" | "paused"; featured?: boolean }) => {
    const { error } = await supabase.from("offers").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Atualizado");
    load();
  };

  const updateStore = async (id: string, patch: Partial<AdminStore>) => {
    const { error } = await supabase.from("stores").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Atualizado");
    load();
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <Header />
      <main className="container flex-1 py-10">
        <h1 className="mb-2 text-display text-foreground">Painel Admin</h1>
        <p className="mb-6 text-muted-foreground">Aprove ofertas, gerencie lojistas e destaques.</p>

        <Tabs defaultValue="offers">
          <TabsList>
            <TabsTrigger value="offers">Ofertas ({offers.length})</TabsTrigger>
            <TabsTrigger value="stores">Lojas ({stores.length})</TabsTrigger>
            <TabsTrigger value="categories">Categorias ({categories.length})</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
          </TabsList>

          <TabsContent value="offers" className="mt-6">
            <Card>
              <CardHeader><CardTitle>Ofertas</CardTitle></CardHeader>
              <CardContent>
                {loading ? <p>Carregando…</p> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-muted-foreground">
                        <tr><th className="py-2">Título</th><th>Loja</th><th>Status</th><th>Destaque</th><th className="text-right">Ações</th></tr>
                      </thead>
                      <tbody className="divide-y">
                        {offers.map((o) => (
                          <tr key={o.id}>
                            <td className="py-3 font-medium text-foreground">{o.title}</td>
                            <td>{o.store?.name ?? "—"}</td>
                            <td><Badge variant={o.status === "approved" ? "default" : "secondary"}>{o.status}</Badge></td>
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
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stores" className="mt-6">
            <Card>
              <CardHeader><CardTitle>Lojas</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-muted-foreground">
                      <tr><th className="py-2">Nome</th><th>Status</th><th className="text-right">Ações</th></tr>
                    </thead>
                    <tbody className="divide-y">
                      {stores.map((s) => (
                        <tr key={s.id}>
                          <td className="py-3 font-medium text-foreground">{s.name}</td>
                          <td><Badge variant={s.approved ? "default" : "secondary"}>{s.approved ? "Aprovada" : "Pendente"}</Badge></td>
                          <td className="text-right">
                            <Button size="sm" variant={s.approved ? "outline" : "accent"} onClick={() => updateStore(s.id, { approved: !s.approved })}>
                              {s.approved ? "Suspender" : "Aprovar"}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Categorias</CardTitle>
                <Button size="sm" variant="accent" onClick={openNewCategory}>
                  <Plus className="h-4 w-4" /> Nova categoria
                </Button>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <AdminBroadcast />
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

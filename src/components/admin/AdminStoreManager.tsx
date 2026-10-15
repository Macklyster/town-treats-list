import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ImageUploader } from "@/components/site/ImageUploader";
import { LocationPicker } from "@/components/site/LocationPicker";
import { StateSelect, CitySelect } from "@/components/site/LocationSelect";
import { OpeningHoursEditor, normalizeOpeningHours } from "@/components/site/OpeningHoursEditor";
import { toast } from "sonner";
import { Eye, EyeOff, Search, ExternalLink } from "lucide-react";

type Store = any;
const T = (s: any) => (typeof s === "string" ? s.trim() : s);

async function audit(store_id: string, section: string, changes: unknown) {
  const { data } = await supabase.auth.getUser();
  await supabase.from("admin_audit_log").insert({ admin_id: data.user!.id, store_id, section, changes: changes as any });
}

export function AdminStoreManager() {
  const [stores, setStores] = useState<Store[]>([]);
  const [q, setQ] = useState("");
  const [selId, setSelId] = useState<string | null>(null);

  const loadStores = () =>
    supabase.from("stores").select("id,name,city,state,approved,owner_id").order("name").then(({ data }) => setStores(data ?? []));
  useEffect(() => { loadStores(); }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return stores.filter((s) => !t || `${s.name} ${s.city} ${s.state}`.toLowerCase().includes(t));
  }, [stores, q]);

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <Card className="h-fit">
        <CardHeader><CardTitle className="text-base">Selecionar lojista</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Nome ou cidade" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="max-h-[60vh] space-y-1 overflow-y-auto">
            {filtered.map((s) => (
              <button key={s.id} onClick={() => setSelId(s.id)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${selId === s.id ? "bg-muted font-semibold" : ""}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate">{s.name}</span>
                  {!s.approved && <Badge variant="secondary">Pendente</Badge>}
                </div>
                <span className="text-xs text-muted-foreground">{s.city}/{s.state}</span>
              </button>
            ))}
            {!filtered.length && <p className="text-sm text-muted-foreground">Nenhuma loja.</p>}
          </div>
        </CardContent>
      </Card>
      {selId ? <StoreSheet key={selId} id={selId} onSaved={loadStores} /> :
        <Card><CardContent className="py-16 text-center text-muted-foreground">Selecione um lojista para começar.</CardContent></Card>}
    </div>
  );
}

function StoreSheet({ id, onSaved }: { id: string; onSaved: () => void }) {
  const [s, setS] = useState<Store | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [owner, setOwner] = useState<{ email?: string; roles: string[]; last_sign_in_at?: string } | null>(null);
  const [reveal, setReveal] = useState(false);
  const [email, setEmail] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [sub, setSub] = useState<any>(null);
  const [stats, setStats] = useState({ offers: 0, events: 0, reviews: 0, score: null as number | null });
  const [log, setLog] = useState<any[]>([]);
  const [confirm, setConfirm] = useState<{ text: string; run: () => Promise<unknown> } | null>(null);
  const [busy, setBusy] = useState(false);

  const loadLog = () => supabase.from("admin_audit_log").select("*").eq("store_id", id).order("created_at", { ascending: false }).limit(20).then(({ data }) => setLog(data ?? []));

  useEffect(() => {
    (async () => {
      const { data: st } = await supabase.from("stores").select("*").eq("id", id).single();
      setS({ ...st, opening_hours: normalizeOpeningHours(st?.opening_hours) });
      const [pr, pl, sb, o, e, r, f] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", st!.owner_id).maybeSingle(),
        supabase.from("plans").select("id,name,slug").order("sort_order"),
        supabase.from("subscriptions").select("*").eq("store_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("offers").select("id", { count: "exact", head: true }).eq("store_id", id),
        supabase.from("events").select("id", { count: "exact", head: true }).eq("store_id", id),
        supabase.from("offer_reviews").select("id", { count: "exact", head: true }).eq("store_id", id),
        supabase.from("company_flyscore").select("overall").eq("store_id", id).maybeSingle(),
      ]);
      setProfile(pr.data ?? { id: st!.owner_id, full_name: "", phone: "" });
      setPlans(pl.data ?? []);
      setSub(sb.data ?? { store_id: id, plan_id: "", status: "active", current_period_end: null });
      setStats({ offers: o.count ?? 0, events: e.count ?? 0, reviews: r.count ?? 0, score: f.data?.overall ?? null });
      const { data: ow } = await supabase.functions.invoke("admin-manage-user", { body: { action: "get", user_id: st!.owner_id } });
      if (ow && !ow.error) { setOwner(ow); setEmail(ow.email ?? ""); setRoles(ow.roles ?? []); }
      loadLog();
    })();
  }, [id]);

  if (!s) return <Card><CardContent className="py-16 text-center text-muted-foreground">Carregando…</CardContent></Card>;
  const set = (patch: Partial<Store>) => setS({ ...s, ...patch });

  const saveStore = async (section: string, fields: string[]) => {
    setBusy(true);
    const patch: any = {};
    fields.forEach((k) => (patch[k] = T(s[k]) === "" && k !== "name" ? null : T(s[k])));
    const { error } = await supabase.from("stores").update(patch).eq("id", id);
    setBusy(false);
    if (error) return toast.error(error.message);
    await audit(id, section, patch); loadLog(); onSaved();
    toast.success("Salvo");
  };

  const callFn = async (body: any, ok: string) => {
    const { data, error } = await supabase.functions.invoke("admin-manage-user", { body: { ...body, user_id: s.owner_id, store_id: id } });
    if (error || data?.error) return toast.error(data?.error ?? error?.message ?? "Erro");
    toast.success(ok); loadLog();
  };

  const mask = (v?: string | null) => (!v ? "—" : reveal ? v : v.replace(/.(?=.{3})/g, "•"));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>{s.name}</CardTitle>
          <a href={`/loja/${s.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
            Ver página <ExternalLink className="h-3 w-3" />
          </a>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[["Ofertas", stats.offers], ["Eventos", stats.events], ["Avaliações", stats.reviews], ["FlyScore", stats.score ?? "—"]].map(([l, v]) => (
            <div key={l as string} className="rounded-lg border p-3 text-center">
              <div className="text-2xl font-bold">{v as any}</div><div className="text-xs text-muted-foreground">{l}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Section title="Identidade" onSave={() => saveStore("identidade", ["name", "slug", "description", "logo_url", "cover_url"])} busy={busy}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Nome</Label><Input value={s.name ?? ""} onChange={(e) => set({ name: e.target.value })} /></div>
          <div><Label>Endereço da página (slug)</Label><Input value={s.slug ?? ""} onChange={(e) => set({ slug: e.target.value })} /></div>
        </div>
        <div><Label>Descrição</Label><Textarea rows={3} value={s.description ?? ""} onChange={(e) => set({ description: e.target.value })} /></div>
        <ImageUploader value={s.logo_url ?? ""} onChange={(url) => set({ logo_url: url })} storeId={id} bucket="store-logos"
          label="Logo" aspect="square" maxWidth={512} accept={["image/svg+xml", "image/png"]} maxBytes={2 * 1024 * 1024} />
        <ImageUploader value={s.cover_url ?? ""} onChange={(url) => set({ cover_url: url })} storeId={id} bucket="offer-images"
          label="Capa" aspect="video" maxWidth={1600} accept={["image/jpeg", "image/png", "image/webp"]} maxBytes={5 * 1024 * 1024} />
      </Section>

      <Section title="Contato e localização" onSave={() => saveStore("contato", ["phone", "whatsapp", "instagram", "address", "state", "city", "latitude", "longitude"])} busy={busy}>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><Label>Telefone</Label><Input value={s.phone ?? ""} onChange={(e) => set({ phone: e.target.value })} /></div>
          <div><Label>WhatsApp</Label><Input value={s.whatsapp ?? ""} onChange={(e) => set({ whatsapp: e.target.value })} /></div>
          <div><Label>Instagram</Label><Input value={s.instagram ?? ""} onChange={(e) => set({ instagram: e.target.value })} /></div>
        </div>
        <div><Label>Endereço</Label><Input value={s.address ?? ""} onChange={(e) => set({ address: e.target.value })} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>UF</Label><StateSelect value={s.state ?? ""} onChange={(uf) => set({ state: uf, city: "" })} /></div>
          <div><Label>Cidade</Label><CitySelect uf={s.state ?? ""} value={s.city ?? ""} onChange={(city) => set({ city })} /></div>
        </div>
        <LocationPicker value={s.latitude != null && s.longitude != null ? { lat: s.latitude, lng: s.longitude } : null}
          onChange={({ lat, lng }) => set({ latitude: lat, longitude: lng })}
          addressQuery={[s.address, s.city, s.state, "Brasil"].filter(Boolean).join(", ")} />
      </Section>

      <Section title="Horário de funcionamento" onSave={() => saveStore("horarios", ["opening_hours"])} busy={busy}>
        <OpeningHoursEditor value={s.opening_hours} onChange={(oh) => set({ opening_hours: oh })} />
      </Section>

      <Section title="Status" onSave={() => saveStore("status", ["approved", "featured_badge", "trial_days_override"])} busy={busy}>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2"><Switch checked={!!s.approved} onCheckedChange={(v) => set({ approved: v })} /> Aprovada</label>
          <label className="flex items-center gap-2"><Switch checked={!!s.featured_badge} onCheckedChange={(v) => set({ featured_badge: v })} /> Selo de destaque</label>
          <div className="w-48"><Label>Dias de teste grátis</Label>
            <Input type="number" min={0} value={s.trial_days_override ?? ""} placeholder="Padrão"
              onChange={(e) => set({ trial_days_override: e.target.value === "" ? null : Number(e.target.value) })} /></div>
        </div>
      </Section>

      {sub && (
        <Section title="Plano e assinatura" busy={busy} onSave={() => setConfirm({
          text: "Alterar o plano manualmente (sem cobrança no Stripe)?",
          run: async () => {
            if (!sub.plan_id) { toast.error("Escolha um plano"); return; }
            const payload = { store_id: id, plan_id: sub.plan_id, status: sub.status, current_period_end: sub.current_period_end };
            const { error } = sub.id
              ? await supabase.from("subscriptions").update(payload).eq("id", sub.id)
              : await supabase.from("subscriptions").insert(payload);
            if (error) { toast.error(error.message); return; }
            await audit(id, "plano", payload); loadLog(); toast.success("Plano atualizado");
          },
        })}>
          <div className="grid gap-4 sm:grid-cols-3">
            <div><Label>Plano</Label>
              <Select value={sub.plan_id || undefined} onValueChange={(v) => setSub({ ...sub, plan_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select></div>
            <div><Label>Situação</Label>
              <Select value={sub.status} onValueChange={(v) => setSub({ ...sub, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["active", "trialing", "past_due", "canceled", "paused"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
              </Select></div>
            <div><Label>Válido até</Label>
              <Input type="date" value={sub.current_period_end ? String(sub.current_period_end).slice(0, 10) : ""}
                onChange={(e) => setSub({ ...sub, current_period_end: e.target.value ? new Date(e.target.value + "T23:59:59").toISOString() : null })} /></div>
          </div>
          {sub.stripe_subscription_id && <p className="text-xs text-muted-foreground">Esta assinatura está ligada ao Stripe; mudanças aqui não alteram a cobrança.</p>}
        </Section>
      )}

      {profile && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Dados sensíveis do dono</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setReveal(!reveal)}>
              {reveal ? <EyeOff className="mr-1 h-4 w-4" /> : <Eye className="mr-1 h-4 w-4" />}{reveal ? "Ocultar" : "Revelar"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {!reveal ? (
              <div className="grid gap-2 text-sm sm:grid-cols-3">
                <div><span className="text-muted-foreground">Nome:</span> {mask(profile.full_name)}</div>
                <div><span className="text-muted-foreground">Telefone:</span> {mask(profile.phone)}</div>
                <div><span className="text-muted-foreground">E-mail:</span> {mask(owner?.email)}</div>
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><Label>Nome completo</Label><Input value={profile.full_name ?? ""} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} /></div>
                  <div><Label>Telefone</Label><Input value={profile.phone ?? ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></div>
                </div>
                <Button size="sm" onClick={async () => {
                  const patch = { full_name: T(profile.full_name) || null, phone: T(profile.phone) || null };
                  const { error } = await supabase.from("profiles").upsert({ id: profile.id, ...patch });
                  if (error) return toast.error(error.message);
                  await audit(id, "perfil", patch); loadLog(); toast.success("Perfil salvo");
                }}>Salvar perfil</Button>

                <div className="flex flex-wrap items-end gap-3 border-t pt-4">
                  <div className="flex-1 min-w-60"><Label>E-mail de acesso</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                  <Button variant="outline" disabled={!email || email === owner?.email} onClick={() => setConfirm({
                    text: `Trocar o e-mail de acesso para ${email}? O lojista passará a entrar com este e-mail.`,
                    run: () => callFn({ action: "update_email", email }, "E-mail alterado").then(() => setOwner((o) => o && { ...o, email })),
                  })}>Alterar e-mail</Button>
                  <Button variant="outline" onClick={() => setConfirm({
                    text: "Enviar link de redefinição de senha para o e-mail do lojista?",
                    run: () => callFn({ action: "reset_password", redirect_to: `${window.location.origin}/auth` }, "Link enviado"),
                  })}>Enviar redefinição de senha</Button>
                </div>

                <div className="flex flex-wrap items-center gap-4 border-t pt-4">
                  <span className="text-sm font-medium">Papéis:</span>
                  {["lojista", "admin", "consumer"].map((r) => (
                    <label key={r} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={roles.includes(r)} onCheckedChange={(v) => setRoles(v ? [...roles, r] : roles.filter((x) => x !== r))} />{r}
                    </label>
                  ))}
                  <Button size="sm" variant="outline" onClick={() => setConfirm({
                    text: `Definir papéis como: ${roles.join(", ") || "nenhum"}?`,
                    run: () => callFn({ action: "set_roles", roles }, "Papéis atualizados"),
                  })}>Salvar papéis</Button>
                </div>
                {owner?.last_sign_in_at && <p className="text-xs text-muted-foreground">Último acesso: {new Date(owner.last_sign_in_at).toLocaleString("pt-BR")}</p>}
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Histórico de alterações</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {log.length ? log.map((l) => (
            <div key={l.id} className="flex justify-between gap-3 border-b pb-2 last:border-0">
              <span><Badge variant="secondary" className="mr-2">{l.section}</Badge>{Object.keys(l.changes ?? {}).join(", ")}</span>
              <span className="whitespace-nowrap text-muted-foreground">{new Date(l.created_at).toLocaleString("pt-BR")}</span>
            </div>
          )) : <p className="text-muted-foreground">Nenhuma alteração registrada.</p>}
        </CardContent>
      </Card>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Confirmar alteração</AlertDialogTitle>
            <AlertDialogDescription>{confirm?.text}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { const c = confirm; setConfirm(null); await c?.run(); }}>Confirmar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Section({ title, children, onSave, busy }: { title: string; children: React.ReactNode; onSave: () => void; busy: boolean }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button size="sm" disabled={busy} onClick={onSave}>Salvar</Button>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

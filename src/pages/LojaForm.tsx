import { useEffect, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { z } from "zod";
import { toast } from "sonner";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { ImageUploader } from "@/components/site/ImageUploader";
import { LocationPicker } from "@/components/site/LocationPicker";
import { StateSelect, CitySelect } from "@/components/site/LocationSelect";
import { OpeningHoursEditor, defaultOpeningHours, normalizeOpeningHours, type OpeningHours } from "@/components/site/OpeningHoursEditor";
import { DutySchedulePanel } from "@/components/painel/DutySchedulePanel";
import { PixKeyPanel } from "@/components/painel/PixKeyPanel";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { slugify } from "@/lib/format";
import { formatDoc, onlyDigits, validateLegal, type PersonType } from "@/lib/legal-doc";

const schema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(120),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  address: z.string().trim().max(255).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Informe a cidade").max(120),
  state: z.string().trim().length(2, "UF é obrigatório"),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  whatsapp: z.string().trim().max(30).optional().or(z.literal("")),
  instagram: z.string().trim().max(60).optional().or(z.literal("")),
  facebook: z.string().trim().max(120).optional().or(z.literal("")),
  tiktok: z.string().trim().max(120).optional().or(z.literal("")),
  website: z.string().trim().max(200).optional().or(z.literal("")),
  logo_url: z.string().trim().url().max(500).optional().or(z.literal("")),
  cover_url: z.string().trim().url().max(500).optional().or(z.literal("")),
});

export default function LojaForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [approved, setApproved] = useState<boolean>(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    state: "",
    phone: "",
    whatsapp: "",
    instagram: "",
    facebook: "",
    tiktok: "",
    website: "",
    logo_url: "",
    cover_url: "",
    latitude: null as number | null,
    longitude: null as number | null,
    opening_hours: defaultOpeningHours() as OpeningHours,
  });
  const [pinManuallySet, setPinManuallySet] = useState(false);
  const [legal, setLegal] = useState<{ type: PersonType; doc: string; name: string }>({ type: "pj", doc: "", name: "" });

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (data) {
        setStoreId(data.id);
        setApproved(!!data.approved);
        setForm({
          name: data.name ?? "",
          description: data.description ?? "",
          address: data.address ?? "",
          city: data.city ?? "",
          state: data.state ?? "",
          phone: data.phone ?? "",
          whatsapp: data.whatsapp ?? "",
          instagram: data.instagram ?? "",
          facebook: (data as any).facebook ?? "",
          tiktok: (data as any).tiktok ?? "",
          website: (data as any).website ?? "",
          logo_url: data.logo_url ?? "",
          cover_url: data.cover_url ?? "",
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
          opening_hours: normalizeOpeningHours((data as any).opening_hours),
        });
        if (data.latitude != null && data.longitude != null) setPinManuallySet(true);
        const { data: li } = await supabase.from("store_legal_info").select("*").eq("store_id", data.id).maybeSingle();
        if (li) setLegal({ type: li.person_type as PersonType, doc: formatDoc(li.person_type as PersonType, li.document), name: li.legal_name });
      }
    })();
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? "Dados inválidos");
      return;
    }
    const legalErr = validateLegal(legal.type, legal.doc, legal.name);
    if (legalErr) { toast.error(legalErr); return; }
    if (!user) return;
    setLoading(true);

    const payload = {
      ...form,
      name: form.name.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      address: form.address?.trim(),
      owner_id: user.id,
      slug: slugify(form.name.trim()) + "-" + user.id.slice(0, 6),
    };

    let resultId = storeId;
    if (storeId) {
      const { error } = await supabase.from("stores").update(payload).eq("id", storeId);
      if (error) { setLoading(false); return toast.error(error.message); }
    } else {
      const { data, error } = await supabase.from("stores").insert(payload).select("id").single();
      if (error) { setLoading(false); return toast.error(error.message); }
      resultId = data?.id ?? null;
      setStoreId(resultId);
    }

    if (resultId) {
      const { error } = await supabase.from("store_legal_info").upsert({
        store_id: resultId,
        person_type: legal.type,
        document: onlyDigits(legal.doc),
        legal_name: legal.name.trim(),
      });
      if (error) { setLoading(false); return toast.error("Dados de CPF/CNPJ não salvos: " + error.message); }
    }

    // Geocode in background only if user did NOT pick a point manually
    if (!pinManuallySet && resultId && form.address && form.city && form.state) {
      supabase.functions
        .invoke("geocode-store", { body: { store_id: resultId } })
        .catch(() => {});
    }

    setLoading(false);
    toast.success(storeId ? "Loja atualizada" : "Loja criada — aguardando aprovação");
    navigate("/painel-lojista");
    return undefined;
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container flex-1 py-10">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <h1 className="text-2xl font-semibold leading-none">{storeId ? "Editar loja" : "Cadastrar loja"}</h1>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nome da loja *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex gap-2">
                  {(["pj", "pf"] as PersonType[]).map((t) => (
                    <Button key={t} type="button" size="sm" variant={legal.type === t ? "default" : "outline"}
                      onClick={() => setLegal({ type: t, doc: "", name: legal.name })}>
                      {t === "pj" ? "Pessoa Jurídica (CNPJ)" : "Pessoa Física (CPF)"}
                    </Button>
                  ))}
                </div>
                <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
                  <div>
                    <Label>{legal.type === "pj" ? "CNPJ *" : "CPF *"}</Label>
                    <Input inputMode="numeric" value={legal.doc} required
                      placeholder={legal.type === "pj" ? "00.000.000/0000-00" : "000.000.000-00"}
                      onChange={(e) => setLegal({ ...legal, doc: formatDoc(legal.type, e.target.value) })} />
                  </div>
                  <div>
                    <Label>{legal.type === "pj" ? "Razão social *" : "Nome completo *"}</Label>
                    <Input value={legal.name} required maxLength={160}
                      onChange={(e) => setLegal({ ...legal, name: e.target.value })} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Usado só para verificação. Não aparece na sua página.</p>
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <Label>Endereço</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
                <div>
                  <Label>UF *</Label>
                  <StateSelect
                    value={form.state}
                    onChange={(uf) => setForm({ ...form, state: uf, city: "" })}
                  />
                </div>
                <div>
                  <Label>Cidade *</Label>
                  <CitySelect
                    uf={form.state}
                    value={form.city}
                    onChange={(city) => setForm({ ...form, city })}
                  />
                </div>
              </div>

              <LocationPicker
                value={form.latitude != null && form.longitude != null ? { lat: form.latitude, lng: form.longitude } : null}
                onChange={({ lat, lng }) => {
                  setForm((f) => ({ ...f, latitude: lat, longitude: lng }));
                  setPinManuallySet(true);
                }}
                addressQuery={[form.address, form.city, form.state, "Brasil"].filter(Boolean).join(", ")}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Telefone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <Label>WhatsApp (com DDD, só números)</Label>
                  <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="5511999999999" />
                </div>
              </div>
              <div>
                <Label>Instagram</Label>
                <Input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="@minhaloja" />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div><Label>Facebook</Label><Input value={form.facebook} onChange={(e) => setForm({ ...form, facebook: e.target.value })} placeholder="facebook.com/minhaloja" /></div>
                <div><Label>TikTok</Label><Input value={form.tiktok} onChange={(e) => setForm({ ...form, tiktok: e.target.value })} placeholder="@minhaloja" /></div>
                <div><Label>Site</Label><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="minhaloja.com.br" /></div>
              </div>

              <OpeningHoursEditor
                value={form.opening_hours}
                onChange={(oh) => setForm({ ...form, opening_hours: oh })}
              />



              <ImageUploader
                value={form.logo_url}
                onChange={(url) => setForm({ ...form, logo_url: url })}
                storeId={storeId}
                bucket="store-logos"
                label="Logo da loja"
                helperText="Envie um arquivo SVG ou PNG (até 2 MB). Recomendado: 512×512."
                aspect="square"
                maxWidth={512}
                accept={["image/svg+xml", "image/png"]}
                maxBytes={2 * 1024 * 1024}
              />

              <ImageUploader
                value={form.cover_url}
                onChange={(url) => setForm({ ...form, cover_url: url })}
                storeId={storeId}
                bucket="offer-images"
                label="Imagem de capa da empresa"
                helperText="Imagem exibida no topo da loja e nos destaques. JPG, PNG ou WebP até 5 MB. Recomendado: 1600×900."
                aspect="video"
                maxWidth={1600}
                accept={["image/jpeg", "image/png", "image/webp"]}
                maxBytes={5 * 1024 * 1024}
              />


              {!approved && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    O logo e a capa aparecem publicamente após a aprovação da loja. Se o cadastro for reprovado, as imagens enviadas são excluídas.
                  </AlertDescription>
                </Alert>
              )}
              <div className="flex gap-3 pt-2">
                <Button type="submit" variant="accent" disabled={loading}>{storeId ? "Salvar" : "Criar loja"}</Button>
                <Button type="button" variant="ghost" onClick={() => navigate("/painel-lojista")}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {storeId && (
          <div className="mx-auto mt-6 max-w-2xl">
            <DutySchedulePanel storeId={storeId} />
          </div>
        )}
        {storeId && (
          <div className="mx-auto mt-6 max-w-2xl">
            <PixKeyPanel storeId={storeId} />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

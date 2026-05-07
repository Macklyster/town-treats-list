import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { ImageUploader } from "@/components/site/ImageUploader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { slugify } from "@/lib/format";

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

const schema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(120),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  address: z.string().trim().max(255).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Informe a cidade").max(120),
  state: z.string().trim().length(2, "UF é obrigatório"),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  whatsapp: z.string().trim().max(30).optional().or(z.literal("")),
  instagram: z.string().trim().max(60).optional().or(z.literal("")),
  logo_url: z.string().trim().url().max(500).optional().or(z.literal("")),
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
    logo_url: "",
  });

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
          logo_url: data.logo_url ?? "",
        });
      }
    })();
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    if (!user) return;
    setLoading(true);

    const payload = {
      ...form,
      owner_id: user.id,
      slug: slugify(form.name) + "-" + user.id.slice(0, 6),
    };

    const { error } = storeId
      ? await supabase.from("stores").update(payload).eq("id", storeId)
      : await supabase.from("stores").insert(payload);

    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(storeId ? "Loja atualizada" : "Loja criada — aguardando aprovação");
    navigate("/painel-lojista");
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <Header />
      <main className="container flex-1 py-10">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>{storeId ? "Editar loja" : "Cadastrar loja"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nome da loja *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <Label>Endereço</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
                <div>
                  <Label>Cidade *</Label>
                  <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
                </div>
                <div>
                  <Label>UF *</Label>
                  <select
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    required
                    className="mt-0 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">--</option>
                    {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
              </div>
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Instagram</Label>
                  <Input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="@minhaloja" />
                </div>
                <div>
                  <Label>URL do logo</Label>
                  <Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://..." />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" variant="accent" disabled={loading}>{storeId ? "Salvar" : "Criar loja"}</Button>
                <Button type="button" variant="ghost" onClick={() => navigate("/painel-lojista")}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

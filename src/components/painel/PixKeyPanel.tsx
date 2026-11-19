import { useEffect, useState } from "react";
import { QrCode, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchStorePix, normalizePixKey, PIX_KEY_LABELS, type PixKeyType } from "@/lib/pix";

export const PixKeyPanel = ({ storeId }: { storeId: string }) => {
  const [type, setType] = useState<PixKeyType>("cnpj");
  const [key, setKey] = useState("");
  const [holder, setHolder] = useState("");
  const [city, setCity] = useState("");
  const [bank, setBank] = useState("");
  const [exists, setExists] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStorePix(storeId).then((p) => {
      if (!p) return;
      setExists(true);
      setType(p.key_type);
      setKey(p.pix_key);
      setHolder(p.holder_name);
      setCity(p.holder_city);
      setBank(p.bank_name ?? "");
    });
  }, [storeId]);

  const save = async () => {
    const norm = normalizePixKey(type, key);
    if (!norm) return toast.error(`Chave PIX inválida para o tipo ${PIX_KEY_LABELS[type]}.`);
    if (holder.trim().length < 2) return toast.error("Informe o nome do titular da conta.");
    if (city.trim().length < 2) return toast.error("Informe a cidade da conta.");
    setSaving(true);
    const { error } = await supabase.from("store_pix_keys").upsert({
      store_id: storeId,
      key_type: type,
      pix_key: norm,
      holder_name: holder.trim().slice(0, 60),
      holder_city: city.trim().slice(0, 40),
      bank_name: bank.trim().slice(0, 60) || null,
    });
    setSaving(false);
    if (error) return toast.error("Não foi possível salvar a chave PIX.");
    setKey(norm);
    setExists(true);
    toast.success("Chave PIX salva!");
    return undefined;
  };

  const remove = async () => {
    if (!confirm("Remover a chave PIX? O QR Code deixará de aparecer nos anúncios.")) return;
    const { error } = await supabase.from("store_pix_keys").delete().eq("store_id", storeId);
    if (error) return toast.error("Não foi possível remover.");
    setExists(false);
    setKey(""); setHolder(""); setCity(""); setBank("");
    toast.success("Chave PIX removida.");
    return undefined;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><QrCode className="h-5 w-5 text-highlight" /> Recebimento via PIX</CardTitle>
        <p className="text-sm text-muted-foreground">
          Nos anúncios com PIX marcado como forma de pagamento, o cliente verá um QR Code com o valor da oferta.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Tipo de chave</Label>
            <Select value={type} onValueChange={(v) => setType(v as PixKeyType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(PIX_KEY_LABELS) as PixKeyType[]).map((k) => (
                  <SelectItem key={k} value={k}>{PIX_KEY_LABELS[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Chave PIX</Label>
            <Input value={key} onChange={(e) => setKey(e.target.value)} maxLength={77} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Nome do titular / Razão social</Label>
            <Input value={holder} onChange={(e) => setHolder(e.target.value)} maxLength={60} placeholder="Como aparece no banco" />
          </div>
          <div className="space-y-2">
            <Label>Cidade da conta</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} maxLength={40} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Banco (opcional)</Label>
          <Input value={bank} onChange={(e) => setBank(e.target.value)} maxLength={60} placeholder="Ex.: Sicredi, Nubank" />
        </div>
        <div className="flex gap-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
          <ShieldCheck className="h-5 w-5 shrink-0 text-highlight" />
          <span>Só libere o produto após ver o valor entrar no extrato da sua conta. Nunca aceite apenas print de comprovante ou PIX agendado.</span>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="accent" onClick={save} disabled={saving}>Salvar chave PIX</Button>
          {exists && <Button type="button" variant="ghost" onClick={remove}>Remover</Button>}
        </div>
      </CardContent>
    </Card>
  );
};

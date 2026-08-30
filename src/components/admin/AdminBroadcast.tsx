import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type LogRow = {
  id: string; audience: string; title: string; body: string;
  recipients_count: number; success_count: number; created_at: string;
};

export function AdminBroadcast() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/");
  const [marketingOnly, setMarketingOnly] = useState(true);
  const [sending, setSending] = useState(false);
  const [logs, setLogs] = useState<LogRow[]>([]);

  const loadLogs = async () => {
    const { data } = await supabase.from("notifications_log")
      .select("id,audience,title,body,recipients_count,success_count,created_at")
      .order("created_at", { ascending: false }).limit(20);
    setLogs((data ?? []) as LogRow[]);
  };

  useEffect(() => { loadLogs(); }, []);

  const send = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Preencha título e mensagem");
      return;
    }
    setSending(true);
    const { data, error } = await supabase.functions.invoke("admin-broadcast", {
      body: { title, body, url, marketing: marketingOnly },
    });
    setSending(false);
    if (error) {
      toast.error((error as any).message || "Falha");
      return;
    }
    const recipients = data?.recipients ?? 0;
    const success = data?.success ?? 0;
    if (recipients === 0) {
      toast.error("Nenhum dispositivo inscrito para este público.");
    } else if (success === 0) {
      toast.error("Nenhuma entrega aceita pelos serviços de push. Registros podem estar expirados.");
    } else {
      toast.success(`Enviado para ${success}/${recipients} dispositivos.`);
    }
    setTitle(""); setBody("");
    loadLogs();

  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" /> Enviar notificação push
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bc-title">Título</Label>
            <Input id="bc-title" maxLength={60} value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Ofertas relâmpago hoje!" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bc-body">Mensagem</Label>
            <Textarea id="bc-body" maxLength={180} rows={3} value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Texto curto que aparece na notificação" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bc-url">Link de destino</Label>
            <Input id="bc-url" value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label>Apenas quem aceitou marketing</Label>
              <p className="text-xs text-muted-foreground">
                Recomendado. Desligue só para avisos importantes do serviço.
              </p>
            </div>
            <Switch checked={marketingOnly} onCheckedChange={setMarketingOnly} />
          </div>
          <Button variant="accent" onClick={send} disabled={sending}>
            <Bell className="h-4 w-4" /> {sending ? "Enviando…" : "Enviar agora"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Histórico</CardTitle></CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum envio ainda.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="py-2">Data</th><th>Tipo</th><th>Título</th>
                  <th className="text-right">Entregues</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td className="py-2">{new Date(l.created_at).toLocaleString("pt-BR")}</td>
                    <td className="text-muted-foreground">{l.audience}</td>
                    <td className="font-medium text-foreground">{l.title}</td>
                    <td className="text-right">{l.success_count}/{l.recipients_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

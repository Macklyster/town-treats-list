import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { AlertTriangle, Copy, MessageCircle, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { buildPixPayload, PIX_KEY_LABELS, type StorePix } from "@/lib/pix";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const PixPaymentDialog = ({
  pix, amount, offerTitle, offerId, whatsapp,
}: { pix: StorePix; amount: number; offerTitle: string; offerId: string; whatsapp?: string | null }) => {
  const [open, setOpen] = useState(false);
  const [img, setImg] = useState("");
  const payload = useMemo(
    () => buildPixPayload({ key: pix.pix_key, name: pix.holder_name, city: pix.holder_city, amount, txid: `OF${offerId.replace(/-/g, "").slice(0, 20)}` }),
    [pix, amount, offerId],
  );

  useEffect(() => {
    if (open) QRCode.toDataURL(payload, { width: 260, margin: 1 }).then(setImg);
  }, [open, payload]);

  const copy = async () => {
    await navigator.clipboard.writeText(payload);
    toast.success("Código Pix copiado!");
  };

  const waText = `Olá! Fiz o pagamento de ${brl(amount)} via PIX referente à oferta "${offerTitle}" no OfertasFly. Segue o comprovante para conferência e para combinarmos a retirada/entrega.`;
  const waLink = whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(waText)}` : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="discount" size="lg" className="w-full"><QrCode className="h-5 w-5" /> Pagar via PIX</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pagar {brl(amount)} via PIX</DialogTitle>
          <DialogDescription>O pagamento vai direto para a conta da loja.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
          <p className="flex items-center gap-2 font-semibold text-destructive"><AlertTriangle className="h-4 w-4" /> Antes de pagar</p>
          <ul className="list-disc space-y-1 pl-5 text-foreground">
            <li>Confirme com a loja a disponibilidade do produto ou horário.</li>
            <li>No app do seu banco, confira se o recebedor é <strong>{pix.holder_name}</strong>{pix.bank_name ? <> ({pix.bank_name})</> : null}. Se o nome for diferente, não pague.</li>
          </ul>
        </div>

        <div className="flex flex-col items-center gap-2">
          {img ? <img src={img} alt="QR Code PIX" className="h-56 w-56 rounded-lg bg-card p-2" /> : <div className="h-56 w-56 animate-pulse rounded-lg bg-muted" />}
          <p className="text-xs text-muted-foreground">Chave ({PIX_KEY_LABELS[pix.key_type]}): {pix.pix_key}</p>
        </div>

        <Button variant="outline" className="w-full" onClick={copy}><Copy className="h-4 w-4" /> Copiar código Pix Copia e Cola</Button>

        {waLink && (
          <Button asChild variant="accent" className="w-full">
            <a href={waLink} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /> Já fiz o PIX! Enviar comprovante</a>
          </Button>
        )}
        <p className="text-center text-xs text-muted-foreground">A loja confirma o recebimento antes de liberar o pedido.</p>
      </DialogContent>
    </Dialog>
  );
};

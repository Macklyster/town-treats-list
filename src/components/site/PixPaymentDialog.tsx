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
      <DialogContent className="w-[calc(100%-1rem)] gap-2 rounded-lg p-4 sm:max-w-md sm:gap-3">
        <DialogHeader className="space-y-1 pr-5">
          <DialogTitle className="text-base">Pagar {brl(amount)} via PIX</DialogTitle>
          <DialogDescription className="text-xs">Pagamento direto para a conta da loja.</DialogDescription>
        </DialogHeader>

        <div className="space-y-1 rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-xs">
          <p className="flex items-center gap-2 font-semibold text-destructive"><AlertTriangle className="h-4 w-4" /> Antes de pagar</p>
          <ul className="list-disc space-y-1 pl-4 text-foreground">
            <li>Confirme a disponibilidade com a loja.</li>
            <li>Confira no banco: <strong className="break-words">{pix.holder_name}</strong>{pix.bank_name ? <> ({pix.bank_name})</> : null}. Se o recebedor for diferente, não pague.</li>
          </ul>
        </div>

        <div className="flex min-w-0 flex-col items-center gap-1">
          {img ? <img src={img} alt="QR Code PIX" className="aspect-square w-[min(11rem,30dvh)] rounded-lg bg-card p-1" /> : <div className="aspect-square w-[min(11rem,30dvh)] animate-pulse rounded-lg bg-muted" />}
          <p className="max-w-full break-all text-center text-xs text-muted-foreground">Chave ({PIX_KEY_LABELS[pix.key_type]}): {pix.pix_key}</p>
        </div>

        <Button variant="outline" className="h-auto min-h-10 w-full whitespace-normal px-2 text-xs" onClick={copy}><Copy className="h-4 w-4" /> Copiar Pix Copia e Cola</Button>

        {waLink && (
          <Button asChild variant="accent" className="h-auto min-h-10 w-full whitespace-normal px-2 text-xs">
            <a href={waLink} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /> Já fiz o PIX! Enviar comprovante</a>
          </Button>
        )}
        <p className="text-center text-xs text-muted-foreground">A loja confirma o recebimento antes de liberar o pedido.</p>
      </DialogContent>
    </Dialog>
  );
};

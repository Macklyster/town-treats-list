import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import { QrCode, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { issueLoyaltyQr } from "@/lib/loyalty-api";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

/** QR rotativo do consumidor: o lojista lê para creditar os pontos da compra. */
export function LoyaltyQrDialog({ open, onOpenChange }: Props) {
  const [code, setCode] = useState<string | null>(null);
  const [qr, setQr] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(false);

  const issue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await issueLoyaltyQr();
      if (!res.ok || !res.code) throw new Error("Não foi possível gerar o código");
      setCode(res.code);
      setSecondsLeft(60);
      setQr(
        await QRCode.toDataURL(`flypontos:${res.code}`, {
          width: 480,
          margin: 1,
          errorCorrectionLevel: "M",
        }),
      );
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao gerar o QR");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) issue();
    else {
      setCode(null);
      setQr("");
      setSecondsLeft(0);
    }
  }, [open, issue]);

  useEffect(() => {
    if (!open || secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [open, secondsLeft]);

  const expired = secondsLeft === 0 && !!code;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" /> Meu QR FlyPontos
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Mostre este código ao lojista para validar sua compra e receber os pontos.
          </p>
          <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-xl border bg-card p-3">
            {qr && !expired ? (
              <img src={qr} alt="QR do programa de fidelidade" className="h-full w-full" />
            ) : (
              <span className="text-sm text-muted-foreground">
                {loading ? "Gerando…" : "Código expirado"}
              </span>
            )}
          </div>
          {code && !expired && (
            <div>
              <div className="font-mono text-3xl font-bold tracking-[0.35em]">{code}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Expira em {secondsLeft}s — o lojista também pode digitar este número.
              </p>
            </div>
          )}
          <Button variant="outline" className="w-full" onClick={issue} disabled={loading}>
            <RefreshCw className="h-4 w-4" /> Gerar novo código
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

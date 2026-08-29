import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, ScanLine } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  formatCents,
  validateLoyaltyPurchase,
  fulfillLoyaltyRedemption,
  type ValidatePurchaseResult,
} from "@/lib/loyalty-api";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDone?: () => void;
}

const ERRORS: Record<string, string> = {
  invalid_code: "Código inválido ou expirado. Peça um novo QR ao cliente.",
  program_inactive: "Ative o programa de fidelidade antes de validar compras.",
  no_store: "Cadastre sua loja para validar clientes.",
  invalid_amount: "Informe um valor de compra válido.",
  auth_required: "Faça login novamente.",
  not_found: "Nenhum resgate pendente com este código.",
};

/** Tela usada pelo lojista para validar a compra do cliente (QR ou código). */
export function ValidateCustomerDialog({ open, onOpenChange, onDone }: Props) {
  const [code, setCode] = useState("");
  const [amount, setAmount] = useState("");
  const [useCredit, setUseCredit] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ValidatePurchaseResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  };

  useEffect(() => {
    if (!open) {
      stopCamera();
      setCode("");
      setAmount("");
      setUseCredit("");
      setResult(null);
    }
  }, [open]);

  const startCamera = async () => {
    const Detector = (window as any).BarcodeDetector;
    if (!Detector) {
      toast.info("Seu navegador não suporta leitura de QR. Digite o código de 6 dígitos.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      setScanning(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const detector = new Detector({ formats: ["qr_code"] });
      const tick = async () => {
        if (!streamRef.current || !videoRef.current) return;
        try {
          const found = await detector.detect(videoRef.current);
          const raw = found?.[0]?.rawValue as string | undefined;
          const match = raw?.match(/(\d{6})/);
          if (match) {
            setCode(match[1]);
            stopCamera();
            toast.success("Código lido");
            return;
          }
        } catch {
          /* ignora frames inválidos */
        }
        requestAnimationFrame(() => void tick());
      };
      void tick();
    } catch {
      toast.error("Não foi possível acessar a câmera.");
      stopCamera();
    }
  };

  const handleValidate = async () => {
    const cents = Math.round(Number(String(amount).replace(",", ".")) * 100);
    if (!/^\d{6}$/.test(code.trim())) return toast.error("O código tem 6 dígitos");
    if (!Number.isFinite(cents) || cents <= 0) return toast.error("Informe o valor da compra");
    const creditCents = Math.max(0, Math.round(Number(String(useCredit || 0).replace(",", ".")) * 100));
    setBusy(true);
    try {
      const res = await validateLoyaltyPurchase(code.trim(), cents, creditCents);
      if (!res.ok) {
        toast.error(ERRORS[res.error ?? ""] ?? "Não foi possível validar");
        return;
      }
      setResult(res);
      toast.success("Compra validada e pontos creditados");
      onDone?.();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleFulfill = async () => {
    const c = code.trim();
    if (!c) return toast.error("Informe o código do resgate");
    setBusy(true);
    try {
      const res = await fulfillLoyaltyRedemption(c);
      if (!res.ok) {
        toast.error(ERRORS[res.error ?? ""] ?? "Resgate não encontrado");
        return;
      }
      toast.success(`Entrega confirmada: ${res.reward}`);
      onDone?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-primary" /> Validar cliente
          </DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Pontos creditados para {result.customer}</AlertTitle>
              <AlertDescription className="space-y-1 text-sm">
                <div>+{result.points_awarded} pontos nesta compra</div>
                {!!result.cashback_cents && (
                  <div>Cashback gerado: {formatCents(result.cashback_cents)}</div>
                )}
                {!!result.credit_used_cents && (
                  <div>Crédito abatido: {formatCents(result.credit_used_cents)}</div>
                )}
                <div>
                  Saldo atual: {result.balance} pontos · {formatCents(result.credit_cents ?? 0)}
                  {result.tier ? ` · nível ${result.tier}` : ""}
                </div>
              </AlertDescription>
            </Alert>
            <Button
              className="w-full"
              variant="accent"
              onClick={() => {
                setResult(null);
                setCode("");
                setAmount("");
                setUseCredit("");
              }}
            >
              Validar outro cliente
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {scanning && (
              <video
                ref={videoRef}
                muted
                playsInline
                className="h-48 w-full rounded-lg border object-cover"
              />
            )}
            <div>
              <Label>Código do cliente (6 dígitos)</Label>
              <div className="flex gap-2">
                <Input
                  inputMode="numeric"
                  value={code}
                  maxLength={8}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="font-mono text-lg tracking-widest"
                />
                <Button variant="outline" onClick={scanning ? stopCamera : startCamera}>
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Valor da compra (R$)</Label>
                <Input
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                />
              </div>
              <div>
                <Label>Abater crédito (R$)</Label>
                <Input
                  inputMode="decimal"
                  value={useCredit}
                  onChange={(e) => setUseCredit(e.target.value)}
                  placeholder="0,00"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              O código do cliente expira em 60 segundos e só pode ser usado uma vez. Para entregar
              uma recompensa resgatada, informe o código do resgate e use "Confirmar resgate".
            </p>
          </div>
        )}

        {!result && (
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={handleFulfill} disabled={busy}>
              Confirmar resgate
            </Button>
            <Button variant="accent" onClick={handleValidate} disabled={busy}>
              {busy ? "Validando…" : "Creditar pontos"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

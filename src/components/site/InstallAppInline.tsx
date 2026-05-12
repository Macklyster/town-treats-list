import { useState } from "react";
import { Download, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

type Props = {
  className?: string;
  variant?: "inline" | "card";
};

export const InstallAppInline = ({ className, variant = "card" }: Props) => {
  const { eligible, isIOS, promptInstall, dismiss } = useInstallPrompt();
  const [iosOpen, setIosOpen] = useState(false);

  if (!eligible) return null;

  const handle = async () => {
    if (isIOS) {
      setIosOpen(true);
      return;
    }
    const r = await promptInstall();
    if (r !== "accepted") dismiss();
  };

  if (variant === "inline") {
    return (
      <>
        <button
          type="button"
          onClick={handle}
          className={
            "inline-flex items-center gap-2 text-sm font-medium text-accent-strong underline-offset-4 hover:underline " +
            (className ?? "")
          }
        >
          <Download className="h-4 w-4" />
          Instalar app para acessar mais rápido
        </button>
        <IosDialog open={iosOpen} onOpenChange={setIosOpen} onDone={dismiss} />
      </>
    );
  }

  return (
    <>
      <div
        className={
          "flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft md:hidden " +
          (className ?? "")
        }
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-strong">
          <Download className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Instalar OfertasFly</p>
          <p className="text-xs text-muted-foreground">
            Receba alertas de ofertas relâmpago direto na tela inicial.
          </p>
        </div>
        <Button size="sm" variant="accent" onClick={handle}>
          {isIOS ? "Como" : "Instalar"}
        </Button>
      </div>
      <IosDialog open={iosOpen} onOpenChange={setIosOpen} onDone={dismiss} />
    </>
  );
};

const IosDialog = ({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDone: () => void;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle>Adicionar à tela inicial</DialogTitle>
        <DialogDescription>
          Em poucos toques no Safari você instala o OfertasFly como um app.
        </DialogDescription>
      </DialogHeader>
      <ol className="space-y-3 text-sm text-foreground">
        <li className="flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent-strong">
            1
          </span>
          <span className="flex flex-wrap items-center gap-1">
            Toque em <Share className="inline h-4 w-4" /> <strong>Compartilhar</strong>.
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent-strong">
            2
          </span>
          <span className="flex flex-wrap items-center gap-1">
            Escolha <Plus className="inline h-4 w-4" /> <strong>Adicionar à Tela de Início</strong>.
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent-strong">
            3
          </span>
          <span>Confirme em <strong>Adicionar</strong>.</span>
        </li>
      </ol>
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => {
            onDone();
            onOpenChange(false);
          }}
        >
          Entendi
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);

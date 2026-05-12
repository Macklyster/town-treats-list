import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Share, Plus, X } from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

const APPEAR_DELAY_MS = 20_000;

export const InstallAppBanner = () => {
  const { eligible, isIOS, canInstall, promptInstall, dismiss } = useInstallPrompt();
  const [visible, setVisible] = useState(false);
  const [iosOpen, setIosOpen] = useState(false);

  useEffect(() => {
    if (!eligible) {
      setVisible(false);
      return;
    }
    const t = setTimeout(() => setVisible(true), APPEAR_DELAY_MS);
    return () => clearTimeout(t);
  }, [eligible]);

  if (!eligible || !visible) return null;

  const handleInstall = async () => {
    if (isIOS) {
      setIosOpen(true);
      return;
    }
    const outcome = await promptInstall();
    if (outcome !== "accepted") {
      dismiss();
    }
    setVisible(false);
  };

  const handleDismiss = () => {
    dismiss();
    setVisible(false);
  };

  return (
    <>
      <div
        role="dialog"
        aria-label="Instalar aplicativo"
        className="fixed inset-x-0 bottom-0 z-50 md:hidden animate-in slide-in-from-bottom-4 duration-300"
      >
        <div className="mx-3 mb-3 rounded-2xl border border-border bg-card p-4 shadow-pop">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-strong">
              <Download className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">
                Instale o OfertasFly
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Acesso rápido na tela inicial e alertas de ofertas relâmpago.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Button size="sm" variant="accent" onClick={handleInstall}>
                  {isIOS ? "Como instalar" : "Instalar app"}
                </Button>
                <Button size="sm" variant="ghost" onClick={handleDismiss}>
                  Agora não
                </Button>
              </div>
            </div>
            <button
              type="button"
              aria-label="Fechar"
              onClick={handleDismiss}
              className="-mr-1 -mt-1 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <Dialog open={iosOpen} onOpenChange={setIosOpen}>
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
                Toque no ícone <Share className="inline h-4 w-4" /> <strong>Compartilhar</strong> na barra do Safari.
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
              <span>Confirme em <strong>Adicionar</strong>. Pronto, é só abrir pelo ícone!</span>
            </li>
          </ol>
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => {
                dismiss();
                setIosOpen(false);
                setVisible(false);
              }}
            >
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

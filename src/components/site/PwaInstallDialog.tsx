import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Share, Plus } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STORAGE_KEY = "pwa-install-dialog-dismissed";
const SHOW_DELAY_MS = 8000;

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  // iOS Safari
  (window.navigator as unknown as { standalone?: boolean }).standalone === true;

const isIos = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !/crios|fxios/i.test(window.navigator.userAgent);

export const PwaInstallDialog = () => {
  const [open, setOpen] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosMode, setIosMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return;
    if (localStorage.getItem(STORAGE_KEY) === "1") return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setOpen(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // iOS não dispara beforeinstallprompt — mostrar instruções após delay.
    let timer: number | undefined;
    if (isIos()) {
      timer = window.setTimeout(() => {
        if (!isStandalone() && localStorage.getItem(STORAGE_KEY) !== "1") {
          setIosMode(true);
          setOpen(true);
        }
      }, SHOW_DELAY_MS);
    }

    const onInstalled = () => {
      setOpen(false);
      localStorage.setItem(STORAGE_KEY, "1");
    };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") {
      localStorage.setItem(STORAGE_KEY, "1");
    }
    setDeferred(null);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : dismiss())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Instalar o app OfertasFly
          </DialogTitle>
          <DialogDescription>
            Tenha acesso rápido às melhores ofertas direto da tela inicial do seu celular.
          </DialogDescription>
        </DialogHeader>

        {iosMode ? (
          <div className="space-y-3 rounded-md bg-muted/40 p-4 text-sm">
            <p>Para instalar no iPhone/iPad:</p>
            <ol className="space-y-2 pl-1">
              <li className="flex items-start gap-2">
                <Share className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Toque no botão <strong>Compartilhar</strong> na barra do Safari.</span>
              </li>
              <li className="flex items-start gap-2">
                <Plus className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Escolha <strong>Adicionar à Tela de Início</strong>.</span>
              </li>
            </ol>
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={dismiss}>
            Agora não
          </Button>
          {!iosMode && deferred ? (
            <Button onClick={install}>
              <Download className="mr-2 h-4 w-4" />
              Instalar
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PwaInstallDialog;

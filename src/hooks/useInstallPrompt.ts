import { useEffect, useState, useCallback } from "react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "pwa-install-dismissed-at";
const INSTALLED_KEY = "pwa-installed";
const DISMISS_DAYS = 14;

const isInIframe = () => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

const isPreviewHost = () => {
  const h = window.location.hostname;
  return h.includes("id-preview--") || h.includes("lovableproject.com");
};

const detectIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

const detectStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as any).standalone === true;

const dismissedRecently = () => {
  try {
    const v = localStorage.getItem(DISMISS_KEY);
    if (!v) return false;
    const ts = parseInt(v, 10);
    if (!ts) return false;
    return Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
};

export const useInstallPrompt = () => {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [blocked, setBlocked] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isInIframe() || isPreviewHost()) return;

    setIsIOS(detectIOS());
    setIsStandalone(detectStandalone());
    setInstalled(localStorage.getItem(INSTALLED_KEY) === "1");
    setBlocked(false);

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => {
      try {
        localStorage.setItem(INSTALLED_KEY, "1");
      } catch {}
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return "unavailable" as const;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") {
      try {
        localStorage.setItem(INSTALLED_KEY, "1");
      } catch {}
      setInstalled(true);
    }
    setDeferred(null);
    return choice.outcome;
  }, [deferred]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
  }, []);

  const eligible =
    !blocked && !installed && !isStandalone && !dismissedRecently() &&
    (isIOS || !!deferred);

  return {
    eligible,
    canInstall: !!deferred,
    isIOS,
    isStandalone,
    installed,
    promptInstall,
    dismiss,
  };
};

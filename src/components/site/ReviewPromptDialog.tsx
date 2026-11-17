import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "@/lib/router-compat";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ReviewForm } from "./ReviewForm";

type Prompt = {
  prompt_id: string;
  offer_id: string;
  store_id: string;
  offer_title: string;
  offer_image: string | null;
  store_name: string;
  store_logo: string | null;
  eligible_at: string;
};

const SESSION_KEY = "review-prompt-shown";

export function ReviewPromptDialog() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return;
    // Don't auto-open on auth pages
    if (location.pathname.startsWith("/auth")) return;

    // Force-open via ?review=1 (push notification deep link)
    const sp = new URLSearchParams(location.search);
    const force = sp.get("review") === "1";
    const shown = sessionStorage.getItem(SESSION_KEY);
    if (!force && shown) return;

    (async () => {
      const { data, error } = await supabase.rpc("pending_reviews_for_user");
      if (error || !data || data.length === 0) return;
      const next = (data[0] as Prompt) ?? null;
      if (!next) return;
      setPrompt(next);
      setOpen(true);
      sessionStorage.setItem(SESSION_KEY, "1");
    })();
  }, [user, loading, location.pathname, location.search]);

  const dismiss = async (permanent: boolean) => {
    if (!prompt) return;
    await supabase
      .from("review_prompts")
      .update({
        dismissed_at: new Date().toISOString(),
        dismissed_permanently: permanent,
        remind_after: permanent
          ? null
          : new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      })
      .eq("id", prompt.prompt_id);
    setOpen(false);
  };

  const close = () => setOpen(false);

  if (!prompt) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Avalie sua experiência</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
          {prompt.offer_image && (
            <img
              src={prompt.offer_image}
              alt={prompt.offer_title}
              className="h-14 w-14 rounded-md object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{prompt.offer_title}</p>
            <p className="truncate text-xs text-muted-foreground">{prompt.store_name}</p>
          </div>
        </div>
        <ReviewForm
          offerId={prompt.offer_id}
          storeName={prompt.store_name}
          onSubmitted={close}
        />
        <div className="mt-2 flex flex-wrap justify-between gap-2 border-t pt-3 text-xs">
          <Button variant="ghost" size="sm" onClick={() => dismiss(false)}>
            Lembrar depois
          </Button>
          <Button variant="ghost" size="sm" onClick={() => dismiss(true)}>
            Não resgatei
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

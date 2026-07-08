import { useEffect, useState } from "react";
import { Header } from "@/components/site/Header";
import { PageHero } from "@/components/site/PageHero";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Bell, BellOff, Smartphone, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePush } from "@/hooks/usePush";
import { toast } from "sonner";

type Prefs = {
  new_offers_followed_stores: boolean;
  expiring_favorites: boolean;
  city_new_offers: boolean;
  marketing: boolean;
};

const defaultPrefs: Prefs = {
  new_offers_followed_stores: true,
  expiring_favorites: true,
  city_new_offers: false,
  marketing: false,
};

export default function Notificacoes() {
  const { user } = useAuth();
  const push = usePush();
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);
  const [stores, setStores] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [loading, setLoading] = useState(true);

  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true;

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { data: f }] = await Promise.all([
        supabase.from("notification_preferences").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("store_followers").select("store_id, store:stores(id,name,slug)").eq("user_id", user.id),
      ]);
      if (p) setPrefs({
        new_offers_followed_stores: p.new_offers_followed_stores,
        expiring_favorites: p.expiring_favorites,
        city_new_offers: p.city_new_offers,
        marketing: p.marketing,
      });
      setStores(((f ?? []).map((x: any) => x.store).filter(Boolean)));
      setLoading(false);
    })();
  }, [user?.id]);

  const updatePref = async (key: keyof Prefs, value: boolean) => {
    if (!user) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    await supabase.from("notification_preferences").upsert(
      { user_id: user.id, ...next }, { onConflict: "user_id" },
    );
  };

  const unfollow = async (storeId: string) => {
    if (!user) return;
    await supabase.from("store_followers").delete().eq("user_id", user.id).eq("store_id", storeId);
    setStores((s) => s.filter((x) => x.id !== storeId));
  };

  const handleSubscribe = async () => {
    try {
      await push.subscribe();
      toast.success("Notificações ativadas!");
    } catch (e: any) {
      toast.error(e.message ?? "Não foi possível ativar.");
    }
  };

  const handleUnsubscribe = async () => {
    await push.unsubscribe();
    toast.success("Notificações desativadas");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container flex-1 space-y-8 py-8 md:py-10">
        <PageHero
          eyebrow="Sua conta"
          title="Notificações"
          subtitle="Receba avisos das suas lojas favoritas e ofertas relâmpago direto no celular."
          crumbs={[{ label: "Início", to: "/" }, { label: "Notificações" }]}
          compact
        />
        <div className="mx-auto max-w-2xl">


        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" /> Status das notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!push.supported && (
              <Alert variant="destructive">
                <Info className="h-4 w-4" />
                <AlertTitle>Não suportado</AlertTitle>
                <AlertDescription>
                  Este navegador não suporta notificações push. Tente Chrome no Android ou Safari no iOS 16.4+.
                </AlertDescription>
              </Alert>
            )}
            {push.supported && isIos && !isStandalone && (
              <Alert>
                <Smartphone className="h-4 w-4" />
                <AlertTitle>iPhone / iPad</AlertTitle>
                <AlertDescription>
                  Para receber notificações no iOS, instale o OfertasFly na tela inicial: toque em <strong>Compartilhar</strong> → <strong>Adicionar à Tela de Início</strong>, depois volte aqui.
                </AlertDescription>
              </Alert>
            )}
            {push.supported && (
              push.subscribed ? (
                <Button onClick={handleUnsubscribe} disabled={push.loading} variant="outline" size="lg">
                  <BellOff className="h-4 w-4" /> Desativar notificações
                </Button>
              ) : (
                <Button onClick={handleSubscribe} disabled={push.loading} variant="accent" size="lg">
                  <Bell className="h-4 w-4" /> Ativar notificações
                </Button>
              )
            )}
            {push.permission === "denied" && (
              <p className="text-xs text-muted-foreground">
                Você bloqueou notificações. Habilite nas configurações do navegador para este site.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Preferências</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ["new_offers_followed_stores", "Novas ofertas das lojas que sigo"],
              ["expiring_favorites", "Favoritos prestes a expirar"],
              ["city_new_offers", "Ofertas novas na minha cidade"],
              ["marketing", "Novidades e promoções do OfertasFly"],
            ].map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={key}>{label}</Label>
                <Switch
                  id={key}
                  checked={prefs[key as keyof Prefs]}
                  onCheckedChange={(v) => updatePref(key as keyof Prefs, v)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Lojas que você segue ({stores.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando…</p>
            ) : stores.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Você ainda não segue nenhuma loja. <Link to="/" className="underline">Explorar ofertas</Link>.
              </p>
            ) : (
              <ul className="divide-y">
                {stores.map((s) => (
                  <li key={s.id} className="flex items-center justify-between py-3">
                    <span className="font-medium">{s.name}</span>
                    <Button size="sm" variant="ghost" onClick={() => unfollow(s.id)}>
                      Deixar de seguir
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}

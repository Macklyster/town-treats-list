import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GroupOfferProgress } from "@/components/site/GroupOfferProgress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchGroupOfferStateByToken,
  joinGroupOffer,
  type GroupOfferState,
  formatBRL,
} from "@/lib/group-offers-api";
import { MessageCircle, Copy, Check } from "lucide-react";
import { StoreAvatar } from "@/components/site/StoreAvatar";
import { StoreFeaturedBadge } from "@/components/site/StoreFeaturedBadge";
import { toast } from "sonner";

export default function ColetivaPublic() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const ref = searchParams.get("ref");
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<GroupOfferState | null>(null);
  const [storeName, setStoreName] = useState<string>("");
  const [storeLogo, setStoreLogo] = useState<string | null>(null);
  const [storeFeatured, setStoreFeatured] = useState<boolean>(false);
  const [storeWhatsapp, setStoreWhatsapp] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const load = async () => {
    if (!token) return;
    const s = await fetchGroupOfferStateByToken(token);
    setState(s);
    if (s.found && s.offer) {
      const { data: st } = await supabase
        .from("stores")
        .select("name, whatsapp, logo_url, featured_badge")
        .eq("id", s.offer.store_id)
        .maybeSingle();
      setStoreName(st?.name ?? "");
      setStoreLogo(st?.logo_url ?? null);
      setStoreFeatured(!!st?.featured_badge);
      setStoreWhatsapp(st?.whatsapp ?? null);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  // Realtime
  useEffect(() => {
    if (!state?.offer?.id) return;
    const ch = supabase
      .channel(`coletiva-${state.offer.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_offer_participants",
          filter: `group_offer_id=eq.${state.offer.id}`,
        },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [state?.offer?.id]);

  const alreadyJoined = useMemo(
    () => !!user && !!state?.avatars?.some((a) => a.user_id === user.id),
    [user, state?.avatars],
  );

  const shareUrl = useMemo(
    () => (token && user ? `${window.location.origin}/coletiva/${token}?ref=${user.id}` : ""),
    [token, user?.id],
  );

  const handleJoin = async () => {
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent(`/coletiva/${token}${ref ? `?ref=${ref}` : ""}`)}`);
      return;
    }
    if (!state?.offer || !state.current_tier) return;
    setJoining(true);
    try {
      await joinGroupOffer({
        group_offer_id: state.offer.id,
        user_id: user.id,
        referrer_user_id: ref || null,
      });
      await load();
      // open WhatsApp share
      const tierLine = state.current_tier
        ? `Está em ${formatBRL(state.current_tier.price)} cada`
        : "";
      const message = `🔥 Coletiva da ${storeName}: ${state.offer.title}\n${tierLine}\nVem comigo, quanto mais gente entra, menor o preço!\n${shareUrl}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao entrar na coletiva");
    } finally {
      setJoining(false);
    }
  };

  if (!state) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex-1 py-10"><p className="text-muted-foreground">Carregando…</p></main>
        <Footer />
      </div>
    );
  }

  if (!state.found || !state.offer) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex-1 py-10">
          <Card><CardContent className="p-6">Coletiva não encontrada.</CardContent></Card>
        </main>
        <Footer />
      </div>
    );
  }

  const offer = state.offer;
  const ended = (state.seconds_remaining ?? 0) <= 0 || offer.status === "expired";
  const notLiveYet = offer.status !== "approved";

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <Header />
      <main className="container flex-1 py-10">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Hero */}
          <Card className="overflow-hidden">
            {offer.image_url && (
              <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
                <img src={offer.image_url} alt={offer.title} className="h-full w-full object-cover" />
              </div>
            )}
            <CardContent className="space-y-2 p-6">
              <div className="flex items-center gap-2">
                <StoreAvatar name={storeName || "Loja"} logoUrl={storeLogo} size={28} />
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{storeName}</p>
                {storeFeatured && <StoreFeaturedBadge showLabel={false} />}
              </div>
              <h1 className="text-2xl font-bold text-foreground">{offer.title}</h1>
              {offer.description && (
                <p className="text-sm text-muted-foreground">{offer.description}</p>
              )}
            </CardContent>
          </Card>

          {/* Status banner */}
          {notLiveYet && (
            <Card>
              <CardContent className="p-4 text-sm">
                ⏳ Esta coletiva está aguardando aprovação. Volte em breve.
              </CardContent>
            </Card>
          )}

          {/* Progress card */}
          {state.current_tier && (
            <GroupOfferProgress
              participantsCount={state.participants_count ?? 0}
              currentTier={state.current_tier}
              nextTier={state.next_tier ?? null}
              endsAt={offer.ends_at}
              originalPrice={Number(offer.original_price) || undefined}
            />
          )}

          {/* Tier ladder */}
          <Card>
            <CardContent className="space-y-2 p-6">
              <h2 className="font-semibold">Escada de preço</h2>
              <ul className="divide-y">
                {offer.tiers.map((t, i) => {
                  const isCurrent = state.current_tier && state.current_tier.min_people === t.min_people;
                  return (
                    <li
                      key={i}
                      className={`flex items-center justify-between py-2 ${isCurrent ? "font-semibold text-accent-strong" : ""}`}
                    >
                      <span>{t.min_people === 1 ? "Sozinho" : `${t.min_people}+ pessoas`}</span>
                      <span>{formatBRL(t.price)} {isCurrent && <Check className="ml-1 inline h-4 w-4" />}</span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          {/* CTA */}
          {!ended && !notLiveYet && (
            <div className="space-y-2">
              {alreadyJoined ? (
                <Card>
                  <CardContent className="space-y-3 p-4 text-sm">
                    <p>✅ Você já está na coletiva! Compartilhe para o preço cair ainda mais.</p>
                    <div className="flex gap-2">
                      <Button
                        variant="accent"
                        onClick={() =>
                          window.open(
                            `https://wa.me/?text=${encodeURIComponent(
                              `🔥 Coletiva da ${storeName}: ${offer.title}\n${state.current_tier ? `Está em ${formatBRL(state.current_tier.price)} cada` : ""}\n${shareUrl}`,
                            )}`,
                            "_blank",
                          )
                        }
                      >
                        <MessageCircle className="h-4 w-4" /> Chamar amigos no WhatsApp
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(shareUrl);
                          toast.success("Link copiado!");
                        }}
                      >
                        <Copy className="h-4 w-4" /> Copiar link
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Button
                  size="lg"
                  variant="accent"
                  className="w-full"
                  onClick={handleJoin}
                  disabled={joining || authLoading}
                >
                  <MessageCircle className="h-5 w-5" />
                  {user ? "Entrar e chamar amigos no WhatsApp" : "Entrar com sua conta"}
                </Button>
              )}
            </div>
          )}

          {ended && (
            <Card>
              <CardContent className="space-y-3 p-6 text-center">
                <h3 className="text-lg font-semibold">Coletiva encerrada</h3>
                {state.current_tier && (
                  <p className="text-sm text-muted-foreground">
                    Preço final: <strong className="text-accent-strong">{formatBRL(state.current_tier.price)} cada</strong> com {state.participants_count} {state.participants_count === 1 ? "participante" : "participantes"}.
                  </p>
                )}
                {storeWhatsapp && (
                  <Button
                    variant="accent"
                    onClick={() =>
                      window.open(
                        `https://wa.me/${storeWhatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                          `Olá! Participei da coletiva "${offer.title}" e quero garantir meu pedido.`,
                        )}`,
                        "_blank",
                      )
                    }
                  >
                    <MessageCircle className="h-4 w-4" /> Falar com a loja
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Conditions */}
          {offer.conditions && (
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-2 font-semibold">Condições</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{offer.conditions}</p>
              </CardContent>
            </Card>
          )}

          {/* Participants */}
          {!!state.avatars?.length && (
            <Card>
              <CardContent className="space-y-3 p-6">
                <h3 className="font-semibold">Quem já entrou</h3>
                <div className="flex flex-wrap gap-2">
                  {state.avatars.map((a) => (
                    <Avatar key={a.user_id} className="h-10 w-10">
                      {a.avatar_url && <AvatarImage src={a.avatar_url} alt={a.name ?? ""} />}
                      <AvatarFallback>{(a.name ?? "?").slice(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <p className="text-center text-xs text-muted-foreground">
            <Link to="/" className="underline">Ver outras ofertas na OfertasFly</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  MessageCircle,
  Phone,
  QrCode,
  Activity,
  Sparkles,
  TrendingUp,
  Target,
  Clock,
  Lock,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Header } from "@/components/site/Header";
import { PageHero } from "@/components/site/PageHero";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type EventRow = {
  id: string;
  offer_id: string;
  event_type: "view" | "whatsapp_click" | "phone_click" | "qr_scan";
  referrer: string | null;
  user_agent: string | null;
  session_id: string | null;
  created_at: string;
};

type OfferLite = { id: string; title: string };

const EVENT_LABEL: Record<EventRow["event_type"], string> = {
  view: "Visualização",
  whatsapp_click: "Clique WhatsApp",
  phone_click: "Clique Telefone",
  qr_scan: "Scan QR",
};

const EVENT_ICON: Record<EventRow["event_type"], JSX.Element> = {
  view: <Eye className="h-3.5 w-3.5" />,
  whatsapp_click: <MessageCircle className="h-3.5 w-3.5" />,
  phone_click: <Phone className="h-3.5 w-3.5" />,
  qr_scan: <QrCode className="h-3.5 w-3.5" />,
};

const dayKey = (iso: string) => iso.slice(0, 10);

export default function Historico() {
  const { user } = useAuth();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [offers, setOffers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterOffer, setFilterOffer] = useState<string>("all");

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      const { data: stores } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1);
      const s = stores?.[0];
      if (!s) {
        setLoading(false);
        return;
      }
      setStoreId(s.id);

      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const [{ data: evs }, { data: offs }] = await Promise.all([
        supabase
          .from("offer_events")
          .select("id,offer_id,event_type,referrer,user_agent,session_id,created_at")
          .eq("store_id", s.id)
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(500),
        supabase.from("offers").select("id,title").eq("store_id", s.id),
      ]);
      setEvents((evs ?? []) as EventRow[]);
      const map: Record<string, string> = {};
      ((offs ?? []) as OfferLite[]).forEach((o) => (map[o.id] = o.title));
      setOffers(map);
      setLoading(false);
    };
    load();
  }, [user?.id]);

  const offerList = useMemo(
    () =>
      Object.entries(offers)
        .map(([id, title]) => ({ id, title }))
        .sort((a, b) => a.title.localeCompare(b.title)),
    [offers]
  );

  const filtered = useMemo(
    () =>
      events.filter(
        (e) =>
          (filterType === "all" || e.event_type === filterType) &&
          (filterOffer === "all" || e.offer_id === filterOffer)
      ),
    [events, filterType, filterOffer]
  );

  const chartData = useMemo(() => {
    const days: Record<string, { date: string; views: number; contacts: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const k = d.toISOString().slice(0, 10);
      days[k] = { date: k.slice(5), views: 0, contacts: 0 };
    }
    events.forEach((e) => {
      const k = dayKey(e.created_at);
      if (!days[k]) return;
      if (e.event_type === "view") days[k].views++;
      else if (e.event_type === "whatsapp_click" || e.event_type === "phone_click")
        days[k].contacts++;
    });
    return Object.values(days);
  }, [events]);

  const totals = useMemo(() => {
    const acc = { view: 0, whatsapp_click: 0, phone_click: 0, qr_scan: 0 };
    events.forEach((e) => (acc[e.event_type] = (acc[e.event_type] ?? 0) + 1));
    return acc;
  }, [events]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container flex-1 space-y-8 py-8 md:py-10">
        <PageHero
          eyebrow="Painel do lojista"
          title="Histórico de cliques e visitas"
          subtitle="Últimos 30 dias — visualizações, cliques no WhatsApp, telefone e scans de QR Code."
          crumbs={[{ label: "Painel", to: "/painel-lojista" }, { label: "Histórico" }]}
          compact
        />


        {loading ? (
          <p className="text-muted-foreground">Carregando…</p>
        ) : !storeId ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Cadastre uma loja para ver o histórico.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-4">
              {(Object.keys(EVENT_LABEL) as EventRow["event_type"][]).map((t) => (
                <Card key={t}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="rounded-md bg-muted p-2 text-muted-foreground">
                      {EVENT_ICON[t]}
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">{EVENT_LABEL[t]}</div>
                      <div className="text-xl font-semibold text-foreground">
                        {totals[t]}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-4 w-4" /> Atividade diária (30d)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 6,
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="views"
                      name="Visualizações"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="contacts"
                      name="Contatos"
                      stroke="hsl(var(--accent))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
              <CardContent className="p-6">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className="gap-1 bg-primary/10 text-primary hover:bg-primary/15">
                        <Sparkles className="h-3 w-3" /> Destaque & Plus
                      </Badge>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Lock className="h-3 w-3" /> Exclusivo
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        Quer insights mais profundos?
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Vá além do histórico bruto. A Inteligência da Loja transforma seus dados em decisões.
                      </p>
                    </div>
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {[
                        { icon: Clock, label: "Heatmap de horário de pico" },
                        { icon: TrendingUp, label: "Ranking das ofertas que mais convertem" },
                        { icon: Target, label: "Benchmark com concorrentes da categoria" },
                        { icon: Sparkles, label: "Percentil e média da sua cidade" },
                      ].map(({ icon: Icon, label }) => (
                        <li key={label} className="flex items-start gap-2 text-sm text-foreground">
                          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>{label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex shrink-0 md:flex-col md:items-end">
                    <Button asChild size="lg" className="gap-2">
                      <Link to="/painel-lojista/inteligencia">
                        Ver Inteligência da Loja
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>



            <Card>
              <CardHeader>
                <CardTitle className="text-base">Linha do tempo</CardTitle>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os eventos</SelectItem>
                      <SelectItem value="view">Visualizações</SelectItem>
                      <SelectItem value="whatsapp_click">Clique WhatsApp</SelectItem>
                      <SelectItem value="phone_click">Clique Telefone</SelectItem>
                      <SelectItem value="qr_scan">Scan QR</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterOffer} onValueChange={setFilterOffer}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Oferta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as ofertas</SelectItem>
                      {offerList.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {filtered.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Nenhum evento no período/filtro selecionado.
                  </p>
                ) : (
                  <div className="divide-y">
                    {filtered.slice(0, 200).map((e) => (
                      <div
                        key={e.id}
                        className="flex items-start justify-between gap-3 py-3 text-sm"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 rounded-md bg-muted p-1.5 text-muted-foreground">
                            {EVENT_ICON[e.event_type]}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">
                              {EVENT_LABEL[e.event_type]}
                              <span className="ml-2 text-muted-foreground">
                                · {offers[e.offer_id] ?? "—"}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(e.created_at).toLocaleString("pt-BR")}
                              {e.referrer && (
                                <>
                                  {" · "}
                                  <span className="truncate">de {e.referrer}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        {e.session_id && (
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {e.session_id.slice(0, 6)}
                          </Badge>
                        )}
                      </div>
                    ))}
                    {filtered.length > 200 && (
                      <p className="pt-3 text-center text-xs text-muted-foreground">
                        Exibindo os 200 eventos mais recentes de {filtered.length}.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, TrendingUp, Eye, MessageCircle, Target, Sparkles, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

type Daily = { date: string; views: number; contacts: number };
type HeatCell = { dow: number; hour: number; count: number };
type TopOffer = {
  offer_id: string;
  title: string;
  views: number;
  contacts: number;
  conversion_rate: number;
};
type Intel = {
  period_days: number;
  views: number;
  contacts: number;
  conversion_rate: number;
  whatsapp_clicks: number;
  phone_clicks: number;
  daily: Daily[];
  heatmap: HeatCell[];
  top_offers: TopOffer[];
};
type Benchmark = {
  has_data: boolean;
  reason?: string;
  city?: string;
  state?: string;
  categories?: string[];
  self?: { views: number; contacts: number; conversion: number };
  peers?: {
    peer_count: number;
    avg_views: number;
    avg_contacts: number;
    avg_conversion: number;
    median_conversion: number;
    self_percentile_conversion: number;
  };
};

const DOW_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const PLUS_PLAN_SLUG = "plus";
const ELIGIBLE_PLANS = new Set(["destaque", "plus"]);

const Stat = ({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string | number;
  icon: any;
  hint?: string;
}) => (
  <div className="rounded-xl border bg-card p-4">
    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
    <div className="mt-2 text-2xl font-semibold text-foreground">{value}</div>
    {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
  </div>
);

const Heatmap = ({ data }: { data: HeatCell[] }) => {
  const max = Math.max(1, ...data.map((c) => c.count));
  const grid = useMemo(() => {
    const m = new Map<string, number>();
    data.forEach((c) => m.set(`${c.dow}-${c.hour}`, c.count));
    return m;
  }, [data]);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="grid" style={{ gridTemplateColumns: "40px repeat(24, minmax(20px, 1fr))" }}>
          <div />
          {Array.from({ length: 24 }).map((_, h) => (
            <div key={h} className="text-center text-[10px] text-muted-foreground">
              {h}
            </div>
          ))}
          {DOW_LABELS.map((label, dow) => (
            <div key={dow} className="contents">
              <div className="flex items-center text-xs font-medium text-muted-foreground">{label}</div>
              {Array.from({ length: 24 }).map((_, h) => {
                const v = grid.get(`${dow}-${h}`) ?? 0;
                const intensity = v / max;
                const bg =
                  v === 0
                    ? "hsl(var(--muted))"
                    : `hsl(var(--accent) / ${Math.max(0.15, intensity).toFixed(2)})`;
                return (
                  <div
                    key={h}
                    title={`${DOW_LABELS[dow]} ${h}h — ${v} eventos`}
                    className="m-[1px] aspect-square rounded-sm"
                    style={{ background: bg }}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span>Menos</span>
          <div className="h-3 w-24 rounded-sm bg-gradient-to-r from-muted to-accent" />
          <span>Mais</span>
        </div>
      </div>
    </div>
  );
};

export default function Inteligencia() {
  const { user } = useAuth();
  const [storeId, setStoreId] = useState<string | null>(null);
  const subInfo = useSubscription(storeId);
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [intel, setIntel] = useState<Intel | null>(null);
  const [benchmark, setBenchmark] = useState<Benchmark | null>(null);
  const [loading, setLoading] = useState(true);

  const planSlug = subInfo.plan?.slug ?? null;
  const eligible = subInfo.isActive && planSlug !== null && ELIGIBLE_PLANS.has(planSlug);
  const isPlus = subInfo.isActive && planSlug === PLUS_PLAN_SLUG;

  useEffect(() => {
    if (!user) return;
    supabase
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1)
      .then(({ data }) => setStoreId(data?.[0]?.id ?? null));
  }, [user]);

  useEffect(() => {
    if (!storeId || !eligible) {
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      const intelRes = await supabase.rpc("store_intelligence", {
        p_store_id: storeId,
        p_days: days,
      });
      if (!intelRes.error) setIntel(intelRes.data as unknown as Intel);
      if (isPlus) {
        const benchRes = await supabase.rpc("category_benchmark", {
          p_store_id: storeId,
          p_days: days,
        });
        if (!benchRes.error) setBenchmark(benchRes.data as unknown as Benchmark);
      }
      setLoading(false);
    })();
  }, [storeId, days, eligible, isPlus]);

  const dailyData = useMemo(
    () =>
      (intel?.daily ?? []).map((d) => ({
        date: new Date(d.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        Visualizações: d.views,
        Contatos: d.contacts,
      })),
    [intel],
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container flex-1 py-10">
        <div className="mb-4">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to="/painel-lojista">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Painel
            </Link>
          </Button>
        </div>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-display text-foreground">Inteligência da Loja</h1>
            <p className="text-muted-foreground">
              Performance, horários de pico e comparativo de mercado.
            </p>
          </div>
          <Tabs value={String(days)} onValueChange={(v) => setDays(Number(v) as 7 | 30 | 90)}>
            <TabsList>
              <TabsTrigger value="7">7 dias</TabsTrigger>
              <TabsTrigger value="30">30 dias</TabsTrigger>
              <TabsTrigger value="90">90 dias</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {!subInfo.loading && !eligible && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" /> Recurso exclusivo dos planos Destaque e Plus
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Veja métricas reais da sua loja: visualizações, taxa de conversão, horários de pico
                e — no plano Plus — como você se compara aos concorrentes da sua categoria na cidade.
              </p>
              <Button asChild variant="accent">
                <Link to="/painel-lojista/assinatura">Conhecer planos</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {eligible && loading && <p className="text-muted-foreground">Carregando…</p>}

        {eligible && !loading && intel && (
          <div className="space-y-8">
            {/* KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Visualizações" value={intel.views} icon={Eye} />
              <Stat
                label="Cliques de contato"
                value={intel.contacts}
                icon={MessageCircle}
                hint={`${intel.whatsapp_clicks} WhatsApp · ${intel.phone_clicks} telefone`}
              />
              <Stat
                label="Taxa de conversão"
                value={`${intel.conversion_rate}%`}
                icon={Target}
                hint="Contatos ÷ visualizações"
              />
              <Stat
                label="Período"
                value={`${intel.period_days}d`}
                icon={TrendingUp}
                hint="Dados em tempo real"
              />
            </div>

            {/* Daily series */}
            <Card>
              <CardHeader>
                <CardTitle>Evolução diária</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {dailyData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados no período.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyData} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line
                        type="monotone"
                        dataKey="Visualizações"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="Contatos"
                        stroke="hsl(var(--accent))"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Heatmap */}
            <Card>
              <CardHeader>
                <CardTitle>Horário de pico</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Quando seus clientes mais interagem com suas ofertas.
                </p>
              </CardHeader>
              <CardContent>
                <Heatmap data={intel.heatmap} />
              </CardContent>
            </Card>

            {/* Top offers */}
            <Card>
              <CardHeader>
                <CardTitle>Ofertas que mais convertem</CardTitle>
              </CardHeader>
              <CardContent>
                {intel.top_offers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem ofertas com eventos no período.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-muted-foreground">
                        <tr>
                          <th className="py-2">Oferta</th>
                          <th className="text-right">Visualizações</th>
                          <th className="text-right">Contatos</th>
                          <th className="text-right">Conversão</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {intel.top_offers.map((o) => (
                          <tr key={o.offer_id}>
                            <td className="py-3 font-medium text-foreground">{o.title}</td>
                            <td className="text-right">{o.views}</td>
                            <td className="text-right">{o.contacts}</td>
                            <td className="text-right">
                              <Badge variant={o.conversion_rate >= 5 ? "default" : "secondary"}>
                                {o.conversion_rate}%
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Benchmark — Plus only */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent-strong" /> Comparativo com a categoria
                  {!isPlus && (
                    <Badge variant="secondary" className="ml-2">
                      <Lock className="mr-1 h-3 w-3" /> Plus
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Como você se compara a outros lojistas da mesma categoria na sua cidade. Dados
                  agregados — sem identificação de concorrentes.
                </p>
              </CardHeader>
              <CardContent>
                {!isPlus ? (
                  <Alert>
                    <Lock className="h-4 w-4" />
                    <AlertTitle>Disponível no plano Plus</AlertTitle>
                    <AlertDescription className="flex items-center justify-between gap-3">
                      <span>
                        Veja médias da categoria, mediana e em que percentil sua loja se encontra.
                      </span>
                      <Button asChild size="sm" variant="accent">
                        <Link to="/painel-lojista/assinatura">Fazer upgrade</Link>
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : !benchmark || !benchmark.has_data ? (
                  <p className="text-sm text-muted-foreground">
                    Ainda não há dados suficientes para gerar o comparativo. Publique ofertas
                    aprovadas para participar do benchmark.
                  </p>
                ) : (
                  <div className="space-y-5">
                    <div className="text-xs text-muted-foreground">
                      Base: {benchmark.peers!.peer_count} concorrente(s) em{" "}
                      <strong className="text-foreground">
                        {benchmark.city}/{benchmark.state}
                      </strong>{" "}
                      · categoria(s):{" "}
                      <strong className="text-foreground">
                        {(benchmark.categories ?? []).join(", ")}
                      </strong>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Stat
                        label="Sua conversão"
                        value={`${(benchmark.self?.conversion ?? 0).toFixed(2)}%`}
                        icon={Target}
                      />
                      <Stat
                        label="Média da categoria"
                        value={`${benchmark.peers!.avg_conversion}%`}
                        icon={TrendingUp}
                        hint={`Mediana ${benchmark.peers!.median_conversion}%`}
                      />
                      <Stat
                        label="Seu percentil"
                        value={`${benchmark.peers!.self_percentile_conversion ?? 0}º`}
                        icon={Sparkles}
                        hint={
                          (benchmark.peers!.self_percentile_conversion ?? 0) >= 80
                            ? "Top 20% da categoria"
                            : (benchmark.peers!.self_percentile_conversion ?? 0) >= 50
                              ? "Acima da mediana"
                              : "Abaixo da mediana"
                        }
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border bg-card p-4 text-sm">
                        <div className="text-muted-foreground">Visualizações</div>
                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="text-xl font-semibold text-foreground">
                            {benchmark.self?.views ?? 0}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            vs média {benchmark.peers!.avg_views}
                          </span>
                        </div>
                      </div>
                      <div className="rounded-xl border bg-card p-4 text-sm">
                        <div className="text-muted-foreground">Contatos</div>
                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="text-xl font-semibold text-foreground">
                            {benchmark.self?.contacts ?? 0}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            vs média {benchmark.peers!.avg_contacts}
                          </span>
                        </div>
                      </div>
                    </div>
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

import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  Crown,
  Gift,
  Plus,
  ScanLine,
  Settings2,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ValidateCustomerDialog } from "@/components/painel/ValidateCustomerDialog";
import {
  GOAL_TYPES,
  REWARD_KIND_LABELS,
  createStoreProgram,
  deleteMission,
  deleteReward,
  fetchLoyaltyReport,
  fetchStoreProgram,
  formatCents,
  saveMission,
  saveReward,
  updateStoreProgram,
  upsertTier,
  type LoyaltyProgramRow,
  type LoyaltyReport,
  type LoyaltyRewardKind,
  type LoyaltyRules,
} from "@/lib/loyalty-api";
import { toast } from "sonner";

const RULE_LABELS: { key: keyof LoyaltyRules; label: string; hint?: string }[] = [
  { key: "follow", label: "Seguir a loja" },
  { key: "favorite", label: "Favoritar oferta" },
  { key: "review", label: "Avaliação publicada" },
  { key: "review_photo", label: "Bônus por foto na avaliação" },
  { key: "share", label: "Compartilhar oferta" },
  { key: "checkin", label: "Check-in na loja (1x/dia)" },
  { key: "coupon", label: "Resgate de cupom" },
  { key: "referral", label: "Indicação de amigo" },
  { key: "purchase_per_real", label: "Pontos por R$ 1 em compras" },
];

type RewardDraft = {
  id?: string;
  title: string;
  description: string;
  kind: LoyaltyRewardKind;
  points_cost: number;
  credit_reais: number;
  stock: string;
  valid_until: string;
  active: boolean;
};

type MissionDraft = {
  id?: string;
  title: string;
  description: string;
  goal_type: string;
  goal_count: number;
  reward_points: number;
  period: string;
  active: boolean;
};

const emptyReward: RewardDraft = {
  title: "",
  description: "",
  kind: "gift",
  points_cost: 100,
  credit_reais: 0,
  stock: "",
  valid_until: "",
  active: true,
};

const emptyMission: MissionDraft = {
  title: "",
  description: "",
  goal_type: "purchase",
  goal_count: 3,
  reward_points: 150,
  period: "month",
  active: true,
};

export function PainelFidelidade({ storeId }: { storeId: string }) {
  const [program, setProgram] = useState<LoyaltyProgramRow | null>(null);
  const [tiers, setTiers] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [report, setReport] = useState<LoyaltyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validateOpen, setValidateOpen] = useState(false);
  const [rewardDraft, setRewardDraft] = useState<RewardDraft | null>(null);
  const [missionDraft, setMissionDraft] = useState<MissionDraft | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchStoreProgram(storeId);
      setProgram(data.program);
      setTiers(data.tiers);
      setRewards(data.rewards);
      setMissions(data.missions);
      if (data.program) setReport(await fetchLoyaltyReport(storeId, 30));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    load();
  }, [load]);

  const patchProgram = async (patch: Partial<LoyaltyProgramRow>) => {
    if (!program) return;
    setProgram({ ...program, ...patch } as LoyaltyProgramRow);
    try {
      await updateStoreProgram(program.id, patch as any);
    } catch (e: any) {
      toast.error(e.message);
      load();
    }
  };

  const handleActivate = async () => {
    setSaving(true);
    try {
      await createStoreProgram(storeId);
      toast.success("Programa FlyPontos ativado!");
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const submitReward = async () => {
    if (!rewardDraft?.title.trim()) return toast.error("Informe o título da recompensa");
    setSaving(true);
    try {
      await saveReward(storeId, {
        id: rewardDraft.id,
        title: rewardDraft.title.trim(),
        description: rewardDraft.description.trim() || null,
        kind: rewardDraft.kind,
        points_cost: Math.max(1, rewardDraft.points_cost),
        credit_cents: Math.round((rewardDraft.credit_reais || 0) * 100),
        coupon_id: null,
        stock: rewardDraft.stock === "" ? null : Math.max(0, Number(rewardDraft.stock)),
        valid_until: rewardDraft.valid_until || null,
        active: rewardDraft.active,
      });
      toast.success("Recompensa salva");
      setRewardDraft(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const submitMission = async () => {
    if (!missionDraft?.title.trim()) return toast.error("Informe o título da missão");
    setSaving(true);
    try {
      await saveMission(storeId, {
        id: missionDraft.id,
        title: missionDraft.title.trim(),
        description: missionDraft.description.trim() || null,
        goal_type: missionDraft.goal_type,
        goal_count: Math.max(1, missionDraft.goal_count),
        reward_points: Math.max(1, missionDraft.reward_points),
        period: missionDraft.period,
        active: missionDraft.active,
      });
      toast.success("Missão salva");
      setMissionDraft(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando programa…</p>;
  }

  if (!program) {
    return (
      <Card>
        <CardContent className="space-y-4 py-12 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-primary" />
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Ative o FlyPontos na sua loja</h3>
            <p className="mx-auto max-w-md text-sm text-muted-foreground">
              Recompense quem segue, avalia e compra na sua loja. Você define as regras de
              pontuação, os níveis, as recompensas e valida cada compra pelo QR do cliente.
            </p>
          </div>
          <Button variant="accent" onClick={handleActivate} disabled={saving}>
            {saving ? "Ativando…" : "Ativar programa grátis"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-primary" />
            <div>
              <p className="font-semibold">FlyPontos</p>
              <p className="text-sm text-muted-foreground">
                {program.active ? "Programa ativo para seus clientes" : "Programa pausado"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              Ativo
              <Switch
                checked={program.active}
                onCheckedChange={(v) => patchProgram({ active: v })}
              />
            </div>
            <Button variant="accent" onClick={() => setValidateOpen(true)}>
              <ScanLine className="h-4 w-4" /> Validar cliente
            </Button>
          </div>
        </CardContent>
      </Card>

      {report && !report.error && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Membros", value: report.members, hint: `+${report.new_members} em 30 dias` },
            {
              label: "Compras validadas",
              value: report.validated_purchases,
              hint: `${formatCents(report.revenue_cents)} em vendas`,
            },
            {
              label: "Pontos emitidos",
              value: report.points_issued,
              hint: `${report.points_redeemed} resgatados`,
            },
            {
              label: "Saldo em circulação",
              value: report.points_liability,
              hint: `${formatCents(report.credit_liability_cents)} em crédito`,
            },
          ].map((k) => (
            <Card key={k.label}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-2xl font-bold">{k.value}</p>
                <p className="text-xs text-muted-foreground">{k.hint}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="regras">
        <TabsList className="flex-wrap">
          <TabsTrigger value="regras">
            <Settings2 className="mr-1 h-4 w-4" /> Regras
          </TabsTrigger>
          <TabsTrigger value="niveis">
            <Crown className="mr-1 h-4 w-4" /> Níveis
          </TabsTrigger>
          <TabsTrigger value="recompensas">
            <Gift className="mr-1 h-4 w-4" /> Recompensas
          </TabsTrigger>
          <TabsTrigger value="missoes">
            <Target className="mr-1 h-4 w-4" /> Missões
          </TabsTrigger>
          <TabsTrigger value="relatorio">
            <BarChart3 className="mr-1 h-4 w-4" /> Relatório
          </TabsTrigger>
        </TabsList>

        <TabsContent value="regras" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pontuação</CardTitle>
              <CardDescription>
                Defina quantos pontos cada ação do cliente vale na sua loja.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {RULE_LABELS.map(({ key, label }) => (
                <div key={key}>
                  <Label>{label}</Label>
                  <Input
                    type="number"
                    min={0}
                    step={key === "purchase_per_real" ? 0.1 : 1}
                    value={program.rules?.[key] ?? 0}
                    onChange={(e) =>
                      setProgram({
                        ...program,
                        rules: { ...program.rules, [key]: Number(e.target.value) },
                      })
                    }
                    onBlur={() => patchProgram({ rules: program.rules })}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cashback e validade</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Cashback por compra (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={50}
                  step={0.5}
                  value={program.cashback_percent}
                  onChange={(e) =>
                    setProgram({ ...program, cashback_percent: Number(e.target.value) })
                  }
                  onBlur={() => patchProgram({ cashback_percent: program.cashback_percent })}
                />
              </div>
              <div>
                <Label>Validade dos pontos (meses)</Label>
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={program.points_expire_months}
                  onChange={(e) =>
                    setProgram({ ...program, points_expire_months: Number(e.target.value) })
                  }
                  onBlur={() =>
                    patchProgram({ points_expire_months: program.points_expire_months })
                  }
                />
              </div>
              <div>
                <Label>Raio do check-in (metros)</Label>
                <Input
                  type="number"
                  min={50}
                  max={2000}
                  step={50}
                  value={program.checkin_radius_meters}
                  onChange={(e) =>
                    setProgram({ ...program, checkin_radius_meters: Number(e.target.value) })
                  }
                  onBlur={() =>
                    patchProgram({ checkin_radius_meters: program.checkin_radius_meters })
                  }
                />
              </div>
              <div className="sm:col-span-3">
                <Label>Regulamento (opcional)</Label>
                <Textarea
                  rows={4}
                  value={program.terms ?? ""}
                  onChange={(e) => setProgram({ ...program, terms: e.target.value })}
                  onBlur={() => patchProgram({ terms: program.terms })}
                  placeholder="Condições de uso dos pontos, prazos de retirada de brindes, etc."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="niveis" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Níveis do cliente</CardTitle>
              <CardDescription>
                O multiplicador aumenta os pontos ganhos por clientes daquele nível.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {tiers.map((t) => (
                <div key={t.id} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-4">
                  <div>
                    <Label>Nome</Label>
                    <Input
                      value={t.name}
                      onChange={(e) =>
                        setTiers((prev) =>
                          prev.map((x) => (x.id === t.id ? { ...x, name: e.target.value } : x)),
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label>Pontos mínimos</Label>
                    <Input
                      type="number"
                      min={0}
                      value={t.min_points}
                      onChange={(e) =>
                        setTiers((prev) =>
                          prev.map((x) =>
                            x.id === t.id ? { ...x, min_points: Number(e.target.value) } : x,
                          ),
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label>Multiplicador</Label>
                    <Input
                      type="number"
                      min={1}
                      step={0.1}
                      value={t.multiplier}
                      onChange={(e) =>
                        setTiers((prev) =>
                          prev.map((x) =>
                            x.id === t.id ? { ...x, multiplier: Number(e.target.value) } : x,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={saving}
                      onClick={async () => {
                        setSaving(true);
                        try {
                          await upsertTier(storeId, {
                            id: t.id,
                            name: t.name,
                            min_points: Number(t.min_points),
                            multiplier: Number(t.multiplier),
                            early_access: !!t.early_access,
                            extra_discount_percent: Number(t.extra_discount_percent ?? 0),
                          });
                          toast.success("Nível atualizado");
                          load();
                        } catch (e: any) {
                          toast.error(e.message);
                        } finally {
                          setSaving(false);
                        }
                      }}
                    >
                      Salvar
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recompensas" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button variant="accent" onClick={() => setRewardDraft({ ...emptyReward })}>
              <Plus className="h-4 w-4" /> Nova recompensa
            </Button>
          </div>
          {rewards.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Crie a primeira recompensa para seus clientes trocarem pontos.
            </p>
          ) : (
            <div className="space-y-2">
              {rewards.map((r) => (
                <Card key={r.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="font-medium">{r.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {REWARD_KIND_LABELS[r.kind as LoyaltyRewardKind]} ·{" "}
                        {r.points_cost} pontos
                        {r.stock !== null ? ` · estoque ${r.stock}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={r.active ? "secondary" : "outline"}>
                        {r.active ? "Ativa" : "Inativa"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setRewardDraft({
                            id: r.id,
                            title: r.title,
                            description: r.description ?? "",
                            kind: r.kind,
                            points_cost: r.points_cost,
                            credit_reais: Number(r.credit_cents ?? 0) / 100,
                            stock: r.stock === null ? "" : String(r.stock),
                            valid_until: r.valid_until ?? "",
                            active: r.active,
                          })
                        }
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            await deleteReward(r.id);
                            toast.success("Recompensa removida");
                            load();
                          } catch (e: any) {
                            toast.error(e.message);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="missoes" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button variant="accent" onClick={() => setMissionDraft({ ...emptyMission })}>
              <Plus className="h-4 w-4" /> Nova missão
            </Button>
          </div>
          {missions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Missões incentivam recompra: ex. "3 compras no mês = 150 pontos".
            </p>
          ) : (
            <div className="space-y-2">
              {missions.map((m) => (
                <Card key={m.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="font-medium">{m.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {GOAL_TYPES.find((g) => g.value === m.goal_type)?.label ?? m.goal_type} ·
                        meta {m.goal_count} · +{m.reward_points} pontos
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={m.active ? "secondary" : "outline"}>
                        {m.active ? "Ativa" : "Inativa"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setMissionDraft({
                            id: m.id,
                            title: m.title,
                            description: m.description ?? "",
                            goal_type: m.goal_type,
                            goal_count: m.goal_count,
                            reward_points: m.reward_points,
                            period: m.period,
                            active: m.active,
                          })
                        }
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            await deleteMission(m.id);
                            toast.success("Missão removida");
                            load();
                          } catch (e: any) {
                            toast.error(e.message);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="relatorio" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Clientes mais fiéis (30 dias)</CardTitle>
            </CardHeader>
            <CardContent>
              {!report?.top_members?.length ? (
                <p className="text-sm text-muted-foreground">
                  Sem dados suficientes ainda. Valide compras para começar a medir.
                </p>
              ) : (
                <ul className="space-y-2">
                  {report.top_members.map((m, i) => (
                    <li
                      key={`${m.name}-${i}`}
                      className="flex items-center justify-between gap-3 rounded-md border p-2 text-sm"
                    >
                      <span className="flex-1 truncate font-medium">{m.name}</span>
                      {m.tier && <Badge variant="outline">{m.tier}</Badge>}
                      <span className="text-muted-foreground">{m.visits_count} visitas</span>
                      <span className="font-semibold text-primary">{m.points_balance} pts</span>
                    </li>
                  ))}
                </ul>
              )}
              {report && !report.error && (
                <p className="mt-4 text-xs text-muted-foreground">
                  Ticket médio {formatCents(report.avg_ticket_cents)} ·{" "}
                  {report.returning_members} clientes recorrentes ·{" "}
                  {report.redemptions_pending} resgates aguardando retirada.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* recompensa */}
      <Dialog open={!!rewardDraft} onOpenChange={(v) => !v && setRewardDraft(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{rewardDraft?.id ? "Editar recompensa" : "Nova recompensa"}</DialogTitle>
          </DialogHeader>
          {rewardDraft && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Título</Label>
                <Input
                  value={rewardDraft.title}
                  onChange={(e) => setRewardDraft({ ...rewardDraft, title: e.target.value })}
                  placeholder="Ex.: Café grátis"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Descrição</Label>
                <Textarea
                  rows={3}
                  value={rewardDraft.description}
                  onChange={(e) =>
                    setRewardDraft({ ...rewardDraft, description: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select
                  value={rewardDraft.kind}
                  onValueChange={(v) =>
                    setRewardDraft({ ...rewardDraft, kind: v as LoyaltyRewardKind })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(REWARD_KIND_LABELS).map(([k, label]) => (
                      <SelectItem key={k} value={k}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Custo em pontos</Label>
                <Input
                  type="number"
                  min={1}
                  value={rewardDraft.points_cost}
                  onChange={(e) =>
                    setRewardDraft({ ...rewardDraft, points_cost: Number(e.target.value) })
                  }
                />
              </div>
              {rewardDraft.kind === "credit" && (
                <div>
                  <Label>Valor do crédito (R$)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={rewardDraft.credit_reais}
                    onChange={(e) =>
                      setRewardDraft({ ...rewardDraft, credit_reais: Number(e.target.value) })
                    }
                  />
                </div>
              )}
              <div>
                <Label>Estoque (vazio = ilimitado)</Label>
                <Input
                  type="number"
                  min={0}
                  value={rewardDraft.stock}
                  onChange={(e) => setRewardDraft({ ...rewardDraft, stock: e.target.value })}
                />
              </div>
              <div>
                <Label>Válida até</Label>
                <Input
                  type="date"
                  value={rewardDraft.valid_until}
                  onChange={(e) =>
                    setRewardDraft({ ...rewardDraft, valid_until: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <Switch
                  checked={rewardDraft.active}
                  onCheckedChange={(v) => setRewardDraft({ ...rewardDraft, active: v })}
                />
                <span className="text-sm">Visível para os clientes</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRewardDraft(null)}>
              Cancelar
            </Button>
            <Button variant="accent" onClick={submitReward} disabled={saving}>
              {saving ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* missão */}
      <Dialog open={!!missionDraft} onOpenChange={(v) => !v && setMissionDraft(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{missionDraft?.id ? "Editar missão" : "Nova missão"}</DialogTitle>
          </DialogHeader>
          {missionDraft && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Título</Label>
                <Input
                  value={missionDraft.title}
                  onChange={(e) => setMissionDraft({ ...missionDraft, title: e.target.value })}
                  placeholder="Ex.: 3 visitas no mês"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Descrição</Label>
                <Textarea
                  rows={2}
                  value={missionDraft.description}
                  onChange={(e) =>
                    setMissionDraft({ ...missionDraft, description: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Objetivo</Label>
                <Select
                  value={missionDraft.goal_type}
                  onValueChange={(v) => setMissionDraft({ ...missionDraft, goal_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GOAL_TYPES.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Meta (quantidade)</Label>
                <Input
                  type="number"
                  min={1}
                  value={missionDraft.goal_count}
                  onChange={(e) =>
                    setMissionDraft({ ...missionDraft, goal_count: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label>Recompensa em pontos</Label>
                <Input
                  type="number"
                  min={1}
                  value={missionDraft.reward_points}
                  onChange={(e) =>
                    setMissionDraft({ ...missionDraft, reward_points: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label>Período</Label>
                <Select
                  value={missionDraft.period}
                  onValueChange={(v) => setMissionDraft({ ...missionDraft, period: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Semanal</SelectItem>
                    <SelectItem value="month">Mensal</SelectItem>
                    <SelectItem value="once">Única</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <Switch
                  checked={missionDraft.active}
                  onCheckedChange={(v) => setMissionDraft({ ...missionDraft, active: v })}
                />
                <span className="text-sm">Missão ativa</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setMissionDraft(null)}>
              Cancelar
            </Button>
            <Button variant="accent" onClick={submitMission} disabled={saving}>
              {saving ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ValidateCustomerDialog
        open={validateOpen}
        onOpenChange={setValidateOpen}
        onDone={load}
      />
    </div>
  );
}

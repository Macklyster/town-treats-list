import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBRLNumber } from "@/lib/format";
import type { Tier } from "@/lib/group-offers-api";

type Props = {
  value: Tier[];
  onChange: (tiers: Tier[]) => void;
  originalPrice?: number;
};

export const GroupOfferTierEditor = ({ value, onChange, originalPrice = 0 }: Props) => {
  const tiers = value.length > 0 ? value : [{ min_people: 1, price: 0 }];
  const [normalDiscountPct, setNormalDiscountPct] = useState<number>(15);

  const update = (i: number, patch: Partial<Tier>) => {
    const next = tiers.map((t, idx) => (idx === i ? { ...t, ...patch } : t));
    onChange(next);
  };

  const addTier = () => {
    const last = tiers[tiers.length - 1];
    onChange([
      ...tiers,
      {
        min_people: Math.max(2, last.min_people + 2),
        price: Math.max(0, Math.round(last.price * 0.85)),
      },
    ]);
  };

  const removeTier = (i: number) => {
    if (i === 0) return;
    onChange(tiers.filter((_, idx) => idx !== i));
  };

  // Live validation hints
  const errors = tiers.map((t, i) => {
    if (i === 0 && t.min_people !== 1) return "A primeira faixa deve ser 1 pessoa";
    if (i > 0) {
      const prev = tiers[i - 1];
      if (t.min_people <= prev.min_people) return "Pessoas devem ser maior que a faixa anterior";
      if (t.price >= prev.price) return "Preço deve ser menor que a faixa anterior";
    }
    if (t.price <= 0) return "Preço deve ser maior que zero";
    return null;
  });

  const hasBase = originalPrice > 0;
  const normalPrice = useMemo(
    () => (hasBase ? originalPrice * (1 - Math.min(Math.max(normalDiscountPct, 0), 90) / 100) : 0),
    [originalPrice, normalDiscountPct, hasBase],
  );

  const rows = useMemo(() => {
    return tiers.map((t, i) => {
      const minPeople = t.min_people;
      const nextTier = tiers[i + 1];
      const maxPeople = nextTier ? nextTier.min_people - 1 : null;
      const peopleLabel =
        maxPeople === null
          ? `${minPeople} ou mais`
          : maxPeople === minPeople
            ? `${minPeople}`
            : `${minPeople} a ${maxPeople}`;
      const pctVsOriginal = hasBase ? (1 - t.price / originalPrice) * 100 : 0;
      const pctVsNormal = hasBase && normalPrice > 0 ? (1 - t.price / normalPrice) * 100 : 0;
      return {
        i,
        label: minPeople === 1 ? "Sozinho" : `${minPeople}+ pessoas`,
        peopleLabel,
        price: t.price,
        pctVsOriginal,
        pctVsNormal,
        minPeople,
        maxPeople,
      };
    });
  }, [tiers, originalPrice, normalPrice, hasBase]);

  const last = rows[rows.length - 1];
  const lastRevenueMin = last ? last.price * last.minPeople : 0;
  const lastNormalRevenueMin = last ? normalPrice * last.minPeople : 0;
  const lastGainMin = lastNormalRevenueMin - lastRevenueMin; // ganho de desconto p/ cliente

  return (
    <div className="space-y-3">
      <Label>Faixas de preço (escada)</Label>
      <p className="text-xs text-muted-foreground">
        Defina como o preço cai conforme mais pessoas entram. A primeira faixa é sempre "1 pessoa".
      </p>
      <div className="space-y-2">
        {tiers.map((t, i) => (
          <div key={i} className="flex items-end gap-2 rounded-md border p-3">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">A partir de (pessoas)</Label>
              <Input
                type="number"
                min={1}
                step={1}
                value={t.min_people}
                disabled={i === 0}
                onChange={(e) => update(i, { min_people: Number(e.target.value) || 1 })}
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">Preço por pessoa (R$)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={t.price}
                onChange={(e) => update(i, { price: Number(e.target.value) || 0 })}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeTier(i)}
              disabled={i === 0}
              title={i === 0 ? "Não é possível remover a faixa base" : "Remover"}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      {errors.some(Boolean) && (
        <ul className="space-y-1 text-xs text-destructive">
          {errors.map((e, i) => e && <li key={i}>Faixa {i + 1}: {e}</li>)}
        </ul>
      )}
      <Button type="button" variant="outline" size="sm" onClick={addTier}>
        <Plus className="h-4 w-4" /> Adicionar faixa
      </Button>

      {/* Preview */}
      <div className="space-y-3 rounded-md bg-muted/40 p-3 text-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-medium">Pré-visualização da escada</p>
            <p className="text-xs text-muted-foreground">
              Compare o desconto da coletiva com uma oferta normal hipotética.
            </p>
          </div>
          <div className="grid gap-1 sm:max-w-[220px]">
            <Label htmlFor="normal_pct" className="text-xs text-muted-foreground">
              Desconto típico de uma oferta normal (%)
            </Label>
            <Input
              id="normal_pct"
              type="number"
              min={0}
              max={90}
              step={1}
              value={normalDiscountPct}
              onChange={(e) =>
                setNormalDiscountPct(Math.min(90, Math.max(0, Number(e.target.value) || 0)))
              }
            />
            <p className="text-[11px] text-muted-foreground">Usado só para comparação, não é salvo.</p>
          </div>
        </div>

        {!hasBase && (
          <p className="text-xs text-muted-foreground">
            Informe o preço de tabela acima para ver o comparativo.
          </p>
        )}

        {/* Desktop table */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr>
                <th className="py-2 pr-2">Faixa</th>
                <th className="py-2 pr-2">Pessoas</th>
                <th className="py-2 pr-2">Preço/pessoa</th>
                {hasBase && <th className="py-2 pr-2">vs tabela</th>}
                {hasBase && <th className="py-2">vs normal</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => (
                <tr key={r.i}>
                  <td className="py-2 pr-2">{r.label}</td>
                  <td className="py-2 pr-2 text-muted-foreground">{r.peopleLabel}</td>
                  <td className="py-2 pr-2 font-medium">{formatBRLNumber(r.price)}</td>
                  {hasBase && (
                    <td className="py-2 pr-2 text-muted-foreground">
                      {r.pctVsOriginal > 0 ? `-${r.pctVsOriginal.toFixed(0)}%` : "—"}
                    </td>
                  )}
                  {hasBase && (
                    <td
                      className={`py-2 ${
                        r.pctVsNormal < 0 ? "text-destructive" : r.pctVsNormal > 0 ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {r.pctVsNormal > 0
                        ? `-${r.pctVsNormal.toFixed(0)}%`
                        : r.pctVsNormal < 0
                          ? `+${Math.abs(r.pctVsNormal).toFixed(0)}% mais caro`
                          : "—"}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile stacked */}
        <div className="space-y-2 sm:hidden">
          {rows.map((r) => (
            <div key={r.i} className="rounded-md border bg-background p-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{r.label}</span>
                <span className="font-medium">{formatBRLNumber(r.price)}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 text-xs text-muted-foreground">
                <span>Pessoas</span>
                <span className="text-right text-foreground">{r.peopleLabel}</span>
                {hasBase && (
                  <>
                    <span>vs tabela</span>
                    <span className="text-right text-foreground">
                      {r.pctVsOriginal > 0 ? `-${r.pctVsOriginal.toFixed(0)}%` : "—"}
                    </span>
                    <span>vs normal</span>
                    <span
                      className={`text-right ${
                        r.pctVsNormal < 0 ? "text-destructive" : r.pctVsNormal > 0 ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {r.pctVsNormal > 0
                        ? `-${r.pctVsNormal.toFixed(0)}%`
                        : r.pctVsNormal < 0
                          ? `+${Math.abs(r.pctVsNormal).toFixed(0)}% mais caro`
                          : "—"}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer summary */}
        {hasBase && last && (
          last.pctVsNormal < 0 ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
              Sua oferta normal ({normalDiscountPct}% off) seria mais barata que esta coletiva na última faixa.
              Revise as faixas de preço ou o % de comparação.
            </div>
          ) : (
            <div className="rounded-md border bg-background p-3 text-xs text-muted-foreground">
              Se atingir a última faixa ({last.label}, {last.peopleLabel}): faturamento estimado a partir de{" "}
              <strong className="text-foreground">{formatBRLNumber(lastRevenueMin)}</strong>
              {" "}({last.minPeople} {last.minPeople === 1 ? "pessoa" : "pessoas"}).
              Numa oferta normal (-{normalDiscountPct}%), seriam{" "}
              <strong className="text-foreground">{formatBRLNumber(lastNormalRevenueMin)}</strong>.
              Ganho do cliente:{" "}
              <strong className="text-primary">{formatBRLNumber(Math.max(0, lastGainMin))}</strong>{" "}
              a mais de desconto coletivo.
            </div>
          )
        )}
      </div>
    </div>
  );
};

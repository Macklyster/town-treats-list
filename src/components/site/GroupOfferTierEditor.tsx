import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Tier } from "@/lib/group-offers-api";

type Props = {
  value: Tier[];
  onChange: (tiers: Tier[]) => void;
};

export const GroupOfferTierEditor = ({ value, onChange }: Props) => {
  const tiers = value.length > 0 ? value : [{ min_people: 1, price: 0 }];

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
      <div className="rounded-md bg-muted/40 p-3 text-sm">
        <p className="mb-2 font-medium">Pré-visualização da escada</p>
        <ul className="space-y-1">
          {tiers.map((t, i) => (
            <li key={i} className="flex items-center justify-between">
              <span>
                {t.min_people === 1 ? "Sozinho" : `${t.min_people}+ pessoas`}
              </span>
              <strong>
                R$ {Number(t.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}{" "}
                <span className="text-xs font-normal text-muted-foreground">cada</span>
              </strong>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

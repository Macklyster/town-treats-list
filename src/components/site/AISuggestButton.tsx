import { invokeBackend } from "@/lib/invoke-backend";
import { useState } from "react";
import { Sparkles, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type OfferSuggestion = {
  title: string;
  description: string;
  suggested_promo_price: number;
  discount_pct: number;
  reasoning: string;
  examples_used: number;
};

interface Props {
  category_slug: string;
  original_price: number;
  current_title?: string;
  image_url?: string;
  store_name?: string;
  onApply: (patch: { title?: string; description?: string; promo_price?: number }) => void;
}

export function AISuggestButton({
  category_slug,
  original_price,
  current_title,
  image_url,
  store_name,
  onApply,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [s, setS] = useState<OfferSuggestion | null>(null);
  const disabled = !category_slug || !(original_price > 0) || loading;

  const fetchSuggestion = async () => {
    setLoading(true);
    setS(null);
    const { data, error } = await invokeBackend("suggest-offer", {
      body: { category_slug, original_price, current_title, image_url, store_name },
    });
    setLoading(false);
    if (error) {
      const status = (error as any).context?.status;
      if (status === 429) toast.error("Muitas solicitações. Tente novamente em instantes.");
      else if (status === 402) toast.error("Créditos de IA esgotados.");
      else toast.error((error as any).message || "Falha ao gerar sugestão");
      return;
    }
    setS(data as OfferSuggestion);
  };

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Sparkles className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-semibold">Sugerir com IA</p>
            <p className="text-xs text-muted-foreground">
              Gera título, descrição e preço com base em ofertas de sucesso da mesma categoria.
            </p>
          </div>
        </div>
        <Button type="button" size="sm" variant="accent" disabled={disabled} onClick={fetchSuggestion}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Gerando..." : "Gerar"}
        </Button>
      </div>

      {!category_slug || !(original_price > 0) ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Selecione a categoria e informe o preço original para liberar.
        </p>
      ) : null}

      {s && (
        <div className="mt-3 space-y-3 rounded-md border bg-background p-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Título sugerido</p>
            <p className="text-sm font-semibold">{s.title}</p>
            <Button type="button" size="sm" variant="outline" className="mt-1 h-7"
              onClick={() => { onApply({ title: s.title }); toast.success("Título aplicado"); }}>
              <Check className="h-3 w-3" /> Aplicar título
            </Button>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Descrição</p>
            <p className="text-sm">{s.description}</p>
            <Button type="button" size="sm" variant="outline" className="mt-1 h-7"
              onClick={() => { onApply({ description: s.description }); toast.success("Descrição aplicada"); }}>
              <Check className="h-3 w-3" /> Aplicar descrição
            </Button>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Preço promocional sugerido</p>
            <p className="text-sm font-semibold">
              R$ {s.suggested_promo_price.toFixed(2)}{" "}
              <span className="text-xs text-muted-foreground">({s.discount_pct}% OFF)</span>
            </p>
            <Button type="button" size="sm" variant="outline" className="mt-1 h-7"
              onClick={() => { onApply({ promo_price: s.suggested_promo_price }); toast.success("Preço aplicado"); }}>
              <Check className="h-3 w-3" /> Aplicar preço
            </Button>
          </div>
          {s.reasoning && (
            <p className="text-xs italic text-muted-foreground">💡 {s.reasoning}</p>
          )}
          <Button type="button" size="sm" variant="accent" className="w-full"
            onClick={() => {
              onApply({ title: s.title, description: s.description, promo_price: s.suggested_promo_price });
              toast.success("Tudo aplicado!");
            }}>
            <Check className="h-4 w-4" /> Aplicar tudo
          </Button>
          <p className="text-[10px] text-muted-foreground">
            Baseado em {s.examples_used} oferta(s) de sucesso da categoria.
          </p>
        </div>
      )}
    </div>
  );
}

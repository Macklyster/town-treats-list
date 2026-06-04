import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, X, Pause, Star, Trash2, CalendarPlus, ChevronDown, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  ids: string[];
  categories?: { slug: string; name: string }[];
  onCleared: () => void;
  onDone: () => void;
};

export function OfferBulkBar({ ids, categories = [], onCleared, onDone }: Props) {
  const [busy, setBusy] = useState(false);
  if (ids.length === 0) return null;

  const run = async (label: string, fn: () => Promise<{ error: any }>) => {
    setBusy(true);
    const { error } = await fn();
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`${label} aplicado a ${ids.length} oferta(s)`);
    onDone();
  };

  const setStatus = (status: "approved" | "rejected" | "paused" | "pending") =>
    run(`Status ${status}`, async () => supabase.from("offers").update({ status }).in("id", ids));

  const setFeatured = (featured: boolean) =>
    run(featured ? "Destaque ligado" : "Destaque removido", async () =>
      supabase.from("offers").update({ featured }).in("id", ids),
    );

  const extendValidity = async (days: number) => {
    setBusy(true);
    const { data, error } = await supabase.from("offers").select("id, valid_until").in("id", ids);
    if (error) {
      setBusy(false);
      return toast.error(error.message);
    }
    const today = new Date();
    for (const row of data ?? []) {
      const base = row.valid_until ? new Date(row.valid_until) : today;
      const target = base < today ? today : base;
      target.setDate(target.getDate() + days);
      await supabase.from("offers").update({ valid_until: target.toISOString().slice(0, 10) }).eq("id", row.id);
    }
    setBusy(false);
    toast.success(`Validade +${days}d em ${ids.length} oferta(s)`);
    onDone();
  };

  const setCategory = (slug: string) =>
    run(`Categoria → ${slug}`, async () => supabase.from("offers").update({ category_slug: slug }).in("id", ids));

  const remove = () =>
    run("Excluídas", async () => supabase.from("offers").delete().in("id", ids));

  return (
    <div className="sticky bottom-4 z-30 flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3 shadow-lg">
      <Badge variant="default" className="mr-1">{ids.length} selecionada(s)</Badge>
      <Button size="sm" variant="outline" disabled={busy} onClick={() => setStatus("approved")}>
        <Check className="mr-1 h-3 w-3" /> Aprovar
      </Button>
      <Button size="sm" variant="outline" disabled={busy} onClick={() => setStatus("rejected")}>
        <X className="mr-1 h-3 w-3" /> Rejeitar
      </Button>
      <Button size="sm" variant="outline" disabled={busy} onClick={() => setStatus("paused")}>
        <Pause className="mr-1 h-3 w-3" /> Pausar
      </Button>
      <Button size="sm" variant="outline" disabled={busy} onClick={() => setFeatured(true)}>
        <Star className="mr-1 h-3 w-3" /> Destacar
      </Button>
      <Button size="sm" variant="outline" disabled={busy} onClick={() => setFeatured(false)}>
        Remover destaque
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" disabled={busy}>
            <CalendarPlus className="mr-1 h-3 w-3" /> Validade <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Estender</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => extendValidity(7)}>+ 7 dias</DropdownMenuItem>
          <DropdownMenuItem onClick={() => extendValidity(15)}>+ 15 dias</DropdownMenuItem>
          <DropdownMenuItem onClick={() => extendValidity(30)}>+ 30 dias</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {categories.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" disabled={busy}>
              <Tag className="mr-1 h-3 w-3" /> Categoria <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-h-72 overflow-y-auto">
            {categories.map((c) => (
              <DropdownMenuItem key={c.slug} onClick={() => setCategory(c.slug)}>
                {c.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="destructive" disabled={busy}>
            <Trash2 className="mr-1 h-3 w-3" /> Excluir
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {ids.length} oferta(s)?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Button size="sm" variant="ghost" className="ml-auto" onClick={onCleared}>
        Limpar seleção
      </Button>
    </div>
  );
}

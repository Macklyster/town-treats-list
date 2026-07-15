import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  type: "offer" | "store";
  id: string;
  /** "button" renders the shadcn Button with a label. "icon" renders a compact heart chip suitable for overlaying on cards. */
  variant?: "button" | "icon";
  className?: string;
  size?: "sm" | "default" | "lg";
};

export function FavoriteButton({ type, id, variant = "button", className, size = "sm" }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fav, setFav] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  const table = type === "offer" ? "favorites" : "store_favorites";
  const column = type === "offer" ? "offer_id" : "store_id";

  useEffect(() => {
    if (!user) { setFav(false); return; }
    (async () => {
      const { data } = await supabase
        .from(table as any)
        .select("id")
        .eq("user_id", user.id)
        .eq(column, id)
        .maybeSingle();
      setFav(!!data);
    })();
  }, [user?.id, id, table, column]);

  const toggle = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!user) { navigate("/auth"); return; }
    if (fav === null || busy) return;
    setBusy(true);
    try {
      if (fav) {
        const { error } = await supabase
          .from(table as any)
          .delete()
          .eq("user_id", user.id)
          .eq(column, id);
        if (error) throw error;
        setFav(false);
        toast.success(type === "offer" ? "Removido dos favoritos" : "Loja removida dos favoritos");
      } else {
        const { error } = await supabase
          .from(table as any)
          .insert({ user_id: user.id, [column]: id } as any);
        if (error) throw error;
        setFav(true);
        toast.success(type === "offer" ? "Adicionado aos favoritos" : "Loja favoritada");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Falha ao atualizar favorito");
    } finally {
      setBusy(false);
    }
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-pressed={!!fav}
        aria-label={fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        className={cn(
          "grid h-9 w-9 place-items-center rounded-full border shadow-soft transition backdrop-blur",
          fav
            ? "border-destructive bg-destructive text-white"
            : "border-border/60 bg-background/85 text-foreground hover:border-destructive/50 hover:text-destructive",
          className,
        )}
        disabled={busy || fav === null}
      >
        <Heart className={cn("h-4 w-4", fav && "fill-current")} />
      </button>
    );
  }

  return (
    <Button
      size={size}
      variant={fav ? "outline" : "accentOutline"}
      className={cn(
        fav &&
          "border-destructive bg-destructive text-white hover:bg-destructive/90 hover:text-white",
        className,
      )}
      onClick={toggle}
      disabled={busy || fav === null}
    >
      <Heart className={cn("h-4 w-4", fav && "fill-current")} />
      {fav ? "Favoritada" : type === "offer" ? "Favoritar oferta" : "Favoritar loja"}
    </Button>
  );
}

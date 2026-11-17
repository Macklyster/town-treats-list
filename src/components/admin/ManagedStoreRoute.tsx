import { useEffect, useState } from "react";
import { Link, useParams } from "@/lib/router-compat";
import { ArrowLeft, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export function ManagedStoreRoute({ children }: { children: React.ReactNode }) {
  const { storeId } = useParams();
  const [store, setStore] = useState<{ name: string; managed_offers: boolean } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStore(null);
    setLoaded(false);
    if (!storeId) { setLoaded(true); return; }
    supabase.from("stores").select("name, managed_offers").eq("id", storeId).maybeSingle()
      .then(({ data }) => { if (!cancelled) { setStore(data); setLoaded(true); } });
    return () => { cancelled = true; };
  }, [storeId]);

  return (
    <ProtectedRoute requireRole="admin">
      <div className="sticky top-0 z-50 border-b bg-primary text-primary-foreground">
        <div className="container flex items-center gap-3 py-2 text-sm">
          <Briefcase className="h-4 w-4" />
          <span>Você está cadastrando para: <strong>{store?.name ?? "…"}</strong></span>
          <Link to={`/admin?tab=gerenciadas&store=${storeId}`} className="ml-auto inline-flex items-center gap-1 underline">
            <ArrowLeft className="h-3 w-3" /> Voltar ao Admin
          </Link>
        </div>
      </div>
      {!loaded ? (
        <div className="container py-16 text-center text-muted-foreground">Carregando loja…</div>
      ) : !store ? (
        <div className="container py-16 text-center text-muted-foreground">Loja não encontrada ou indisponível.</div>
      ) : !store.managed_offers ? (
        <div className="container py-16 text-center text-muted-foreground">
          Esta loja não contratou o serviço de Gestão de Ofertas. Ative em Admin → Gestão de Loja.
        </div>
      ) : (
        children
      )}
    </ProtectedRoute>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Images } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MediaLibrary } from "@/components/cms/MediaLibrary";

export default function Biblioteca() {
  const { user } = useAuth();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("stores").select("id").eq("owner_id", user.id).limit(1);
      setStoreId(data?.[0]?.id ?? null);
      setLoading(false);
    })();
  }, [user?.id]);

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <Header />
      <main className="container flex-1 py-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/painel-lojista"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao painel</Link>
        </Button>
        <h1 className="mb-2 flex items-center gap-2 text-display text-foreground">
          <Images className="h-7 w-7" /> Biblioteca de Mídia
        </h1>
        <p className="mb-6 text-muted-foreground">
          Gerencie todas as fotos da sua loja em um só lugar. Reutilize a mesma imagem em várias ofertas.
        </p>
        <Card>
          <CardHeader><CardTitle>Suas imagens</CardTitle></CardHeader>
          <CardContent>
            {loading ? <p>Carregando…</p> : !storeId ? (
              <p className="text-muted-foreground">Cadastre sua loja primeiro para usar a biblioteca.</p>
            ) : (
              <MediaLibrary storeId={storeId} />
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

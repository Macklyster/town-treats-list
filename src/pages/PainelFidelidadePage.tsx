import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import { Store } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { PageHero } from "@/components/site/PageHero";
import { SEO } from "@/components/seo/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PainelFidelidade } from "@/components/painel/PainelFidelidade";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function PainelFidelidadePage() {
  const { user } = useAuth();
  const [storeId, setStoreId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle()
      .then(({ data }) => setStoreId(data?.id ?? null));
  }, [user?.id]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO
        title="FlyPontos — programa de fidelidade da sua loja"
        description="Configure regras de pontuação, níveis, recompensas e missões do seu programa de fidelidade e valide compras dos clientes."
        path="/painel-lojista/fidelidade"
        noindex
      />
      <Header />
      <main className="container flex-1 space-y-6 py-8 md:py-10">
        <PageHero
          eyebrow="Painel do lojista"
          title="Fidelidade — FlyPontos"
          subtitle="Recompense seus clientes recorrentes e acompanhe o retorno do programa."
          crumbs={[
            { label: "Painel", to: "/painel-lojista" },
            { label: "Fidelidade" },
          ]}
          compact
        />
        {storeId === undefined ? (
          <Skeleton className="h-64 w-full" />
        ) : storeId === null ? (
          <Card>
            <CardContent className="space-y-3 py-12 text-center">
              <Store className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">
                Cadastre sua loja para ativar o programa de fidelidade.
              </p>
              <Button asChild variant="accent">
                <Link to="/painel-lojista/loja">Cadastrar loja</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <PainelFidelidade storeId={storeId} />
        )}
      </main>
      <Footer />
    </div>
  );
}

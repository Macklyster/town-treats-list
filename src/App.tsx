import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { CityProvider } from "@/hooks/useCity";
import { CitySelector } from "@/components/site/CitySelector";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import { ScrollToHash } from "./components/ScrollToHash";
import { BackToTopButton } from "./components/site/BackToTopButton";
import { InstallAppBanner } from "./components/site/InstallAppBanner";
import { ReviewPromptDialog } from "./components/site/ReviewPromptDialog";

// Lazy-load all secondary/auth-only routes to keep the home bundle small.
const OfferDetail = lazy(() => import("./pages/OfferDetail.tsx"));
const Anuncie = lazy(() => import("./pages/Anuncie.tsx"));
const Auth = lazy(() => import("./pages/Auth.tsx"));
const PainelLojista = lazy(() => import("./pages/PainelLojista.tsx"));
const OfertaForm = lazy(() => import("./pages/OfertaForm.tsx"));
const ColetivaForm = lazy(() => import("./pages/ColetivaForm.tsx"));
const ColetivaPublic = lazy(() => import("./pages/ColetivaPublic.tsx"));
const Coletivas = lazy(() => import("./pages/Coletivas.tsx"));
const Leiloes = lazy(() => import("./pages/Leiloes.tsx"));
const LeilaoForm = lazy(() => import("./pages/LeilaoForm.tsx"));
const LeilaoPublic = lazy(() => import("./pages/LeilaoPublic.tsx"));
const OfertaInvisivelForm = lazy(() => import("./pages/OfertaInvisivelForm.tsx"));
const OfertaInvisivelPublic = lazy(() => import("./pages/OfertaInvisivelPublic.tsx"));
const OfertasInvisiveis = lazy(() => import("./pages/OfertasInvisiveis.tsx"));
const LojaForm = lazy(() => import("./pages/LojaForm.tsx"));
const Admin = lazy(() => import("./pages/Admin.tsx"));
const Assinatura = lazy(() => import("./pages/Assinatura.tsx"));
const TermosDeUso = lazy(() => import("./pages/TermosDeUso.tsx"));
const PoliticaDePrivacidade = lazy(() => import("./pages/PoliticaDePrivacidade.tsx"));
const Notificacoes = lazy(() => import("./pages/Notificacoes.tsx"));
const Inteligencia = lazy(() => import("./pages/Inteligencia.tsx"));
const CityOffers = lazy(() => import("./pages/CityOffers.tsx"));
const StorePage = lazy(() => import("./pages/StorePage.tsx"));
const Cupons = lazy(() => import("./pages/Cupons.tsx"));
const Historico = lazy(() => import("./pages/Historico.tsx"));
const MeusCupons = lazy(() => import("./pages/MeusCupons.tsx"));
const MeuCupomDetalhe = lazy(() => import("./pages/MeuCupomDetalhe.tsx"));

const OfertasRedirect = () => {
  const { search } = useLocation();
  return <Navigate to={`/${search}#ofertas`} replace />;
};

const RouteFallback = () => (
  <div className="container py-20 text-center text-muted-foreground">Carregando…</div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CityProvider>
            <CitySelector />
            <ScrollToHash />
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/ofertas" element={<OfertasRedirect />} />
                <Route path="/ofertas/:cidadeSlug" element={<CityOffers />} />
                <Route path="/ofertas/:cidadeSlug/:categoriaSlug" element={<CityOffers />} />
                <Route path="/loja/:storeSlug" element={<StorePage />} />
                <Route path="/termos-de-uso" element={<TermosDeUso />} />
                <Route path="/politica-de-privacidade" element={<PoliticaDePrivacidade />} />
                <Route path="/oferta/:id" element={<OfferDetail />} />
                <Route path="/coletiva/:token" element={<ColetivaPublic />} />
                <Route path="/coletivas" element={<Coletivas />} />
                <Route path="/leilao/:token" element={<LeilaoPublic />} />
                <Route path="/leiloes" element={<Leiloes />} />
                <Route path="/oferta-invisivel/:token" element={<OfertaInvisivelPublic />} />
                <Route path="/ofertas-invisiveis" element={<OfertasInvisiveis />} />
                <Route path="/anuncie" element={<Anuncie />} />
                <Route path="/auth" element={<Auth />} />
                <Route
                  path="/meus-cupons"
                  element={
                    <ProtectedRoute>
                      <MeusCupons />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/meus-cupons/:id"
                  element={
                    <ProtectedRoute>
                      <MeuCupomDetalhe />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/perfil/notificacoes"
                  element={
                    <ProtectedRoute>
                      <Notificacoes />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/painel-lojista"
                  element={
                    <ProtectedRoute requireRole="lojista">
                      <PainelLojista />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/painel-lojista/loja"
                  element={
                    <ProtectedRoute requireRole="lojista">
                      <LojaForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/painel-lojista/oferta/:id?"
                  element={
                    <ProtectedRoute requireRole="lojista">
                      <OfertaForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/painel-lojista/coletiva/:id?"
                  element={
                    <ProtectedRoute requireRole="lojista">
                      <ColetivaForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/painel-lojista/leilao/:id?"
                  element={
                    <ProtectedRoute requireRole="lojista">
                      <LeilaoForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/painel-lojista/oferta-invisivel/:id?"
                  element={
                    <ProtectedRoute requireRole="lojista">
                      <OfertaInvisivelForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/painel-lojista/assinatura"
                  element={
                    <ProtectedRoute requireRole="lojista">
                      <Assinatura />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/painel-lojista/inteligencia"
                  element={
                    <ProtectedRoute requireRole="lojista">
                      <Inteligencia />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/painel-lojista/cupons"
                  element={
                    <ProtectedRoute requireRole="lojista">
                      <Cupons />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/painel-lojista/historico"
                  element={
                    <ProtectedRoute requireRole="lojista">
                      <Historico />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requireRole="admin">
                      <Admin />
                    </ProtectedRoute>
                  }
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <BackToTopButton />
            <InstallAppBanner />
            <ReviewPromptDialog />
          </CityProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

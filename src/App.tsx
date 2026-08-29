import { lazy, Suspense, useEffect } from "react";
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
import { ReviewPromptDialog } from "./components/site/ReviewPromptDialog";
import { PwaInstallDialog } from "./components/site/PwaInstallDialog";
import { PageSkeleton } from "./components/site/PageSkeleton";


// Lazy-load all secondary/auth-only routes to keep the home bundle small.
// Wrap dynamic imports so a stale chunk URL (after deploy/HMR) triggers a
// one-time hard reload instead of crashing the route with a blank screen.
const lazyWithReload = <T,>(loader: () => Promise<T>) =>
  lazy(() =>
    (loader() as Promise<any>).catch((err) => {
      const msg = String(err?.message ?? err);
      if (/Failed to fetch dynamically imported module|Importing a module script failed/i.test(msg)) {
        const key = "__chunk_reload__";
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, "1");
          window.location.reload();
          return new Promise(() => {}) as any;
        }
      }
      throw err;
    }),
  );

const OfferDetail = lazyWithReload(() => import("./pages/OfferDetail.tsx"));

const Anuncie = lazyWithReload(() => import("./pages/Anuncie.tsx"));
const Auth = lazyWithReload(() => import("./pages/Auth.tsx"));
const PainelLojista = lazyWithReload(() => import("./pages/PainelLojista.tsx"));
const OfertaForm = lazyWithReload(() => import("./pages/OfertaForm.tsx"));
const ColetivaForm = lazyWithReload(() => import("./pages/ColetivaForm.tsx"));
const ColetivaPublic = lazyWithReload(() => import("./pages/ColetivaPublic.tsx"));
const Coletivas = lazyWithReload(() => import("./pages/Coletivas.tsx"));
const Leiloes = lazyWithReload(() => import("./pages/Leiloes.tsx"));
const LeilaoForm = lazyWithReload(() => import("./pages/LeilaoForm.tsx"));
const LeilaoPublic = lazyWithReload(() => import("./pages/LeilaoPublic.tsx"));
const OfertaInvisivelForm = lazyWithReload(() => import("./pages/OfertaInvisivelForm.tsx"));
const OfertaInvisivelPublic = lazyWithReload(() => import("./pages/OfertaInvisivelPublic.tsx"));
const OfertasInvisiveis = lazyWithReload(() => import("./pages/OfertasInvisiveis.tsx"));
const LojaForm = lazyWithReload(() => import("./pages/LojaForm.tsx"));
const Admin = lazyWithReload(() => import("./pages/Admin.tsx"));
const Assinatura = lazyWithReload(() => import("./pages/Assinatura.tsx"));
const TermosDeUso = lazyWithReload(() => import("./pages/TermosDeUso.tsx"));
const PoliticaDePrivacidade = lazyWithReload(() => import("./pages/PoliticaDePrivacidade.tsx"));
const Notificacoes = lazyWithReload(() => import("./pages/Notificacoes.tsx"));
const Inteligencia = lazyWithReload(() => import("./pages/Inteligencia.tsx"));
const CityOffers = lazyWithReload(() => import("./pages/CityOffers.tsx"));
const StorePage = lazyWithReload(() => import("./pages/StorePage.tsx"));
const Cupons = lazyWithReload(() => import("./pages/Cupons.tsx"));
const Historico = lazyWithReload(() => import("./pages/Historico.tsx"));
const MeusCupons = lazyWithReload(() => import("./pages/MeusCupons.tsx"));
const Fidelidade = lazyWithReload(() => import("./pages/Fidelidade.tsx"));
const FidelidadeLoja = lazyWithReload(() => import("./pages/FidelidadeLoja.tsx"));

const MeuCupomDetalhe = lazyWithReload(() => import("./pages/MeuCupomDetalhe.tsx"));
const Favoritos = lazyWithReload(() => import("./pages/Favoritos.tsx"));
const Biblioteca = lazyWithReload(() => import("./pages/Biblioteca.tsx"));
const Eventos = lazyWithReload(() => import("./pages/Eventos.tsx"));
const EventoPublic = lazyWithReload(() => import("./pages/EventoPublic.tsx"));
const EventoForm = lazyWithReload(() => import("./pages/EventoForm.tsx"));

const OfertasRedirect = () => {
  const { search } = useLocation();
  return <Navigate to={`/${search}#ofertas`} replace />;
};

// Pre-warm lazy route chunks during browser idle time so navigations after the
// first paint feel instant (no Suspense fallback flash).
const prefetchRoutes = () => {
  const loaders: Array<() => Promise<unknown>> = [
    () => import("./pages/OfferDetail.tsx"),
    () => import("./pages/Coletivas.tsx"),
    () => import("./pages/Leiloes.tsx"),
    () => import("./pages/OfertasInvisiveis.tsx"),
    () => import("./pages/CityOffers.tsx"),
    () => import("./pages/StorePage.tsx"),
    () => import("./pages/Auth.tsx"),
    () => import("./pages/Anuncie.tsx"),
  ];
  loaders.forEach((load) => {
    try {
      load();
    } catch {}
  });
};

const RoutePrefetcher = () => {
  useEffect(() => {
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    };
    const schedule = w.requestIdleCallback
      ? (cb: () => void) => w.requestIdleCallback!(cb, { timeout: 2500 })
      : (cb: () => void) => window.setTimeout(cb, 1500);
    const id = schedule(prefetchRoutes);
    sessionStorage.removeItem("__chunk_reload__");
    return () => {
      if (typeof id === "number") clearTimeout(id);
    };
  }, []);
  return null;
};

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
            <RoutePrefetcher />
            <Suspense fallback={<PageSkeleton />}>
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
                <Route path="/eventos" element={<Eventos />} />
                <Route path="/evento/:slug" element={<EventoPublic />} />
                <Route path="/anuncie" element={<Anuncie />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/fidelidade" element={<Fidelidade />} />
                <Route path="/fidelidade/:slug" element={<FidelidadeLoja />} />

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
                  path="/favoritos"
                  element={
                    <ProtectedRoute>
                      <Favoritos />
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
                  path="/painel-lojista/evento/:id?"
                  element={
                    <ProtectedRoute requireRole="lojista">
                      <EventoForm />
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
                  path="/painel-lojista/midia"
                  element={
                    <ProtectedRoute requireRole="lojista">
                      <Biblioteca />
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
            <ReviewPromptDialog />
            <PwaInstallDialog />

          </CityProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

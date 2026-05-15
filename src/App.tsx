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
import OfferDetail from "./pages/OfferDetail.tsx";
import Anuncie from "./pages/Anuncie.tsx";
import Auth from "./pages/Auth.tsx";
import PainelLojista from "./pages/PainelLojista.tsx";
import OfertaForm from "./pages/OfertaForm.tsx";
import ColetivaForm from "./pages/ColetivaForm.tsx";
import ColetivaPublic from "./pages/ColetivaPublic.tsx";
import Coletivas from "./pages/Coletivas.tsx";
import LojaForm from "./pages/LojaForm.tsx";
import Admin from "./pages/Admin.tsx";
import Assinatura from "./pages/Assinatura.tsx";
import TermosDeUso from "./pages/TermosDeUso.tsx";
import PoliticaDePrivacidade from "./pages/PoliticaDePrivacidade.tsx";
import Notificacoes from "./pages/Notificacoes.tsx";
import Inteligencia from "./pages/Inteligencia.tsx";
import { ScrollToHash } from "./components/ScrollToHash";
import { BackToTopButton } from "./components/site/BackToTopButton";
import { InstallAppBanner } from "./components/site/InstallAppBanner";
import { ReviewPromptDialog } from "./components/site/ReviewPromptDialog";
import CityOffers from "./pages/CityOffers.tsx";
import StorePage from "./pages/StorePage.tsx";

const OfertasRedirect = () => {
  const { search } = useLocation();
  return <Navigate to={`/${search}#ofertas`} replace />;
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
            <Route path="/anuncie" element={<Anuncie />} />
            <Route path="/auth" element={<Auth />} />
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

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { CityProvider } from "@/hooks/useCity";
import { CitySelector } from "@/components/site/CitySelector";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Ofertas from "./pages/Ofertas.tsx";
import OfferDetail from "./pages/OfferDetail.tsx";
import Anuncie from "./pages/Anuncie.tsx";
import Auth from "./pages/Auth.tsx";
import PainelLojista from "./pages/PainelLojista.tsx";
import OfertaForm from "./pages/OfertaForm.tsx";
import LojaForm from "./pages/LojaForm.tsx";
import Admin from "./pages/Admin.tsx";
import Assinatura from "./pages/Assinatura.tsx";
import TermosDeUso from "./pages/TermosDeUso.tsx";
import PoliticaDePrivacidade from "./pages/PoliticaDePrivacidade.tsx";
import { ScrollToHash } from "./components/ScrollToHash";

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
            <Route path="/ofertas" element={<Ofertas />} />
            <Route path="/termos-de-uso" element={<TermosDeUso />} />
            <Route path="/politica-de-privacidade" element={<PoliticaDePrivacidade />} />
            <Route path="/oferta/:id" element={<OfferDetail />} />
            <Route path="/anuncie" element={<Anuncie />} />
            <Route path="/auth" element={<Auth />} />
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
              path="/painel-lojista/assinatura"
              element={
                <ProtectedRoute requireRole="lojista">
                  <Assinatura />
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
          </CityProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

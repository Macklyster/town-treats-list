import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { SEO } from "@/components/seo/SEO";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <SEO title="Página não encontrada — OfertasFly" description="A página que você procura não existe ou foi movida." path={location.pathname} />
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold">404</h1>
        <p className="mb-2 text-xl text-muted-foreground">Página não encontrada</p>
        <p className="mb-6 text-sm text-muted-foreground">A página que você procura não existe ou foi movida.</p>
        <a href="/" className="text-accent-strong underline hover:text-accent">
          Voltar para a home
        </a>
      </div>
    </div>
  );
};

export default NotFound;

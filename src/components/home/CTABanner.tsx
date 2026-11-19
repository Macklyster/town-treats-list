import { Link } from "@/lib/router-compat";
import { Store } from "lucide-react";
import companyIconAsset from "@/assets/logo-icone-cadastrar.png.asset.json";

export const CTABanner = () => (
  <section className="container py-8 md:py-12">
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary-deep px-6 py-6 md:px-10 md:py-8">
      <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" aria-hidden />
      <div className="relative flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
        <div className="flex items-center gap-4 flex-1">
          <div className="h-16 w-16 shrink-0 grid place-items-center md:h-20 md:w-20">
            <img src={companyIconAsset.url} alt="" className="h-full w-full object-contain" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg md:text-xl font-semibold text-primary-foreground leading-tight">
              Seu negócio merece ser encontrado.
            </h3>
            <p className="text-xs md:text-sm text-primary-foreground/85 mt-1">
              Faça parte da plataforma que mais conecta empresas e pessoas na sua cidade.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <Link
            to="/anuncie"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-highlight px-5 py-2.5 text-sm font-semibold hover:bg-primary-light transition"
          >
            <Store className="h-4 w-4" />
            Cadastrar empresa
          </Link>
        </div>
      </div>
    </div>
  </section>
);

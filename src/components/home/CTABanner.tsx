import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Download } from "lucide-react";

export const CTABanner = () => (
  <section className="container py-16 md:py-24">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-3xl md:rounded-[40px] p-8 md:p-16 aurora-glass-strong aurora-glow"
    >
      <div className="absolute inset-0 aurora-shine opacity-25" />
      <div className="absolute -top-32 -left-24 h-[400px] w-[400px] rounded-full bg-[hsl(var(--aurora-indigo))] opacity-40 blur-3xl" />
      <div className="absolute -bottom-32 -right-24 h-[400px] w-[400px] rounded-full bg-[hsl(var(--aurora-cyan))] opacity-40 blur-3xl" />

      <div className="relative grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-center">
        <div>
          <span className="aurora-chip mb-4">Para lojistas</span>
          <h2 className="text-4xl md:text-5xl font-semibold leading-[1.05]">
            Sua empresa merece <br />
            ser <span className="aurora-gradient-text">descoberta</span>.
          </h2>
          <p className="mt-4 max-w-lg text-[hsl(var(--aurora-muted))] text-base md:text-lg">
            Publique ofertas, apareça em recomendações personalizadas e ganhe FlyScore com cada nova avaliação.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/anuncie"
              className="group inline-flex items-center gap-2 rounded-full bg-white text-[hsl(var(--aurora-bg))] px-6 py-3 text-sm font-semibold hover:bg-white/90 transition"
            >
              Cadastrar empresa
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#instalar"
              className="inline-flex items-center gap-2 rounded-full aurora-glass px-6 py-3 text-sm font-semibold hover:bg-white/10 transition"
            >
              <Download className="h-4 w-4" /> Baixar aplicativo
            </a>
          </div>
        </div>
        <div className="hidden md:flex justify-end">
          <div className="relative h-60 w-60 rounded-full aurora-gradient-bg grid place-items-center aurora-glow">
            <div className="absolute inset-4 rounded-full aurora-glass-strong grid place-items-center">
              <div className="text-center">
                <div className="text-5xl font-bold aurora-gradient-text">+40%</div>
                <div className="text-xs uppercase tracking-wider mt-2 text-[hsl(var(--aurora-muted))]">
                  descobertas
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  </section>
);

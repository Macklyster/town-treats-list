import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/helpfy-logo.jpeg";

const navItems = [
  { to: "/", label: "Início" },
  { to: "/ofertas", label: "Ofertas" },
  { to: "/#categorias", label: "Categorias" },
  { to: "/#como-funciona", label: "Como Funciona" },
];

export const Header = () => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2" aria-label="Helpfy — página inicial">
          <img src={logo} alt="Helpfy" className="h-9 w-auto rounded-md" />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors hover:text-accent-strong ${
                  isActive && item.to === pathname ? "text-accent-strong" : "text-primary"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:block">
          <Button asChild variant="accent" size="sm">
            <Link to="/anuncie">Anuncie Conosco</Link>
          </Button>
        </div>

        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-md md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="container flex flex-col gap-3 py-4">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="py-1 text-sm font-medium text-primary"
              >
                {item.label}
              </Link>
            ))}
            <Button asChild variant="accent" className="mt-2">
              <Link to="/anuncie" onClick={() => setOpen(false)}>
                Anuncie Conosco
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

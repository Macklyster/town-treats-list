import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Menu, User as UserIcon, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logo from "@/assets/helpfy-logo.png";
import { CityBar } from "@/components/site/CityBar";

const navItems = [
  { to: "/", label: "Início" },
  { to: "/ofertas", label: "Ofertas" },
  { to: "/#categorias", label: "Categorias" },
  { to: "/#como-funciona", label: "Como Funciona" },
];

export const Header = () => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { user, isAdmin, isLojista, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur">
      <CityBar />
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2" aria-label="Helpfy — página inicial">
          <img src={logo} alt="Helpfy" className="h-14 w-auto rounded-md md:h-16" />
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

        <div className="hidden items-center gap-3 md:flex">
          {!user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">Entrar</Link>
              </Button>
              <Button asChild variant="accent" size="sm">
                <Link to="/anuncie">Anuncie Conosco</Link>
              </Button>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <UserIcon className="h-4 w-4" /> Minha conta
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover">
                <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isLojista && (
                  <DropdownMenuItem onClick={() => navigate("/painel-lojista")}>
                    Painel do Lojista
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate("/admin")}>
                    Painel Admin
                  </DropdownMenuItem>
                )}
                {!isLojista && (
                  <DropdownMenuItem onClick={() => navigate("/anuncie")}>
                    Tornar-se lojista
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => { await signOut(); navigate("/"); }}>
                  <LogOut className="mr-2 h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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

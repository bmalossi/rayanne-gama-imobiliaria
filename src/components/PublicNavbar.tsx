import { Menu, Home, Building2, UserCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { BrandLogo } from "@/components/BrandLogo";


export function PublicNavbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="group flex items-center">
          <BrandLogo variant="black" className="hidden md:flex" />
          <BrandLogo variant="mark" className="flex md:hidden" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <NavLink to="/imoveis" className="text-sm text-foreground/80 transition-colors hover:text-primary" activeClassName="text-primary">
            Imóveis
          </NavLink>
          <NavLink to="/login" className="text-sm text-foreground/80 transition-colors hover:text-primary" activeClassName="text-primary">
            Área do Corretor
          </NavLink>
        </nav>

        <div className="hidden md:block">
          <Button asChild variant="outline" className="border-primary/40 bg-transparent text-primary hover:bg-primary hover:text-primary-foreground">
            <Link to="/imoveis">Ver Imóveis</Link>
          </Button>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="border-border bg-background/95">
            <div className="mt-10 flex flex-col gap-4">
              <SheetClose asChild>
                <Link to="/" className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-sm uppercase tracking-[0.15em] text-foreground transition-all active:scale-[0.98]">
                  <Home className="h-4 w-4 text-primary" />
                  Página Inicial
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link to="/imoveis" className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-sm uppercase tracking-[0.15em] text-foreground transition-all active:scale-[0.98]">
                  <Building2 className="h-4 w-4 text-primary" />
                  Imóveis
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link to="/login" className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-sm uppercase tracking-[0.15em] text-foreground transition-all active:scale-[0.98]">
                  <UserCircle className="h-4 w-4 text-primary" />
                  Área do Corretor
                </Link>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}


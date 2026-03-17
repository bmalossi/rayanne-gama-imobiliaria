import { Link } from "react-router-dom";
import { Instagram, MapPin, Phone, MessageSquare, Facebook } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";


export function PublicFooter() {
  const whatsappLink = "https://wa.me/5513997685529?text=Ol%C3%A1%2C%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es.";

  return (
    <footer className="border-t border-border bg-card/60 pt-16 pb-8">
      <div className="container grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        <div className="col-span-1 lg:col-span-2 space-y-4">
          <Link to="/" className="inline-block">
            <BrandLogo variant="black" className="w-40 md:w-56" />
          </Link>
          <p className="max-w-xs text-sm text-muted-foreground leading-relaxed">
            Imobiliária especializada em Praia Grande e Baixada Santista. Com mais de 15 anos de experiência, oferecemos atendimento premium para investidores e famílias que buscam alto padrão.
          </p>
          <div className="flex items-center gap-4 pt-2">
            <a href="https://www.instagram.com/uno_consultoria_financeira/" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary transition-all">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="https://www.facebook.com/rayannegamaimoveis" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary transition-all">
              <Facebook className="h-5 w-5" />
            </a>
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary transition-all">
              <MessageSquare className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-widest text-primary">Navegação</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/imoveis" className="hover:text-foreground transition-colors">Catálogo de Imóveis</Link></li>
            <li><Link to="/login" className="hover:text-foreground transition-colors">Área do Corretor</Link></li>
            <li><Link to="/" className="hover:text-foreground transition-colors">Home</Link></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-widest text-primary">Contato</h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary shrink-0" />
              <span>Rua Dr José Carlos de Oliveira, 274 - Boqueirão, Praia Grande/SP <br /> Baixada Santista</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-primary shrink-0" />
              <span>(13) 99768-5529</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="container mt-16 pt-8 border-t border-border/40 text-xs text-muted-foreground flex flex-col gap-4 md:flex-row md:items-center md:justify-between uppercase tracking-[0.1em]">
        <p>© {new Date().getFullYear()} Rayanne Gama Imóveis · CRECI 250876-F</p>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-foreground transition-colors">Políticas de Privacidade</a>
          <a href="#" className="hover:text-foreground transition-colors">Termos de Uso</a>
        </div>
      </div>
    </footer>
  );
}


import { BedDouble, Bath, CarFront, Ruler, ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { generatePropertyUrl } from "@/shared/utils/url";
import { Badge } from "./ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Property } from "@/types/domain";

export function PropertyCard({ property }: { property: Property }) {
  const reference = property.id.slice(0, 8).toUpperCase();

  return (
    <Link
      to={generatePropertyUrl(property)}
      className="group luxury-surface flex flex-col overflow-hidden rounded-2xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl"
    >
      <article className="luxury-surface group h-full overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/50">
        <div className="relative h-64 overflow-hidden border-b border-border bg-muted">
          <img
            src={property.images?.[0] || "/placeholder.svg"}
            alt={`Imagem do imóvel ${property.title}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-2">
            <span className="rounded-full border border-border bg-background/90 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-primary">
              {property.type}
            </span>
            <span className="rounded-full border border-border bg-background/90 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              REF {reference}
            </span>
          </div>
        </div>

        <div className="space-y-4 p-4 md:space-y-5 md:p-6">

          <div>
            <p className="gold-label mb-2">{property.neighborhood}, {property.city}</p>
            <h3 className="text-2xl leading-tight text-foreground">{property.title}</h3>
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2"><BedDouble className="h-4 w-4 text-primary" /> {property.bedrooms}</p>
            <p className="flex items-center gap-2"><Bath className="h-4 w-4 text-primary" /> {property.bathrooms}</p>
            <p className="flex items-center gap-2"><CarFront className="h-4 w-4 text-primary" /> {property.parking}</p>
            <p className="flex items-center gap-2"><Ruler className="h-4 w-4 text-primary" /> {property.area}m²</p>
          </div>


          <div className="flex items-end justify-between border-t border-border pt-4">
            <div>
              <p className="gold-label">Valor</p>
              <p className="text-xl md:text-2xl text-primary font-medium">R$ {property.price.toLocaleString("pt-BR")}</p>
            </div>

            <span className={cn(buttonVariants({ size: "sm" }), "uppercase tracking-[0.16em]")}>
              Ver mais <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}



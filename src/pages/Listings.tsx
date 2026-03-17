import { FormEvent, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { PropertyCard } from "@/components/PropertyCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SEOHead } from "@/shared/components/SEOHead";
import { useProperties } from "@/modules/properties/hooks/useProperties";

const Listings = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [city, setCity] = useState(() => searchParams.get("cidade") ?? "");
  const [bedrooms, setBedrooms] = useState(() => searchParams.get("dormitorios") ?? "");
  const [transaction, setTransaction] = useState(() => searchParams.get("transacao") ?? "");
  const [propertyType, setPropertyType] = useState(() => searchParams.get("tipo") ?? "");
  const [search, setSearch] = useState(() => searchParams.get("busca") ?? "");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { data: properties = [], isLoading } = useProperties({
    city: city.trim() || undefined,
    bedrooms: bedrooms ? Number(bedrooms) : undefined,
    transaction: transaction || undefined,
    type: propertyType || undefined,
    search: search.trim() || undefined,
  });

  const total = useMemo(() => properties.length, [properties]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params = new URLSearchParams();
    if (city.trim()) params.set("cidade", city.trim());
    if (bedrooms.trim()) params.set("dormitorios", bedrooms.trim());
    if (transaction) params.set("transacao", transaction);
    if (propertyType) params.set("tipo", propertyType);
    if (search.trim()) params.set("busca", search.trim());

    navigate(params.toString() ? `/imoveis?${params.toString()}` : "/imoveis", { replace: true });
  };

  const clearFilters = () => {
    setCity("");
    setBedrooms("");
    setTransaction("");
    setPropertyType("");
    setSearch("");
    navigate("/imoveis", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Imóveis"
        description="Filtre e encontre os melhores imóveis de alto padrão. Apartamentos, casas e coberturas de luxo disponíveis."
        type="website"
      />
      <PublicNavbar />

      <main className="container py-14">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="gold-label">Catálogo</p>
            <h1 className="mt-2 text-2xl md:text-5xl">Imóveis de alto padrão</h1>
            <p className="mt-3 text-sm text-muted-foreground">{total} resultados encontrados</p>

          </div>
        </div>

        <section className="mb-8 rounded-2xl border border-border bg-card/60 p-4 md:p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 xl:grid-cols-[220px_1fr_auto] xl:items-center">
              <button
                type="button"
                onClick={() => setShowAdvanced((prev) => !prev)}
                className="inline-flex h-12 items-center gap-3 rounded-lg border border-border px-4 text-left text-foreground transition-colors hover:border-primary/50"
              >
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                <span>
                  <span className="block text-xs uppercase tracking-[0.16em] text-muted-foreground">Filtros rápidos</span>
                  <span className="text-sm font-medium">Refine a sua busca</span>
                </span>
              </button>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">

                <Input
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  className="h-12 border-border bg-background"
                  placeholder="Localização"
                />
                <Select value={propertyType || "all-type"} onValueChange={(value) => setPropertyType(value === "all-type" ? "" : value)}>
                  <SelectTrigger className="h-12 rounded-md border border-input bg-background px-3 text-sm text-foreground">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border bg-popover p-1">
                    <SelectItem value="all-type" className="rounded-xl">Tipo</SelectItem>
                    <SelectItem value="Apartamento" className="rounded-xl">Apartamento</SelectItem>
                    <SelectItem value="Casa" className="rounded-xl">Casa</SelectItem>
                    <SelectItem value="Cobertura" className="rounded-xl">Cobertura</SelectItem>
                    <SelectItem value="Terreno" className="rounded-xl">Terreno</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={transaction || "all-transaction"} onValueChange={(value) => setTransaction(value === "all-transaction" ? "" : value)}>
                  <SelectTrigger className="h-12 rounded-md border border-input bg-background px-3 text-sm text-foreground">
                    <SelectValue placeholder="Negócio" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border bg-popover p-1">
                    <SelectItem value="all-transaction" className="rounded-xl">Negócio</SelectItem>
                    <SelectItem value="venda" className="rounded-xl">Comprar</SelectItem>
                    <SelectItem value="aluguel" className="rounded-xl">Alugar</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={1}
                  value={bedrooms}
                  onChange={(event) => setBedrooms(event.target.value)}
                  className="h-12 border-border bg-background"
                  placeholder="Características (dormitórios)"
                />
              </div>

              <Button type="submit" className="h-12 px-7 text-base">
                Buscar
              </Button>
            </div>

            {showAdvanced && (
              <div className="grid gap-3 rounded-xl border border-border bg-secondary/30 p-4 md:grid-cols-[1fr_auto]">
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="h-11 border-border bg-background"
                  placeholder="Buscar por título, cidade ou bairro"
                />
                <Button type="button" variant="outline" onClick={clearFilters} className="h-11 uppercase tracking-[0.14em]">
                  Limpar filtros
                </Button>
              </div>
            )}
          </form>
        </section>

        {isLoading ? (
          <p className="gold-label">Carregando imóveis...</p>
        ) : properties.length === 0 ? (
          <div className="luxury-surface rounded-xl p-10 text-center">
            <p className="gold-label">Sem resultados</p>
            <p className="mt-2 text-muted-foreground">Ajuste os filtros ou publique novos imóveis no painel.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
};

export default Listings;




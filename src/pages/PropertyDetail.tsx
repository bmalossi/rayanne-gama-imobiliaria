import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { LeadForm } from "@/components/LeadForm";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useProperty } from "@/modules/properties/hooks/useProperties";
import { SEOHead } from "@/shared/components/SEOHead";
import { SITE_CONFIG } from "@/shared/config/site";
import { extractIdFromSlug } from "@/shared/utils/url";

type ParsedDescription = {
  summary: string;
  details: Array<{ label: string; value: string }>;
  detailsMap: Record<string, string>;
};

function parseDetailedDescription(description: string | null): ParsedDescription {
  if (!description) return { summary: "", details: [], detailsMap: {} };

  const [summaryPart, detailsPart] = description.split("--- Informações detalhadas ---");
  const summary = (summaryPart ?? "").trim();

  const details = (detailsPart ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...rest] = line.split(":");
      const value = rest.join(":").trim();
      return { label: label?.trim() ?? "", value: value || "Não informado" };
    })
    .filter((item) => {
      if (!item.label) return false;

      const excludedLabels = ["Exibição pública do endereço", "Dono(s) e chaves", "Captador", "Captação", "Captado por", "Captadores", "Captador(es)"];
      if (excludedLabels.includes(item.label)) return false;

      const emptyValues = ["Não informado", "", "0", "0,00", "0.00", "R$ 0", "R$ 0,00", "R$ 0.00"];
      if (emptyValues.includes(item.value)) return false;

      return true;
    });

  const detailsMap = details.reduce<Record<string, string>>((acc, item) => {
    acc[item.label] = item.value;
    return acc;
  }, {});

  const visibilityLine = (detailsPart ?? "")
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.startsWith("Exibição pública do endereço:"));

  if (visibilityLine) {
    detailsMap["Exibição pública do endereço"] = visibilityLine.split(":").slice(1).join(":").trim();
  }

  return { summary, details, detailsMap };
}

function formatPublicLocation(
  property: {
    street: string | null;
    number: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
    cep: string | null;
  },
  visibilityLabel?: string,
) {
  if (visibilityLabel === "Somente cidade") {
    return property.city ? property.city : "Cidade não informada";
  }

  if (visibilityLabel === "Somente bairro e cidade") {
    const parts = [property.neighborhood, property.city].filter(Boolean);
    return parts.length ? parts.join(" • ") : "Bairro e cidade não informados";
  }

  return [
    property.street || "Endereço não informado",
    property.number ? `, ${property.number}` : "",
    property.neighborhood ? ` • ${property.neighborhood}` : "",
    property.city ? ` • ${property.city}` : "",
    property.state ? ` - ${property.state}` : "",
    property.cep ? ` • CEP ${property.cep}` : "",
  ].join("");
}

const PropertyDetail = () => {
  const { id: rawId, slug } = useParams();
  const id = rawId || extractIdFromSlug(slug);
  const { data: property, isLoading } = useProperty(id);

  const images = useMemo(() => (property?.images?.length ? property.images : ["/placeholder.svg"]), [property?.images]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const selectedImage = images[Math.min(selectedImageIndex, images.length - 1)] ?? "/placeholder.svg";
  const parsedDescription = parseDetailedDescription(property?.description ?? null);
  const publicLocation = property
    ? formatPublicLocation(property, parsedDescription.detailsMap["Exibição pública do endereço"])
    : "Endereço não informado";

  const whatsappLink = property
    ? SITE_CONFIG.contact.whatsapp.getLink(`Olá, vi o imóvel *${property.title}* (Ref: ${property.id}) no site e gostaria de mais informações.`)
    : "";

  const propertySchema = property ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": property.title,
    "image": property.images,
    "description": parsedDescription.summary,
    "offers": {
      "@type": "Offer",
      "priceCurrency": "BRL",
      "price": property.price,
      "url": window.location.href,
      "seller": {
        "@type": "RealEstateAgent",
        "name": "Rayanne Gama"
      }
    },
    "additionalProperty": [
      {
        "@type": "PropertyValue",
        "name": "Bedrooms",
        "value": property.bedrooms
      },
      {
        "@type": "PropertyValue",
        "name": "Bathrooms",
        "value": property.bathrooms
      },
      {
        "@type": "PropertyValue",
        "name": "Floor Area",
        "value": `${property.area} sqm`
      }
    ]
  } : null;

  const breadcrumbSchema = property ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Início",
        "item": SITE_CONFIG.url
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Imóveis",
        "item": `${SITE_CONFIG.url}/imoveis`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": property.city || "Região",
        "item": `${SITE_CONFIG.url}/imoveis/${property.city ? property.city.toLowerCase() : ""}`
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": property.title,
        "item": window.location.href
      }
    ]
  } : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {property && (
        <SEOHead
          title={`${property.type} em ${property.neighborhood}, ${property.city} | Alto Padrão`}
          description={`Descubra detalhes deste ${property.type.toLowerCase()} à ${property.transaction.toLowerCase()} no bairro ${property.neighborhood}. Consulte valores e agende sua visita.`}
          image={property.images?.[0]}
          type="product"
          schema={[propertySchema, breadcrumbSchema]}
        />
      )}
      <PublicNavbar />

      <main className="container py-12">
        {isLoading ? (
          <p className="gold-label">Carregando imóvel...</p>
        ) : !property ? (
          <div className="luxury-surface rounded-xl p-10 text-center">
            <p className="gold-label">Imóvel não encontrado</p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
            <article className="space-y-8">
              <section className="space-y-4">
                <div className="relative">
                  <img src={selectedImage} alt={`Foto do imóvel ${property.title}`} className="h-[280px] sm:h-[440px] w-full rounded-xl border border-border object-cover" loading="lazy" />


                  {images.length > 1 && (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="absolute left-3 top-1/2 -translate-y-1/2"
                        onClick={() => setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                        aria-label="Imagem anterior"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        onClick={() => setSelectedImageIndex((prev) => (prev + 1) % images.length)}
                        aria-label="Próxima imagem"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </>
                  )}
                </div>

                {images.length > 1 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {images.map((image, index) => (
                      <button
                        key={`${image}-${index}`}
                        type="button"
                        onClick={() => setSelectedImageIndex(index)}
                        className={`overflow-hidden rounded-lg border transition ${selectedImageIndex === index ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-primary/60"}`}
                        aria-label={`Ver foto ${index + 1} do imóvel`}
                      >
                        <img src={image} alt={`Miniatura ${index + 1} do imóvel ${property.title}`} className="h-24 w-full object-cover" loading="lazy" />
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <p className="gold-label">{property.neighborhood}, {property.city}</p>
                <h1 className="mt-2 text-2xl md:text-5xl font-semibold leading-tight">{property.title} à {property.transaction} no {property.neighborhood}</h1>
                <p className="mt-4 text-lg text-primary font-medium">R$ {property.price.toLocaleString("pt-BR")}</p>
              </section>

              <section className="luxury-surface rounded-xl p-6">
                <h2 className="gold-label">O que este imóvel oferece?</h2>
                <dl className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="flex flex-col gap-1"><dt className="text-xs text-muted-foreground">Tipo</dt><dd className="text-sm font-medium">{property.type}</dd></div>
                  <div className="flex flex-col gap-1"><dt className="text-xs text-muted-foreground">Transação</dt><dd className="text-sm font-medium">{property.transaction}</dd></div>
                  <div className="flex flex-col gap-1"><dt className="text-xs text-muted-foreground">Quartos</dt><dd className="text-sm font-medium">{property.bedrooms}</dd></div>
                  <div className="flex flex-col gap-1"><dt className="text-xs text-muted-foreground">Banheiros</dt><dd className="text-sm font-medium">{property.bathrooms}</dd></div>
                  <div className="flex flex-col gap-1"><dt className="text-xs text-muted-foreground">Vagas</dt><dd className="text-sm font-medium">{property.parking}</dd></div>
                  <div className="flex flex-col gap-1"><dt className="text-xs text-muted-foreground">Área útil</dt><dd className="text-sm font-medium">{property.area ? `${property.area} m²` : "Não informado"}</dd></div>
                </dl>
              </section>


              <section className="luxury-surface rounded-xl p-6">
                <h2 className="gold-label">Onde fica este {property.type}?</h2>
                <p className="mt-3 text-muted-foreground">{publicLocation}</p>
              </section>

              {(parsedDescription.summary || parsedDescription.details.length > 0) && (
                <section className="luxury-surface rounded-xl p-6">
                  <p className="gold-label">Descrição e informações completas</p>
                  {parsedDescription.summary && <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">{parsedDescription.summary}</p>}

                  {parsedDescription.details.length > 0 && (
                    <>
                      <Separator className="my-5" />
                      <dl className="grid gap-3 sm:grid-cols-2">
                        {parsedDescription.details.map((item) => (
                          <div key={item.label} className="flex gap-2 text-sm text-muted-foreground" itemScope itemType="https://schema.org/PropertyValue">
                            <dt className="text-foreground font-medium" itemProp="name">{item.label}:</dt>
                            <dd itemProp="value">{item.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </>
                  )}
                </section>
              )}

              {property.features?.length > 0 && (
                <section className="luxury-surface rounded-xl p-6">
                  <p className="gold-label">Características</p>
                  <ul className="mt-4 flex flex-wrap gap-2" aria-label="Comodidades e Características">
                    {property.features.map((feature) => (
                      <li key={feature} className="rounded-full border border-border bg-secondary px-3 py-1 text-xs text-secondary-foreground">
                        {feature}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </article>

            <aside>
              <LeadForm propertyId={property.id} agentId={property.agent_id} />

              <Button asChild className="w-full gap-2 text-lg uppercase tracking-wide" size="lg">
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  FALAR NO WHATSAPP
                </a>
              </Button>
            </aside>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
};

export default PropertyDetail;

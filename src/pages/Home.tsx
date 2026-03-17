import { FormEvent, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { BadgeDollarSign, FileText, Landmark, MapPinHouse, SlidersHorizontal } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PropertyCard } from "@/components/PropertyCard";
import { SEOHead } from "@/shared/components/SEOHead";
import { SITE_CONFIG } from "@/shared/config/site";
import { useFeaturedProperties } from "@/modules/properties/hooks/useProperties";
import itauLogo from "@/assets/itau-logo.svg";
import caixaLogo from "@/assets/caixa-logo.svg";




const WHATSAPP_LINK = SITE_CONFIG.contact.whatsapp.getLink();


const quickFilters = ["Praia Grande", "São Vicente", "Santos", "Interior"];

const serviceItems = [
  {
    title: "Simulador de crédito",
    description: "Faça uma simulação de crédito para comprar seu novo imóvel com mais segurança.",
    action: "Simular financiamento",
    icon: BadgeDollarSign,
  },
  {
    title: "Anuncie seu imóvel",
    description: "Nossa estrutura de divulgação acelera negociações para venda ou locação.",
    action: "Anunciar imóvel agora",
    icon: FileText,
  },
  {
    title: "Consultoria financeira",
    description: "Apoio para financiamento imobiliário e estruturação de crédito personalizada.",
    action: "Quero consultoria",
    icon: Landmark,
  },
  {
    title: "Avaliação de imóveis",
    description: "Laudos técnicos de avaliação com critérios profissionais e mercadológicos.",
    action: "Quero avaliar meu imóvel",
    icon: MapPinHouse,
  },
];

const filterControlClass =
  "h-12 rounded-full border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors focus-visible:border-primary/60";

const Home = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [parking, setParking] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [areaMin, setAreaMin] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [transaction, setTransaction] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Garantir que o vídeo apareça mesmo se o evento onLoad do iframe for retardado ou falhar
  useEffect(() => {
    if (!isMobile) {
      const timer = setTimeout(() => setVideoReady(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [isMobile]);

  const { data: featured = [] } = useFeaturedProperties();

  const handleSearch = (cityValue = query, bedroomsValue = bedrooms) => {
    const params = new URLSearchParams();
    const term = cityValue.trim();
    const beds = bedroomsValue.trim();

    if (term) params.set("cidade", term);
    if (beds) params.set("dormitorios", beds);
    if (bathrooms.trim()) params.set("banheiros", bathrooms.trim());
    if (parking.trim()) params.set("vagas", parking.trim());
    if (priceMin.trim()) params.set("precoMin", priceMin.trim());
    if (priceMax.trim()) params.set("precoMax", priceMax.trim());
    if (areaMin.trim()) params.set("areaMin", areaMin.trim());
    if (propertyType) params.set("tipo", propertyType);
    if (transaction) params.set("transacao", transaction);

    navigate(params.toString() ? `/imoveis?${params.toString()}` : "/imoveis");
  };

  const onSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSearch();
  };

  const businessSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": "Rayanne Gama Imóveis",
    "image": "https://rayannegama.com.br/logo.png", // Atualizar logo real dps
    "@id": "https://rayannegama.com.br",
    "url": "https://rayannegama.com.br",
    "telephone": SITE_CONFIG.contact.whatsapp.number.replace(/\D/g, ''),
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Praia Grande",
      "addressLocality": "Praia Grande",
      "addressRegion": "SP",
      "addressCountry": "BR"
    },
    "priceRange": "$$$$"
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Quais são os melhores bairros para comprar imóveis em Praia Grande?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Bairros como Boqueirão, Canto do Forte e Guilhermina concentram os melhores imóveis de alto padrão em Praia Grande, com frente para o mar e valorização constante."
        }
      },
      {
        "@type": "Question",
        "name": "Como simular o financiamento de casas e apartamentos em Praia Grande?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Nossa plataforma possui atalhos para os integradores de financiamento imobiliário do Itaú e Caixa Econômica. Nossa equipe de Praia Grande cuida de todo o processo burocrático e aprovamos seu crédito."
        }
      },
      {
        "@type": "Question",
        "name": "Por que investir no mercado imobiliário da Baixada Santista?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Com a revitalização costeira e proximidade a SP, o mercado imobiliário da Baixada Santista tem se destacado pelas altas taxas de retorno comparado ao capital investido."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Imobiliária Praia Grande | Casas e Apartamentos Alto Padrão"
        description="Encontre as melhores opções em nossa imobiliária Praia Grande. Especialistas em casas no Boqueirão, cobertura de luxo e apartamentos com 15+ anos de mercado."
        schema={[businessSchema, faqSchema]}
      />
      <PublicNavbar />

      <section className="relative flex min-h-[700px] flex-col md:min-h-[90vh]">
        {/* Background Layer: Clips the scaled video and holds effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Poster — visível até o vídeo carregar */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: "url('/hero-poster.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: videoReady ? 0 : 1,
              transition: 'opacity 0.8s ease-in-out',
              zIndex: 2
            }}
          />

          {/* Vídeo YouTube */}
          {!isMobile && (
            <iframe
              src="https://www.youtube.com/embed/cdoGQODy_h4?autoplay=1&mute=1&loop=1&playlist=cdoGQODy_h4&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&disablekb=1&fs=0&enablejsapi=1&vq=hd1080&iv_load_policy=3"
              allow="autoplay; fullscreen"
              onLoad={() => setTimeout(() => setVideoReady(true), 1500)}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) scale(1.3)',
                width: '100vw',
                height: '56.25vw',
                minHeight: '100vh',
                minWidth: '177.77vh',
                border: 'none',
                pointerEvents: 'none',
                zIndex: 1
              }}
            />
          )}

          {/* Camada bloqueadora invisível */}
          <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 3,
            pointerEvents: 'all',
            background: 'transparent'
          }} />

          {/* Sophisticated multi-layer overlay for maximum text contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent z-[4]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-[4]" />
          <div className="grain-overlay opacity-[0.04] z-[4]" />
        </div>






        <div className="container relative z-10 flex flex-1 flex-col justify-center gap-8 pb-56 pt-24 md:pb-32 md:pt-32">

          <div className="inline-flex w-fit items-center rounded-sm bg-black/50 px-3 py-1.5 backdrop-blur-sm border border-white/10">
            <p className="gold-label text-white font-extrabold uppercase tracking-widest text-xs md:text-sm">Imobiliária em Praia Grande</p>
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-4xl text-3xl md:text-5xl lg:text-7xl leading-[1.1] text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.3)]"
          >
            Casas e Apartamentos no Litoral Paulista.
          </motion.h1>

          <p className="max-w-2xl text-base text-white/90 md:text-lg [text-shadow:0_1px_4px_rgba(0,0,0,0.2)]" itemProp="description">
            Especialistas com <strong>15+ anos de mercado imobiliário em SP</strong>. Encontre o seu imóvel ideal no Boqueirão, Canto do Forte e orla marítima para exclusividade e valorização real.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="w-full sm:w-auto h-12 uppercase tracking-[0.2em]">
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">Falar com Corretor SP</a>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto h-12 border-primary/50 bg-transparent text-primary hover:bg-primary hover:text-primary-foreground uppercase tracking-[0.2em]">
              <Link to="/imoveis">Casas à Venda</Link>
            </Button>
          </div>
        </div>

        {/* Floating Search Bar centered on the dividing line */}
        <div className="absolute bottom-0 left-0 right-0 z-30 translate-y-[40%] md:translate-y-1/2">


          <div className="container px-4">
            <div className="search-panel mx-auto max-w-5xl rounded-3xl p-6 shadow-2xl backdrop-blur-md">

              <form onSubmit={onSearchSubmit} className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="gold-label">Filtros rápidos</p>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowAdvanced((prev) => !prev)}
                    className="h-9 px-3 text-xs uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
                  >
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    {showAdvanced ? "Ver menos" : "Refinar busca"}
                  </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.2fr_0.9fr_0.9fr_0.9fr_auto]">
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Localização"
                    className={filterControlClass}
                  />
                  <Select value={propertyType || "all-type"} onValueChange={(value) => setPropertyType(value === "all-type" ? "" : value)}>
                    <SelectTrigger className={filterControlClass}>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent className="rounded-3xl border-border bg-popover p-1">
                      <SelectItem value="all-type" className="rounded-2xl">Tipo</SelectItem>
                      <SelectItem value="Apartamento" className="rounded-2xl">Apartamento</SelectItem>
                      <SelectItem value="Casa" className="rounded-2xl">Casa</SelectItem>
                      <SelectItem value="Cobertura" className="rounded-2xl">Cobertura</SelectItem>
                      <SelectItem value="Terreno" className="rounded-2xl">Terreno</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={transaction || "all-transaction"} onValueChange={(value) => setTransaction(value === "all-transaction" ? "" : value)}>
                    <SelectTrigger className={filterControlClass}>
                      <SelectValue placeholder="Negócio" />
                    </SelectTrigger>
                    <SelectContent className="rounded-3xl border-border bg-popover p-1">
                      <SelectItem value="all-transaction" className="rounded-2xl">Negócio</SelectItem>
                      <SelectItem value="venda" className="rounded-2xl">Comprar</SelectItem>
                      <SelectItem value="aluguel" className="rounded-2xl">Alugar</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={1}
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    placeholder="Quartos"
                    className={filterControlClass}
                  />
                  <Button type="submit" size="lg" className="h-12 w-full rounded-full bg-primary px-8 text-sm uppercase tracking-[0.2em] md:w-auto">
                    Buscar
                  </Button>
                </div>

                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden pt-4"
                    >
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-2">
                          <label className="ml-3 text-[10px] uppercase tracking-widest text-muted-foreground">Banheiros</label>
                          <Input type="number" min={0} value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} placeholder="Mínimo" className={filterControlClass} />
                        </div>
                        <div className="space-y-2">
                          <label className="ml-3 text-[10px] uppercase tracking-widest text-muted-foreground">Vagas</label>
                          <Input type="number" min={0} value={parking} onChange={(e) => setParking(e.target.value)} placeholder="Mínimo" className={filterControlClass} />
                        </div>
                        <div className="space-y-2">
                          <label className="ml-3 text-[10px] uppercase tracking-widest text-muted-foreground">Área Mín. (m²)</label>
                          <Input type="number" min={0} value={areaMin} onChange={(e) => setAreaMin(e.target.value)} placeholder="Ex: 50" className={filterControlClass} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <label className="ml-3 text-[10px] uppercase tracking-widest text-muted-foreground">Min R$</label>
                            <Input type="number" min={0} value={priceMin} onChange={(e) => setPriceMin(e.target.value)} placeholder="Min" className={filterControlClass} />
                          </div>
                          <div className="space-y-2">
                            <label className="ml-3 text-[10px] uppercase tracking-widest text-muted-foreground">Max R$</label>
                            <Input type="number" min={0} value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="Max" className={filterControlClass} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Spacer to push content below the floating search bar */}
      <div className="h-auto pb-10 pt-48 md:h-36 md:pb-0 md:pt-20">


        <div className="container flex flex-wrap justify-center gap-2 px-4 opacity-70">

          {quickFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => handleSearch(filter, bedrooms)}
              className="rounded-full border border-border bg-card/40 px-4 py-2 text-[10px] uppercase tracking-[0.15em] text-foreground transition-all hover:border-primary/60 hover:text-primary md:text-xs"
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <section className="container pb-20 pt-16 md:pt-20">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="gold-label">Lançamentos em Destaque</p>
            <h2 className="mt-2 max-w-2xl text-2xl md:text-4xl">Seleção de imóveis à venda em Praia Grande</h2>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
              Aproveite ótimas oportunidades para comprar propriedades em bairros requisitados.
            </p>
          </div>
          <Link to="/imoveis" className="inline-flex items-center gap-3 text-sm uppercase tracking-[0.18em] text-primary">
            <span className="editorial-divider" aria-hidden="true" />
            Ver todos
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="luxury-surface rounded-xl p-10 text-center">
            <p className="gold-label">Sem imóveis publicados</p>
            <p className="mt-2 text-muted-foreground">Conecte o Supabase externo e cadastre imóveis para aparecer aqui.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {featured.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </section>

      <section className="container pb-10">
        <div className="cta-panel rounded-2xl border border-border p-8 md:p-12">
          <p className="gold-label">Assessoria exclusiva</p>
          <h2 className="mt-3 text-3xl md:text-4xl">Quer vender ou comprar com estratégia premium?</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Nosso time combina posicionamento, dados de mercado e negociação de alta performance para reduzir tempo de decisão.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="uppercase tracking-[0.17em]">
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">Falar com especialista</a>
            </Button>

            <Button asChild variant="outline" className="uppercase tracking-[0.17em]">
              <Link to="/imoveis">Ver oportunidades</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container pb-16 pt-8">
        <div className="mb-6">
          <p className="gold-label">Financiamento</p>
          <h2 className="mt-2 text-3xl md:text-4xl">Simulação com bancos parceiros</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <article className="luxury-surface rounded-2xl p-6">
            <img src={itauLogo} alt="Logotipo do Banco Itaú" className="h-16 w-auto" loading="lazy" />
            <p className="mt-4 text-sm text-muted-foreground">Condições flexíveis para financiamento imobiliário com acompanhamento consultivo.</p>
            <Button asChild className="mt-5 uppercase tracking-[0.14em]">
              <a href="https://www.itau.com.br/emprestimos-financiamentos/credito-imobiliario/simulador/" target="_blank" rel="noopener noreferrer">Simular no Itaú</a>
            </Button>

          </article>
          <article className="luxury-surface rounded-2xl p-6">
            <img src={caixaLogo} alt="Logotipo da Caixa Econômica Federal" className="h-16 w-auto" loading="lazy" />
            <p className="mt-4 text-sm text-muted-foreground">Linhas de crédito habitacional com análise de perfil e apoio documental.</p>
            <Button asChild className="mt-5 uppercase tracking-[0.14em]">
              <a href="https://www4.caixa.gov.br/simulador/escolha-etapa.asp" target="_blank" rel="noopener noreferrer">Simular na Caixa</a>
            </Button>

          </article>
        </div>
      </section>

      <section className="container pb-16">
        <div className="mb-10 text-center">
          <p className="gold-label">Veja os nossos serviços</p>
          <h2 className="mt-2 text-3xl md:text-4xl">Nossos Serviços</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {serviceItems.map((service) => {
            const Icon = service.icon;
            return (
              <article key={service.title} className="service-card rounded-2xl p-6 text-center">
                <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border border-primary/50 bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-2xl leading-tight">{service.title}</h3>
                <p className="mt-3 min-h-[72px] text-sm text-muted-foreground">{service.description}</p>
                <Button asChild className="mt-5 w-full uppercase tracking-[0.12em]">
                  <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">{service.action}</a>
                </Button>

              </article>
            );
          })}
        </div>
      </section>

      <section className="container pb-20">
        <div className="mb-6">
          <p className="gold-label">Localização</p>
          <h2 className="mt-2 text-3xl md:text-4xl">Encontre nossa imobiliária</h2>
        </div>
        <div className="map-surface overflow-hidden rounded-2xl border border-border">
          <iframe
            title="Mapa da localização da imobiliária"
            src={SITE_CONFIG.contact.location.mapsEmbedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-[380px] w-full md:h-[460px]"
          />
        </div>
      </section>

      {/* FAQ Section for AI GEO Snippets  */}
      <section className="container pb-24">
        <div className="mx-auto max-w-3xl">
          <p className="gold-label text-center">Dúvidas Frequentes</p>
          <h2 className="mt-2 text-center text-3xl md:text-4xl mb-10">Tudo sobre o Mercado Imobiliário na Baixada Santista</h2>

          <dl className="space-y-6">
            <div className="luxury-surface rounded-xl p-6">
              <dt className="text-xl font-medium mb-2">Quais são os melhores bairros para comprar imóveis em Praia Grande?</dt>
              <dd className="text-muted-foreground">Bairros como Boqueirão, Canto do Forte e Guilhermina concentram os melhores imóveis de alto padrão em Praia Grande, com frente para o mar e valorização constante.</dd>
            </div>
            <div className="luxury-surface rounded-xl p-6">
              <dt className="text-xl font-medium mb-2">Como simular o financiamento de casas e apartamentos em Praia Grande?</dt>
              <dd className="text-muted-foreground">Nossa plataforma possui atalhos para os integradores de financiamento imobiliário do Itaú e Caixa Econômica. Nossa equipe de Praia Grande cuida de todo o processo burocrático e aprovamos seu crédito com expertise de 15+ anos.</dd>
            </div>
            <div className="luxury-surface rounded-xl p-6">
              <dt className="text-xl font-medium mb-2">Por que investir no mercado imobiliário da Baixada Santista?</dt>
              <dd className="text-muted-foreground">Com a revitalização costeira e proximidade a São Paulo, o mercado imobiliário na Praia Grande e baixada santista tem se destacado pelas altas taxas de retorno (RoI) comparado ao capital investido inicialmente em fase de lançamento.</dd>
            </div>
          </dl>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default Home;


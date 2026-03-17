import { Helmet } from "react-helmet-async";

export type SEOProp = {
    title?: string;
    description?: string;
    type?: "website" | "article" | "profile" | "product";
    image?: string;
    url?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    schema?: any;
    author?: string;
};

const DEFAULT_TITLE = "Rayanne Gama Imóveis | Alto Padrão e Exclusividade";
const DEFAULT_DESCRIPTION = "Especialista em imóveis de alto padrão na Baixada Santista. Encontre apartamentos de frente para o mar, coberturas luxuosas e casas em condomínios fechados.";
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1200"; // Recomenda-se trocar por um opengraph default
const SITE_URL = "https://rayannegama.com.br"; // Exemplo de URL de prod

export function SEOHead({
    title,
    description,
    type = "website",
    image,
    url,
    schema,
    author = "Rayanne Gama"
}: SEOProp) {
    const seo = {
        title: title ? `${title} | Rayanne Gama Imóveis` : DEFAULT_TITLE,
        description: description || DEFAULT_DESCRIPTION,
        image: image || DEFAULT_IMAGE,
        url: url ? `${SITE_URL}${url}` : SITE_URL,
        type,
        author
    };

    return (
        <Helmet>
            {/* Basic HTML Meta Tags */}
            <title>{seo.title}</title>
            <meta name="description" content={seo.description} />
            <meta name="author" content={seo.author} />

            {/* OpenGraph Tags for Social Media (Facebook, LinkedIn, etc) */}
            <meta property="og:title" content={seo.title} />
            <meta property="og:description" content={seo.description} />
            <meta property="og:image" content={seo.image} />
            <meta property="og:url" content={seo.url} />
            <meta property="og:type" content={seo.type} />
            <meta property="og:site_name" content="Rayanne Gama Imóveis" />

            {/* Twitter Cards */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={seo.title} />
            <meta name="twitter:description" content={seo.description} />
            <meta name="twitter:image" content={seo.image} />

            {/* Structured Data (Schema.org) for Google AI Overviews and Rich Results */}
            {schema && (
                <script type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            )}
        </Helmet>
    );
}

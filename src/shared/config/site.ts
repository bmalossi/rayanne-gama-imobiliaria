export const SITE_CONFIG = {
    name: "Rayanne Imobiliária",
    description: "Imóveis de alto padrão para sua qualidade de vida.",
    url: "https://rayannegamaimoveis.com.br",
    contact: {
        whatsapp: {
            number: "5513997685529",
            defaultMessage: "Olá, quero conversar sobre imóveis",
            getLink: (message?: string) => {
                const msg = message || SITE_CONFIG.contact.whatsapp.defaultMessage;
                return `https://wa.me/${SITE_CONFIG.contact.whatsapp.number}?text=${encodeURIComponent(msg)}`;
            }
        },
        location: {
            address: "R. Dr. José Carlos de Oliveira, 274 - Boqueirão, Praia Grande - SP, 11701-220",
            mapsEmbedUrl: "https://www.google.com/maps?q=R.+Dr.+José+Carlos+de+Oliveira,+274+-+Boqueirão,+Praia+Grande+-+SP,+11701-220&output=embed"
        }
    }
};

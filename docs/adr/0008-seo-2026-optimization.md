# ADR 0008: Estratégia de SEO e GEO Híbrida 2026

## 1. Contexto

A plataforma, construída como uma SPA com Vite e React, não conta com SSR (Server-Side Rendering) nativo como Next.js, por design arquitetural de custos e simplicidade da hospedagem. Com o avanço das buscas via Inteligência Artificial, resumos automáticos (AI Overviews) e dependência pesada de crawlers interpretativos, as SPA tradicionais tendem a ser penalizadas caso sua indexabilidade e representação semântica sejam fracas. Precisamos modernizar a indexabilidade, garantindo que o OpenGraph e o conteúdo das páginas sejam ricos.

## 2. Decisão

Decidimos adotar a integração via `react-helmet-async` em escala de módulos visuais combinada com JSON-LD para entregar de forma estruturada as intersecções de nossos domínios.

- Usaremos o `SEOHead` customizado para mapear as `head` tags fundamentais localizadas no contexto da rota atual.
- Implantação de **Friendly URLs** com extractors (ex: `/imoveis/{bairro}/{title}-{uuid}`) sem perder o UUID de chave principal da base de dados.
- Todo catálogo relacional interno renderizará tags do conceito *Generative Engine Optimization* (GEO) como `<dl>` para pares chaves-valor (propriedades de imóvel), permitindo que agentes façam resumos em formato tabular corretamente.

## 3. Opções Consideradas

1. Mover todo o projeto para Next.js (SSR/SSG).
   - Rejeitado devido ao alto custo de refatoração para um stack sólido e funcional já operacional via ambiente client-side Vite.
2. Injetar metadata estaticamente em pre-render scripts.
   - Limitado, pois os dados alteram via chamadas API no Supabase.

## 4. Consequências

- Todas as URLs de properties agora terão o Slug dinâmico integrado para links gerados no `PropertyCard`. Links antigos ou sem slug (`/imoveis/uuid`) ainda manterão backward-compatibility pois o parse é maleável.
- Os desenvolvedores deverão obrigatoriamente passar por instâncias explícitas de `SEOHead` ao conceber novas páginas abertas.

## 5. Status

**Aceito**

## 6. Referências

- [Schema.org - RealEstateAgent](https://schema.org/RealEstateAgent)
- [Schema.org - Product](https://schema.org/Product)

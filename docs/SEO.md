# Estratégia de SEO e IA (GEO - 2026)

Este projeto implementa uma abordagem híbrida de SEO tradicional (motores de busca indexáveis, como Google/Bing) e Otimização para Modelos Gerativos (GEO – Generative Engine Optimization) destinados a agentes de IA estruturados como ChatGPT, Claude e Google Overviews.

## Pilares Fundamentais

### 1. JSON-LD e Microdados
Nós adotamos as definições do **[Schema.org](https://schema.org/)** para comunicar informações diretas da nossa imobiliária para as plataformas externas. Usamos a biblioteca de controle `react-helmet-async` e instanciamos esses layouts pelas props do `SEOHead`.

- `RealEstateAgent`: Define as coordenadas, contato, e identidade corporativa da imobiliária (injetações na `Home` e `About`).
- `Product` e `Offer`: Otimiza o reconhecimento semântico de propriedades e preços dinâmicos direto do Supabase via a tela de Detalhe de Imóvel, o que gera Rich Snippets nas pesquisas por preços específicos da região.

### 2. URL Amigáveis Semânticas
Os IDs isolados nos caminhos prejudicam a indexação de buscas por localização. Em 2026, alteramos nossa estrutura de links para o router e sitemap usarem padrões como:
`/imoveis/praia-grande/apartamento-alto-padrao-123e4567-e89b-12d3...`
Com um parser focado em extrair somente o UUID constante na base para o fetch interno.

### 3. A Estrutura de Tags Semânticas HTML5 (GEO Friendly)
Para ranqueamentos da IA e AI Overviews (Featured snippets avançados), o texto simples que parece uma tabela muitas vezes é lido como uma string confusa. O React nesta arquitetura prioriza:
- Uso de `dl` (Definition list) para renderizar pares de chave-valor (ex: Tipo: Apartamento, Vagas: 2).
- Tag `article` ou `section` contida por tags `H2` hierarquicamente.
- Renderização limpa e E-E-A-T com a definição visual do nome do autor/corretor nas Meta Tags nativas no `SEOHead.tsx`.

## 4. Textos e Generative Engine Optimization (GEO)
Com o advento dos AI Overviews, keywords em blocos não bastam. A redação precisa ter:
- **Semântica Conversacional**: Headings precisam soar naturais (ex: "Apartamento à venda no Boqueirão" vs "Apt Venda Boqueirão"). Modificamos o `PropertyDetail` para injetar a transação e o bairro no `H1`. 
- **FAQ e Featured Snippets**: Elementos comuns no suporte respondidos na Homepage em HTML direto acompanhados de `FAQPage` schema em JSON-LD maximiza as chances de "Zero-click searches" com citação de nossa Imobiliária.
- **Autoridade E-E-A-T**: Marcadores contínuos e verdadeiros, como tempo de experiência ("15+ anos de mercado"), devem ser ancorados nativamente nas chamadas (Hero Section / Footer), fortalecendo a credibilidade perante avaliadores automatizados do Google (Quality Raters).

## Fluxo de Manutenção

Toda nova página que necessite indexação orgânica ou compartilhamento (ex. OpenGraphs em chats WhatsApp) deve obrigatoriamente renderizar o componente encapsulado:
```tsx
<SEOHead 
  title="Título Limpo" 
  description="Resumo claro sem truncar."
  schema={...} 
/>
```
Nunca insira tags manuais no arquivo `index.html` em diretórios com propósitos modulares.

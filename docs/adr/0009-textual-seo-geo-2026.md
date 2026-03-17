# ADR 0009: Textual SEO and Generative Engine Optimization (GEO) 2026

## 1. Contexto

A integração de esquemas (JSON-LD) sozinha não é suficiente em um cenário dominado por AI Overviews (SGE do Google) e agentes conversacionais (como ChatGPT). Se o DOM não apresentar sintaxe semântica, correlações diretas ou respostas contundentes a dúvidas humanas, a indexação perde tração.
Identificamos a necessidade de refatorar conteúdos verbais ("textos de herói", descrições e rodapés) para focar não apenas em densidade de keywords como "Imobiliária Praia Grande", mas centralizar os esforços em respostas a "long tail queries" naturais e Sinais E-E-A-T.

## 2. Decisão

1. **E-E-A-T Constante**: Adicionamos explicitamente marcadores de autoridade de marca (ex: "15+ anos de mercado imobiliário em SP") globalmente via Footer e em copys da Homepage.  
2. **Schema Extendido**: 
   - A `Home.tsx` agora comporta `FAQPage` schema combinado a Respostas diretas sobre financiamento e regiões quentes para compras (Boqueirão, etc). 
   - `PropertyDetail.tsx` utiliza `BreadcrumbList` dinâmico atrelando a localidade à taxonomia da página.
3. **Conversational Titles**: Atualizamos componentes para forçar `H1`s e `H2`s a assumirem a forma natural falada. Por exemplo: de "Apartamento 3 Dorm" para "Apartamento com 3 quartos à venda no Boqueirão".
4. **Semântica HTML**: Tags `<ul>` e `<dl>` devem guiar atributos e comodidades ao invés de parágrafos dispersos ou DIVs puras.

## 3. Opções Consideradas

1. Injetar texto com display bloqueado (`display:none`) unicamente para os robôs lerem.
   - Rejeitado. Mecanismos punem severamente o keyword stuffing mascarado (black hat SEO). Todo conteúdo textual de indexação primária refatorado é orgânico e voltado ao funil do ser humano também.

## 4. Consequências

- Copywriting das páginas e novos componentes devem obedecer e se alinhar à essa autoridade.
- Quaisquer alterações na página inicial (Home) que substituam o bloco do componente *FAQ* precisam considerar a recriar ou preservar a tag `<SEOHead schema={faqSchema} />`, pois a extração das dúvidas frequentes é uma fonte primária de Featured Snippets no Google para o nosso mercado.

## 5. Status

**Aceito**

## 6. Referências

- [Google E-E-A-T Guidelines](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Schema.org - FAQPage](https://schema.org/FAQPage)
- [Schema.org - BreadcrumbList](https://schema.org/BreadcrumbList)

# Transformar /ofertas em seção #ofertas na Home

## Objetivo
Eliminar a página separada `/ofertas` e transformá-la numa seção (`#ofertas`) dentro da Home, mantendo todos os filtros (busca, categoria, tipo, ordenação) e o comportamento atual. O menu "Ofertas" passa a rolar suavemente até essa seção em vez de trocar de rota.

## O que muda para o usuário
- Clicar em **Ofertas** no menu rola até a seção, sem recarregar a página.
- Links antigos `/ofertas?categoria=...` continuam funcionando (redirecionados para `/?categoria=...#ofertas`).
- A URL passa a refletir a seção e os filtros (`/?categoria=salao&tipo=cupom#ofertas`), permitindo compartilhar links.
- Botão "voltar" na página de detalhe da oferta volta para a Home na seção de ofertas.

## Estrutura da nova seção na Home
Mesmo layout atual de `/ofertas`:
- Cabeçalho "Ofertas" com contagem e cidade.
- Sidebar de filtros (busca, categoria, tipo, limpar).
- Grid de cards com seletor de ordenação.

A seção entra na Home **substituindo** o bloco atual "Ofertas em destaque" (que mostra apenas 8 cards e um link "Ver todas →"), já que esse bloco se torna redundante. O carrossel de destaques (`FeaturedCarousel`) é mantido acima.

Ordem final da Home:
1. HeroSearch
2. FeaturedCarousel
3. **Seção #ofertas** (com filtros + lista completa)
4. CategoryGrid
5. HowItWorks
6. MerchantCTA

## Detalhes técnicos

### Arquivos a alterar

**Novo componente:** `src/components/site/OffersSection.tsx`
- Move toda a lógica de `pages/Ofertas.tsx` (filtros, ordenação, fetch) para um componente reutilizável.
- Usa `useSearchParams` para ler/gravar `q`, `categoria`, `tipo`, `ordem` na URL atual (funciona em qualquer rota).
- Recebe `id="ofertas"` e atributo `data-scroll-anchor` (compatível com sistema de offset do header já implementado).
- Recebe props opcionais `offers` e `loading` para reaproveitar o fetch já feito no `Index` (evita refetch duplicado e mantém performance).

**`src/pages/Index.tsx`**
- Remove o bloco "Ofertas em destaque" (cards + link "Ver todas").
- Insere `<OffersSection offers={offers} loading={loading} />` no lugar.
- Mantém o fetch já existente (uma única chamada `fetchOffers`).

**`src/pages/Ofertas.tsx`**
- Excluído (ou convertido em redirect — ver App.tsx).

**`src/App.tsx`**
- Substitui `<Route path="/ofertas" element={<Ofertas />} />` por um redirect que preserva query string e adiciona o hash:
  - Componente leve `OfertasRedirect` que usa `Navigate` para `/?<query>#ofertas`.
- Mantém compatibilidade com links antigos, indexação SEO e bookmarks.

**`src/components/site/Header.tsx`**
- Em `navItems`, troca `{ to: "/ofertas", label: "Ofertas" }` por `{ to: "/#ofertas", label: "Ofertas" }`.
- `handleNavClick` já trata hash links com offset dinâmico — funciona automaticamente.

**`src/components/site/HeroSearch.tsx`**
- Trocar `navigate('/ofertas?...')` por `navigate('/?...#ofertas')`.
- Aplicar nas duas ocorrências (submit do form e clique em categoria).

**`src/components/site/CategoryGrid.tsx`**
- Trocar `to="/ofertas"` e ``to={`/ofertas?categoria=${c.slug}`}`` por `to="/#ofertas"` e ``to={`/?categoria=${c.slug}#ofertas`}``.

**`src/components/site/Footer.tsx`**
- Trocar `<Link to="/ofertas">` por `<Link to="/#ofertas">`.

**`src/pages/OfferDetail.tsx`**
- Trocar `to="/ofertas"` (botão voltar) por `to="/#ofertas"`.

### Performance
A Home já chama `fetchOffers` uma vez. A nova seção reutiliza esse mesmo array via props — **nenhuma chamada de rede extra**. O custo adicional é apenas renderizar mais cards e os controles de filtro (componentes leves de UI). Sem impacto perceptível em LCP/TTI.

### SEO e links externos
- Rota `/ofertas` continua respondendo via `Navigate` (301-like client-side).
- Filtros permanecem em query string, indexáveis e compartilháveis.

## Fora do escopo
- Não altera design dos cards, do header, do hero ou de outras seções.
- Não altera autenticação, painel do lojista, formulários ou edge functions.
- Não altera o componente de altura dinâmica do header (já implementado em iteração anterior).

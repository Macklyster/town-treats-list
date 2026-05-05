
## Problema
Os itens "Categorias" e "Como Funciona" no menu apontam para `/#categorias` e `/#como-funciona`. O React Router atualiza a URL mas não rola até a seção, então o clique parece não fazer nada.

## Correção

1. **`src/components/site/HowItWorks.tsx`** — garantir `id="como-funciona"` na `<section>` raiz (adicionar se faltar).

2. **Novo `src/components/ScrollToHash.tsx`** — componente montado dentro do Router que observa `useLocation()` e, quando `location.hash` muda e o elemento existe, faz `scrollIntoView({ behavior: "smooth" })`. Resolve navegação cross-route e reload com hash.

3. **`src/App.tsx`** — montar `<ScrollToHash />` dentro do `<BrowserRouter>`.

4. **`src/components/site/Header.tsx`** — nos itens do menu (desktop e mobile), interceptar clique em links com hash:
   - Se já estamos na rota base (`/`), fazer `scrollIntoView` direto e atualizar hash.
   - Se estamos em outra rota, deixar o `<Link>` navegar normalmente — o `ScrollToHash` cuida do scroll depois.
   - Fechar menu mobile no clique.

## Resultado
Clicar em "Categorias"/"Como Funciona" rola suavemente até a seção, funcione você na home, em `/ofertas`, ou recarregando a página.

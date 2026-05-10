## Mudanças

### 1. Logo do Header volta ao topo
- `src/components/site/Header.tsx`: adicionar `onClick` no `<Link to="/">` do logo. Se já estiver em `/`, prevenir default e fazer `window.scrollTo({ top: 0, behavior: "smooth" })`. Se estiver em outra rota, navegação normal para `/` (já leva ao topo).

### 2. Botão flutuante "Voltar ao topo"
- Novo componente `src/components/site/BackToTopButton.tsx`:
  - `useState` para visibilidade + listener de `scroll` em `window`.
  - Mostra quando `window.scrollY > document.documentElement.scrollHeight * 0.6 - window.innerHeight` (ou seja, depois que o usuário passou 60% da página).
  - Posição `fixed bottom-6 right-6 z-50`, botão circular com ícone `ArrowUp` do lucide.
  - Estilo usando tokens: `bg-primary text-primary-foreground shadow-pop hover:bg-primary-deep`, transição de opacidade/translate suave.
  - `aria-label="Voltar ao topo"`.
  - Ao clicar: `window.scrollTo({ top: 0, behavior: "smooth" })`.
- Montar uma vez em `src/App.tsx` (dentro do `BrowserRouter`, fora das `Routes`) para aparecer em todas as páginas.

## Fora do escopo
Sem alterações em rotas, fetch, design system geral, ou outras seções.

## Problemas identificados

1. **Altura do header sticky maior que o `scroll-mt` aplicado.**
   - `Header` tem `h-20 md:h-24` (80/96px) + `CityBar` que varia: ~36px quando há cidade selecionada e ~48–56px quando não há (botão maior). Total real no desktop: **~132–150px**.
   - As seções têm `scroll-mt-28 md:scroll-mt-32` (112/128px), insuficiente — a seção alvo fica parcialmente coberta, dando sensação de "parou na seção anterior".
   - Como a `CityBar` muda de altura conforme o estado (cidade selecionada ou não), um valor fixo nunca vai bater 100%.

2. **"Início" não funciona quando já está em `/`.**
   - `handleNavClick` só trata links com `#`. Para `to="/"` no mesmo path, o `NavLink` não dispara navegação nem scroll, então nada acontece. Só funciona vindo de `/ofertas` porque aí ocorre troca de rota real.

3. **"Funciona no segundo clique"** é consequência direta de (1): no primeiro clique o scroll para num offset errado; no segundo, o layout já está estabilizado e o cálculo bate por acaso (ou o usuário interpreta a posição como correta).

## Plano

### 1. Altura do header como CSS variable dinâmica
Criar um pequeno hook/efeito no `Header.tsx` que mede a altura real do `<header>` (incluindo `CityBar`) com `ResizeObserver` e grava em `document.documentElement.style.setProperty('--header-h', '${h}px')`.

Isso cobre:
- Variação da `CityBar` (com/sem cidade)
- Diferenças mobile/desktop (h-20 vs h-24)
- Qualquer mudança futura de altura

### 2. Aplicar offset via CSS global
Em `src/index.css`, adicionar:

```css
:root { --header-h: 140px; } /* fallback */
[data-scroll-anchor] { scroll-margin-top: calc(var(--header-h) + 12px); }
html { scroll-padding-top: calc(var(--header-h) + 12px); }
```

Substituir as classes `scroll-mt-28 md:scroll-mt-32` em `CategoryGrid.tsx` e `HowItWorks.tsx` por `data-scroll-anchor`. O `scroll-padding-top` no `html` cuida também da navegação por hash do navegador (ScrollToHash + back/forward).

### 3. Handler de "Início" e correção do scroll suave
No `Header.tsx`:
- Estender `handleNavClick` para que, quando `to === "/"` e `pathname === "/"`, faça `e.preventDefault()` e `window.scrollTo({ top: 0, behavior: "smooth" })`.
- Para links com hash no mesmo path, em vez de `scrollIntoView({ block: "start" })`, calcular `const y = el.getBoundingClientRect().top + window.scrollY - headerH - 12` e usar `window.scrollTo({ top: y, behavior: "smooth" })`. Isso garante posicionamento correto mesmo se o navegador ignorar `scroll-margin-top` durante scroll programático em alguns casos.

### 4. ScrollToHash usa o mesmo cálculo
Atualizar `src/components/ScrollToHash.tsx` para ler `--header-h` e calcular o `top` manualmente em vez de `scrollIntoView`, mantendo consistência entre navegação por clique e por URL com hash.

### Fora do escopo
- Sem mudanças visuais no header, hero, banner ou seções.
- Sem alterações em rotas, autenticação ou comportamento do menu mobile (apenas o handler do "Início" passa a rolar pro topo).

## Detalhes técnicos

Arquivos modificados:
- `src/components/site/Header.tsx` — medir altura via ref+ResizeObserver, expor `--header-h`, ampliar `handleNavClick` (Início + cálculo de offset).
- `src/components/ScrollToHash.tsx` — usar `--header-h` para `window.scrollTo` em vez de `scrollIntoView`.
- `src/index.css` — declarar `--header-h`, regra global de `scroll-margin-top` em `[data-scroll-anchor]` e `scroll-padding-top` no `html`.
- `src/components/site/CategoryGrid.tsx` — trocar classes `scroll-mt-*` por atributo `data-scroll-anchor`.
- `src/components/site/HowItWorks.tsx` — idem.

Resultado esperado: qualquer item do menu (Início, Categorias, Como Funciona) posiciona corretamente no primeiro clique, em qualquer rota, com header de qualquer altura.

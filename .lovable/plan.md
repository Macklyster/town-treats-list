## Problema

Ao clicar em **Categorias** ou **Como Funciona** no menu, o scroll para na seção anterior (Ofertas em destaque) e só na segunda tentativa ele “centraliza” a seção certa.

### Causa

O `Header` é `sticky top-0` e ainda tem a `CityBar` acima do nav, somando ~96–112px de altura. O `scrollIntoView({ block: "start" })` posiciona o **topo da section exatamente no topo da viewport**, mas o header fixo cobre essa faixa — então a seção alvo fica escondida atrás do header e o usuário enxerga a seção anterior. No segundo clique o navegador já está com layout estabilizado e a percepção muda, mas o bug é o mesmo: falta compensar a altura do header.

Isso acontece tanto no handler do `Header.tsx` (`handleNavClick`) quanto no `ScrollToHash.tsx` (navegação vinda de outra rota).

## Plano

### 1. Adicionar `scroll-margin-top` nas seções ancoradas
Arquivos:
- `src/components/site/CategoryGrid.tsx` (section `#categorias`)
- `src/components/site/HowItWorks.tsx` (section `#como-funciona`)

Adicionar classe Tailwind `scroll-mt-28 md:scroll-mt-32` na `<section>`. Isso cria um offset nativo do CSS que o `scrollIntoView` e o scroll por hash respeitam, posicionando o topo da seção logo abaixo do header sticky.

Valor escolhido: header (~80–96px) + CityBar (~32px) ≈ 112–128px → `scroll-mt-28` (112px) no mobile e `scroll-mt-32` (128px) no desktop.

### 2. Sem mudanças nos handlers
Não é preciso mexer em `Header.tsx` nem em `ScrollToHash.tsx` — o `scroll-margin-top` resolve para os dois caminhos (clique na mesma rota e navegação inicial com hash).

### Fora do escopo
- Não alterar layout do hero, banner ou outras seções.
- Não mexer em comportamento do menu mobile.
- Sem mudanças funcionais ou de design visual — apenas o ponto de parada do scroll.

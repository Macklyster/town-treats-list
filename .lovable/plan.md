## Objetivo
Aumentar levemente o respiro vertical (~5% da altura visível) entre o final do texto do hero e o banner rotativo de ofertas, deixando o ritmo visual mais harmônico.

## Diagnóstico
- O hero (`HeroSearch`) usa padding inferior `py-10 md:py-14`.
- O banner (`FeaturedCarousel`) usa `-mt-12 relative z-10`, ou seja, é puxado ~48px para cima, sobrepondo o final do hero. É isso que está deixando o espaço muito apertado.

## O que vou alterar
Arquivo único: `src/components/site/FeaturedCarousel.tsx`.

- Reduzir a sobreposição do banner sobre o hero, trocando `-mt-12` por algo próximo de `-mt-4 md:-mt-6`.
- Resultado: ganho de ~40–50px de respiro entre a descrição do hero e o topo do banner (≈ 5% da viewport atual de ~954px), sem mexer no padding interno do hero nem em outras seções.

## Fora do escopo
- Não mudar layout do hero, header, banner em si ou demais seções.
- Sem mudanças funcionais.
# Problema

No hero da página inicial, o trecho "sua cidade" está em preto carvão (#0F0F0E) sobre o fundo azul indigo do gradiente. No mobile, o contraste fica ruim — o texto escuro "some" no fundo escuro azul, prejudicando a leitura.

# Opções de solução

Sugiro 3 caminhos. Posso aplicar o que você preferir:

### Opção A — Destaque com "pílula" amarela/creme (recomendado)
Envolver "sua cidade" em um fundo creme claro com cantos arredondados, mantendo o texto preto carvão. Cria contraste forte e vira um elemento visual de destaque.

```
As melhores ofertas da [ sua cidade ] num só lugar
                       ↑ fundo creme, texto carvão
```

- Funciona perfeitamente em mobile e desktop
- Reforça a marca (creme + indigo + carvão)
- Mantém a cor carvão que você pediu

### Opção B — Sublinhado decorativo amarelo/accent
Manter o texto branco (legível no azul) e colocar um traço/marcador colorido por baixo de "sua cidade".

- Boa legibilidade
- Mas perde a cor carvão

### Opção C — Trocar a cor por branco no mobile, carvão no desktop
Usar classes responsivas: `text-primary-foreground md:text-[#0F0F0E]`.

- Solução mais simples
- Mas inconsistência visual entre breakpoints

# Recomendação

**Opção A** — é a que melhor preserva sua decisão de cor (carvão), resolve o contraste em qualquer tela e adiciona personalidade ao hero.

Me diga qual prefere e eu implemento.
# Filtro de anúncios por empresa na Divulgação

Hoje a aba Divulgação mostra só as 6 ofertas aprovadas mais recentes, misturadas com os textos gerais. Vamos trocar por uma busca com filtros.

## O que muda na tela
- Nova seção **"Anúncios por empresa"**, separada dos textos gerais (convite, lojistas, FlyPontos, eventos, app), que continuam no topo.
- Filtros:
  - **Empresa**: campo com busca pelo nome da loja (lista das lojas aprovadas).
  - **Cidade**: seletor opcional.
  - **Busca pelo título** do anúncio.
  - **Tipo**: todos, Relâmpago, Cupom, Brinde etc.
- Sem empresa escolhida: mostra as 12 ofertas aprovadas mais recentes. Com empresa: mostra todas as ofertas aprovadas e vigentes dela.
- Botão **"Carregar mais"** (12 por vez) e contador "X anúncios encontrados".
- Botão **"Limpar filtros"** e mensagem amigável quando nada é encontrado.
- Cada cartão mantém os botões WhatsApp, Copiar texto, Copiar link e Compartilhar, com as redes sociais da loja no texto.

## Detalhes técnicos
- `AdminDivulgacao.tsx`: separar posts fixos dos posts de oferta; nova consulta com `.eq("store_id")`, `.ilike("title")`, `.eq("type")`, filtro de cidade via `stores!inner(city)`, `range()` para paginação e `count: "exact"`; busca com debounce de 300 ms.
- Lista de lojas carregada uma vez (id, nome, cidade) para o seletor com busca (Command/Popover já usados no projeto).
- Ofertas vencidas excluídas pela mesma regra de visibilidade pública.
- Sem mudanças no banco.

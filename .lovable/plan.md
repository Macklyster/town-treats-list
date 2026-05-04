## Helpfy Ofertas Locais — Site Promocional (v1)

Site institucional/promocional estático em página única com navegação por âncoras + páginas de detalhe e "Anuncie Conosco". Sem backend nesta versão; ofertas mockadas em arquivo TS para fácil edição. Visual moderno e clean: branco + azul-marinho como base, laranja Helpfy como cor de destaque.

### Identidade visual
- Cores: laranja Helpfy `#F08A5D` (accent/CTA), azul-marinho `#0F1E45` (texto/headings), branco e cinzas suaves para superfícies.
- Tipografia: sans-serif moderna (Inter para corpo, Sora ou similar para headings).
- Logo Helpfy aplicado no header e rodapé (usar imagem enviada).
- Componentes: cards com bordas suaves, badges arredondadas de desconto em laranja, hover sutil.

### Estrutura de páginas

**1. Home (`/`)**
- Header fixo: logo Helpfy, navegação (Ofertas, Categorias, Como Funciona, Para Lojistas), botão "Anuncie Conosco".
- Hero: título "As melhores ofertas da sua cidade num só lugar", subtítulo, barra de busca grande (palavra-chave) e chips das categorias.
- Banner rotativo "Ofertas da Semana" (carousel com 3-4 destaques).
- Categorias populares: Alimentação, Beleza & Saúde, Lojas & Moda (3 blocos visuais com ícone).
- Grid "Ofertas em Destaque": 8 cards com foto, badge de % desconto, título, loja, preço original riscado, preço promocional, botão "Ver Oferta".
- Seção "Como Funciona para o Consumidor": 3 passos (Busque → Escolha → Aproveite).
- Seção "Para Lojistas": faixa azul-marinho com CTA laranja para `/anuncie`.
- Rodapé: links (Sobre, Contato, Termos, Privacidade), redes sociais, copyright.

**2. Listagem de Ofertas (`/ofertas`)**
- Filtros laterais: categoria, bairro (placeholder), tipo (desconto/cupom/brinde), faixa de preço.
- Ordenação: mais recente, mais popular, menor preço, maior desconto.
- Grid paginado de cards.
- Reaproveita componente `OfferCard`.

**3. Detalhe da Oferta (`/oferta/:id`)**
- Galeria de fotos, título, badge de desconto.
- Preços (original riscado + promocional grande), descrição, condições, validade.
- CTAs: "Pegar Oferta no WhatsApp" (link `wa.me` placeholder) e "Ver Loja".
- Card do lojista: nome, endereço, telefone, horário, redes sociais.
- Mapa estático embed (placeholder).
- "Ofertas relacionadas" no fim.

**4. Anuncie Conosco (`/anuncie`)**
- Hero com proposta de valor.
- "Como Funciona" em 4 passos.
- Tabela de 3 planos: Básico, Destaque, Plus (com benefícios e preços fictícios).
- Formulário de contato (nome, e-mail, telefone, empresa, mensagem) — submit local com toast de sucesso (sem backend).
- FAQ em accordion (5-6 perguntas).

**5. NotFound (`/404`)** — já existe, manter.

### Dados (mock)
- `src/data/offers.ts`: 12-16 ofertas com id, título, loja, categoria, fotos (Unsplash), preços, descrição, validade.
- `src/data/stores.ts`: 6-8 lojistas com endereço, telefone, redes.
- `src/data/categories.ts`: 3 categorias iniciais.

### Componentes principais
`Header`, `Footer`, `HeroSearch`, `OfferCard`, `OfferCarousel`, `CategoryGrid`, `HowItWorks`, `MerchantCTA`, `PlansTable`, `ContactForm`, `FAQ`.

### Detalhes técnicos
- React Router já configurado — adicionar rotas `/ofertas`, `/oferta/:id`, `/anuncie`.
- Tokens HSL em `index.css` atualizados com a paleta da marca; `tailwind.config.ts` mantém referência a tokens semânticos.
- Logo copiado para `src/assets/helpfy-logo.jpeg` e importado nos componentes.
- Responsivo (mobile-first), acessível (alt em imagens, labels nos inputs), SEO básico (title/meta por página via `react-helmet`-style tags no `index.html` para a home).
- Toaster (sonner) já instalado para feedback do formulário.

### Fora do escopo (v1)
- Backend, banco de dados, login de lojistas, painel admin, pagamentos, busca/filtros realmente persistentes. Podem entrar numa v2 com Lovable Cloud.
- Cidade real, contatos reais, integração WhatsApp real — todos placeholders editáveis.

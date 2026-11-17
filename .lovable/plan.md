# Página de Eventos pronta para o Google

## Situação hoje
A página /eventos já existe, mas o Google recebe nela o título e a descrição da home ("OfertasFly Locais — As melhores ofertas da sua cidade"). A lista de eventos só aparece depois que a página carrega no navegador. Para o Google, a página parece uma cópia da home.

## O que muda
1. **Título e descrição próprios**
   - Título: "Eventos em sua cidade — Shows, feiras e happy hours | OfertasFly"
   - Descrição: "Agenda de eventos locais: shows, feiras, happy hours e promoções das lojas parceiras do OfertasFly. Veja datas, locais e como participar."
   - Prévia de compartilhamento própria. Usa a foto do próximo evento em destaque, ou a imagem padrão quando não houver nenhum.
2. **Endereço oficial** apontando para ofertasfly.com.br/eventos.
3. **Conteúdo visível para o Google**: os próximos eventos aprovados (título, data, cidade e link) já chegam prontos na página, junto com um parágrafo curto explicando o que o visitante encontra ali.
4. **Dados estruturados de eventos**: cada evento futuro é marcado com nome, data, local e imagem. Isso permite que o Google mostre os eventos com data nos resultados.
5. **Mapa do site**: além de /eventos, cada evento aprovado e ainda não encerrado passa a constar no mapa enviado ao Google.
6. Depois da sua aprovação: publicar, conferir o código que o Google recebe e pedir ao Search Console que leia o mapa do site de novo.

Hoje todos os eventos cadastrados já terminaram. Enquanto não houver eventos novos, a página continua indexável, com o texto de apresentação e um aviso de "nenhum evento no momento".

## Detalhes técnicos
- `src/routes/eventos.tsx`: um `loader` busca os próximos eventos aprovados (até 20) pelo cliente público, e o `head()` usa `buildHead` com o caminho `/eventos`, mais `scripts` JSON-LD `ItemList` de `Event`.
- A página `Eventos` recebe a lista inicial do loader, mantendo a busca e os filtros atuais no cliente, sem leitura de armazenamento do navegador no primeiro render.
- A função de sitemap passa a incluir `/evento/<slug>` para eventos aprovados com `ends_at` no futuro. Depois, é preciso fazer o redeploy dela e reenviar o sitemap ao Search Console.

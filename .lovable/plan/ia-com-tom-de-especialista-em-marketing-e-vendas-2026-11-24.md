# IA com tom de especialista em Marketing e Vendas

Reescrever as instruções da IA que sugere título e descrição dos anúncios (ofertas, Coletivas, Leilões e Ofertas Invisíveis) para que ela escreva como uma especialista em marketing e vendas.

## Novas regras para a IA
- **Título:** chamativo e direto, destaca o produto e o benefício principal (ex.: preço, desconto, novidade). Até 80 caracteres, sem emojis.
- **Descrição:** persuasiva. Desperta necessidade e desejo, mostra benefícios e o uso no dia a dia, cria urgência positiva ("aproveite", "garanta o seu") e termina chamando para a ação (WhatsApp/visitar a loja). Até 200 caracteres.
- **Proibido:** qualquer texto que gere dúvida, medo, culpa ou insegurança (ex.: "não perca ou vai se arrepender", "você sabia que pode estar correndo risco…", alertas sobre saúde), perguntas negativas, linguagem alarmista, sarcasmo ou comparação negativa com concorrentes.
- Mantém: sem promessas falsas nem inventar dados (garantias, brindes, prazos) que o lojista não informou; português do Brasil.

## Detalhes técnicos
- Só o texto de `instructions` em `src/server/handlers/suggest-offer.ts` muda; formato da resposta, preço sugerido e regras de acesso continuam iguais.
- O painel SEO (`suggest-seo.ts`) não muda.
- Validação: gerar uma sugestão de teste e conferir tom e ausência de frases negativas.

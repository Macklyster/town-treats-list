# Atualizar Logo do Site + Branding Stripe

## 1. Substituir logo nos arquivos do site

**Ação:** Copiar a nova imagem enviada para `src/assets/helpfy-logo.png` (sobrescrevendo a referência atual `helpfy-logo.jpeg`).

**Arquivos que serão atualizados para apontar ao novo logo:**
- `src/components/site/Header.tsx` — logo do cabeçalho
- `src/components/site/Footer.tsx` — logo do rodapé
- `index.html` — adicionar `<link rel="icon">` apontando para uma versão do logo como favicon (`public/favicon.png`)
- Atualizar meta `og:image` se desejado (mantém atual por enquanto)

**Detalhes técnicos:**
- A imagem enviada é horizontal (logo + wordmark). Mantém boa apresentação no Header (h-9/h-10) e Footer (h-10).
- Para o favicon, gerar/copiar uma versão quadrada (apenas o ícone das duas pessoas) — alternativa: usar a mesma imagem horizontal (funciona, mas fica menor). Vou usar a imagem completa por simplicidade; se o usuário quiser ícone quadrado, pode enviar separado.
- Remover/sobrescrever `public/favicon.ico` antigo.

## 2. Personalizar Branding no Stripe (instruções — não é código)

A personalização visual do Stripe Checkout e do Customer Portal é feita **diretamente no Dashboard do Stripe**, não via código. Vou te entregar o passo a passo:

**Checkout / Portal Branding:**
1. Acesse o Stripe Dashboard → **Settings** → **Branding** (`https://dashboard.stripe.com/settings/branding`)
2. Faça upload de:
   - **Logo** (recomendado: PNG quadrado ≥ 128×128, fundo transparente — só o ícone das pessoas)
   - **Icon** (favicon Stripe — versão pequena do logo)
3. Defina:
   - **Brand color**: `#F08A5D` (laranja Helpfy)
   - **Accent color**: `#0F1E45` (navy Helpfy)
4. Em **Public business information**, preencha nome "Helpfy Ofertas", site, suporte.

**Customer Portal:**
- Dashboard → **Settings** → **Billing** → **Customer portal** → habilite branding e confirme cores/logo herdadas.

**Email de recibos:**
- Dashboard → **Settings** → **Emails** → ative "Successful payments" e "Refunds" com o branding configurado.

> Faça isso tanto no modo **Test** quanto **Live** (configurações são separadas).

## 3. Resultado

- Site exibe o novo logo HelpfyOfertas no header, footer e como favicon.
- Quando o usuário for redirecionado ao Stripe Checkout/Portal, verá o logo + cores Helpfy aplicados (após você completar o passo 2 no Dashboard).

---

**Observação:** Se você quiser que eu também gere uma versão **quadrada** do ícone (apenas as 2 pessoas no círculo, sem o texto) para usar como favicon e logo do Stripe, me envie ou peça que eu gere via IA.

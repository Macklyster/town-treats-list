## Problemas identificados

**1) Redirect 404 após login com Google**

Em `src/pages/Auth.tsx` (linha 21), o redirect padrão é:

```ts
const redirect = params.get("redirect") || "/painel";
```

A rota `/painel` não existe em `src/App.tsx` — a rota correta do lojista é `/painel-lojista`. Por isso, ao entrar com Google (sem `?redirect=` na URL), o usuário cai no catch-all `*` que renderiza `NotFound` (404).

**2) Tela de consentimento Google mostra "Lovable" em vez de "HelpfyOfertas"**

A aplicação usa o OAuth gerenciado pela Lovable Cloud (`lovable.auth.signInWithOAuth("google", ...)`). Nesse modo, as credenciais OAuth pertencem à Lovable, então o Google exibe "Lovable" como nome do app na janela de seleção de conta. Isso **não é um bug de código** — é o comportamento esperado do OAuth gerenciado.

Para que a tela de consentimento exiba "HelpfyOfertas" (com seu logo e domínio), é necessário criar credenciais OAuth próprias no Google Cloud Console e cadastrá-las nas Configurações de Autenticação do Lovable Cloud.

## Mudanças no código

**`src/pages/Auth.tsx`** — corrigir o destino padrão:

- Trocar `"/painel"` por `"/painel-lojista"` na linha 21.

Isso resolve o 404 tanto para login com e-mail/senha quanto para login com Google quando não há `?redirect=` na URL.

## Ação manual do usuário (para personalizar a tela do Google)

Para a janela de consentimento exibir "HelpfyOfertas":

1. Acesse o Google Cloud Console e crie um projeto (ou use um existente).
2. Em **OAuth consent screen**: defina nome do app = "HelpfyOfertas", logo, e-mail de suporte e adicione o domínio autorizado `helpfyofertas.com.br` (e `lovable.app`).
3. Configure os escopos: `userinfo.email`, `userinfo.profile`, `openid`.
4. Em **Credentials → Create credentials → OAuth Client ID** (tipo Web application):
   - Em **Authorized redirect URIs**, cole a URL de callback que aparece em **Backend → Autenticação → Provedores → Google** do Lovable Cloud.
5. Copie o **Client ID** e **Client Secret** gerados.
6. No Lovable Cloud, abra **Backend → Users → Authentication Settings → Sign In Methods → Google** e cole o Client ID e Secret. Salve.

A partir daí, a janela do Google passará a exibir "HelpfyOfertas" e o domínio do site no lugar de "Lovable".

Após aprovar este plano, eu aplico a correção do redirect e disponibilizo o botão para abrir o painel do Backend onde você cola as credenciais.
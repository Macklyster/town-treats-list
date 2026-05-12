## Objetivo
Mostrar um alerta amigável em dispositivos móveis convidando o usuário a instalar o OfertasFly na tela inicial, sem que precise abrir o menu do navegador.

## Comportamento

- **Android / Chrome / Edge**: usar o evento nativo `beforeinstallprompt`. Quando disparado, exibir um banner inferior com botão **Instalar app** que chama `prompt()` diretamente.
- **iOS Safari**: sem API nativa. Detectar iOS + Safari e mostrar banner com botão **Como instalar** que abre um modal com as instruções ilustradas (ícone Compartilhar → "Adicionar à Tela de Início").
- **Não mostrar quando**:
  - já instalado (`display-mode: standalone` ou `navigator.standalone === true`);
  - desktop (largura > 768px);
  - dentro do iframe do editor / hosts de preview (mesma checagem usada em `src/lib/pwa.ts`);
  - usuário dispensou recentemente (ver abaixo).
- **Dispensar**: botão "X" no banner. Ao dispensar, gravar timestamp em `localStorage` (`pwa-install-dismissed-at`) e ocultar por **14 dias**. Se o usuário clicar em **Instalar** e aceitar, ocultar permanentemente.
- **Aparição**: o banner aparece após **20 s** de navegação na primeira sessão (evita aparecer antes do usuário entender o app). Em sessões futuras, aparece imediatamente se ainda elegível.

## Arquivos novos

- `src/hooks/useInstallPrompt.ts`
  - Captura `beforeinstallprompt` (com `e.preventDefault()` e armazenamento do evento em estado).
  - Expõe `{ canInstall, isIOS, isStandalone, promptInstall, dismissedRecently, dismiss }`.
  - Detecta iOS via `/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream`.
  - Detecta standalone via `matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone`.

- `src/components/site/InstallAppBanner.tsx`
  - Banner fixo no rodapé (mobile only via `md:hidden`) com logo, copy curta ("Instale o OfertasFly e receba ofertas relâmpago em segundos") e dois botões (Instalar / Agora não).
  - Variante iOS: botão **Como instalar** abre `<Dialog>` com passos ilustrados (ícone share + "Adicionar à Tela de Início").
  - Animação de entrada suave (slide-up, Tailwind).

## Arquivos editados

- `src/App.tsx`: montar `<InstallAppBanner />` uma única vez no shell, fora das rotas, para aparecer em qualquer página pública.

## Detalhes técnicos

- Guard inicial idêntico ao de `src/lib/pwa.ts` para nunca aparecer em iframe/preview.
- O hook não chama `prompt()` automaticamente — apenas após interação do usuário (requisito dos navegadores).
- Após `userChoice` ser `accepted`, gravar `localStorage.setItem('pwa-installed','1')` para nunca mais mostrar.
- Telemetria leve (opcional): `console.info` nos eventos `prompt_shown`, `prompt_accepted`, `prompt_dismissed` — sem novas tabelas.
- Manifest já está configurado (`display: standalone`, ícones 192/512/maskable), então a instalação funciona sem mudanças no `manifest.webmanifest`.

## Fora do escopo

- Push notification onboarding (já existe em `usePush`).
- Tracking server-side de instalações.
- Variante para desktop / outros navegadores além de Chromium e Safari iOS.

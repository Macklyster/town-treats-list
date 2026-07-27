## Objetivo
Exibir uma saudação personalizada ("Bom dia, João") no botão da conta do menu superior quando o usuário estiver logado, em vez do texto genérico "Minha conta".

## Alterações propostas

### 1. Buscar nome do perfil no auth context
- Estender `src/hooks/useAuth.tsx` para buscar `full_name` da tabela `profiles` quando houver `user.id`.
- Expor `displayName?: string` no contexto, mantendo fallback para `user.user_metadata.full_name` ou `user.email`.

### 2. Reutilizar função de saudação existente
- Importar `greeting` de `src/lib/home-api.ts` em `src/components/home/HomeHeader.tsx`.
- Montar o texto: `greeting(displayName)` → "Bom dia, João".

### 3. Atualizar o botão da conta (desktop)
- No `HomeHeader.tsx`, substituir o label "Minha conta" pelo resultado da saudação quando `user` estiver presente.
- Manter o ícone de usuário e o comportamento do dropdown.

### 4. Atualizar o menu mobile
- Na seção "Minha conta" do menu mobile, exibir o nome da saudação como título/cabeçalho quando logado, para manter consistência.

### 5. Tratamento de loading
- Garantir que, enquanto o nome carrega, o botão não fique vazio: exibir "Minha conta" como fallback até `displayName` estar disponível.

## Resultado esperado
Usuários logados veem "Bom dia, Maria", "Boa tarde, Carlos" etc. no botão do header; visitantes não logados continuam vendo "Entrar".
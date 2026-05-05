## Objetivo

Permitir que **somente lojistas** criem conta pelo site. Admins continuam sendo criados manualmente (promoção via banco/painel admin). O consumidor final navega sem precisar de login.

## Mudanças

### 1. `src/pages/Auth.tsx` — Simplificar formulário de cadastro
- Remover o checkbox "Sou lojista e quero anunciar ofertas" (não faz mais sentido — todo cadastro é de lojista).
- Ajustar o título/copy da aba "Criar conta" para deixar claro: **"Criar conta de lojista"** com subtítulo tipo "Cadastre-se para anunciar suas ofertas no HelpfyOfertas".
- No `handleSignup`, sempre inserir a role `lojista` para o novo usuário e redirecionar para `/painel-lojista`.
- A aba **"Entrar"** continua igual (serve para lojista e admin).

### 2. Trigger `handle_new_user()` — Ajustar role padrão
Hoje o trigger insere automaticamente `consumer` em todo signup. Vamos alterá-lo para inserir `lojista` por padrão (já que só lojistas se cadastram). Assim evitamos duplicar inserts no front e no trigger.

Migração SQL:
```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  insert into public.user_roles (user_id, role) values (new.id, 'lojista');
  return new;
end;
$$;
```

Com isso, o `handleSignup` não precisa mais inserir role manualmente — o trigger cuida.

### 3. Página `/anuncie` (`src/pages/Anuncie.tsx`)
Verificar e ajustar o CTA principal: deve direcionar para `/auth` (aba criar conta) com mensagem clara de "Crie sua conta de lojista". Sem necessidade de checkbox.

### 4. Header (`src/components/site/Header.tsx`)
- Botão "Entrar" continua (lojista/admin acessam por aqui).
- Botão "Anuncie Conosco" continua como CTA principal de cadastro.
- Sem mudança no menu do consumidor (ele não precisa logar).

### 5. Observação sobre dados existentes
Usuários que já existem com role `consumer` permanecem com essa role (sem efeito prático, já que consumidor não acessa nada protegido). Não vamos migrar/limpar esses registros — opcional no futuro.

### 6. Como criar o primeiro admin
Como admin não pode mais ser criado pelo formulário, ele é promovido manualmente:
- Via painel `/admin` (se já existir um admin), ou
- Inserindo direto em `user_roles` (`role = 'admin'`) para um user já cadastrado.

## Resultado

- Aba "Criar conta" = só lojista, sem checkbox confuso.
- Trigger garante role `lojista` automaticamente em todo signup.
- Consumidores continuam navegando livremente, sem login.
- Admins seguem sendo gerenciados manualmente.

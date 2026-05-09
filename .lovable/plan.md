## Objetivo
Adicionar uma nova aba **Categorias** no painel admin (`/admin`) para criar, editar, reordenar e excluir categorias do banco.

## Mudanças

### 1. `src/pages/Admin.tsx`
- Adicionar nova aba `Categorias` ao lado de `Ofertas` e `Lojas`.
- Listar categorias da tabela `categories` (nome, slug, ícone Lucide, ordem).
- Botão **Nova categoria** abrindo um `Dialog` com formulário (nome, slug, ícone, ordem).
  - Auto-gerar slug a partir do nome (pode ser editado).
- Cada linha terá ações: **Editar** (mesmo Dialog preenchido), **Excluir** (com `AlertDialog` de confirmação) e botões **↑ / ↓** para reordenar (atualiza `sort_order`).
- Renderizar prévia do ícone Lucide ao lado do nome (lookup dinâmico em `lucide-react`, igual ao padrão usado no site).

### 2. RLS / Banco
- Já existe policy `admins manage categories` (ALL) → não precisa de migração.
- Operações via `supabase.from("categories").insert/update/delete()` direto do client.

### 3. Validações
- Nome obrigatório, slug obrigatório e único (lowercase, sem espaço/acento — usar helper de slugify).
- Toast de sucesso/erro com `sonner` (mesmo padrão do resto da página).
- Recarregar lista após cada operação (reuso da função `load`).

## Pontos técnicos
- Sem mudanças no backend nem em `src/data/categories.ts` (esse arquivo é fallback estático e não interfere).
- Componentes shadcn já disponíveis: `Dialog`, `AlertDialog`, `Input`, `Label`, `Button`, `Tabs`.
- Ícone preview: `const Icon = (LucideIcons as any)[name] ?? LucideIcons.Tag`.

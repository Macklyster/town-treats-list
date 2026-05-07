## Objetivo

Substituir o campo "URL do logo" (input de texto) no cadastro/edição da loja por um **upload de arquivo** (SVG ou PNG), com limites de tamanho, validações e armazenamento vinculado à conta do lojista autenticado.

## Mudanças propostas

### 1. Novo bucket de storage `store-logos`
- Bucket público (para exibição direta do logo no site).
- Pasta por loja: `{store_id}/logo.{ext}` — isola os arquivos por lojista.
- Políticas RLS no `storage.objects`:
  - **SELECT**: público (logo aparece no site).
  - **INSERT/UPDATE/DELETE**: apenas o `owner_id` da loja correspondente (validado via `storage.foldername(name)[1] = store_id` + join em `stores`), e admins.

### 2. Componente `ImageUploader` reutilizado
O projeto já possui `src/components/site/ImageUploader.tsx` (usado para imagens de oferta). Vamos:
- Reusar o mesmo componente, parametrizando o `bucket="store-logos"`, `aspect="square"`, `maxWidth=512`.
- Estender para aceitar **SVG** além de JPG/PNG/WebP (hoje só aceita raster). Para SVG: pular a etapa de compressão/canvas (preserva vetor) e fazer upload direto com `contentType: "image/svg+xml"`.
- Adicionar prop `accept` configurável: `["image/svg+xml", "image/png"]` para o caso do logo.

### 3. Limites e validações
- **Tamanho máx.**: 2 MB para o logo (SVG e PNG).
- **Formatos aceitos**: `image/svg+xml`, `image/png`.
- **Validação client-side**: tipo MIME + tamanho antes do upload, mensagens via `toast`.
- **Validação server-side**: políticas RLS + restrição de mime no bucket (`allowed_mime_types`) + `file_size_limit` configurados na criação do bucket.
- **Sanitização SVG**: como SVG pode conter scripts, importar `DOMPurify` e sanitizar o conteúdo do arquivo antes do upload (remove `<script>`, handlers `on*`, `foreignObject`, etc.).

### 4. Vínculo ao status da conta do lojista
Regras aplicadas no `LojaForm.tsx` antes de habilitar o uploader:
- Usuário precisa estar **autenticado** (já garantido pela `ProtectedRoute`).
- Precisa ter o papel **lojista** (já garantido).
- A **loja precisa existir** (registro em `stores` criado): se `storeId` for `null`, o uploader fica desabilitado com a mensagem "Salve os dados da loja antes de enviar o logo." (mesmo padrão já usado no `ImageUploader` para `offer-images`).
- Status `approved` da loja **não bloqueia** o upload (lojista pendente também pode preparar o material), mas a UI mostra um aviso "Sua loja está em análise — o logo aparecerá publicamente após aprovação."
- Caso a loja seja **removida/desaprovada**, o arquivo permanece no bucket mas não é exibido publicamente (controlado pela leitura da `stores`).

### 5. Migração do campo `logo_url`
- Mantém a coluna `logo_url` em `stores` (já existe, `text`, nullable).
- O upload grava a URL pública resultante em `stores.logo_url` ao salvar o formulário (mesmo fluxo já existente, só muda a origem do valor).
- Ao trocar o logo, o arquivo antigo é removido do bucket (helper `pathFromUrl` já implementado).

### 6. UI no `src/pages/LojaForm.tsx`
Substituir:
```
<Label>URL do logo</Label>
<Input ... placeholder="https://..." />
```
por:
```
<ImageUploader
  value={form.logo_url}
  onChange={(url) => setForm({ ...form, logo_url: url })}
  storeId={storeId}
  bucket="store-logos"
  label="Logo da loja (SVG ou PNG, até 2 MB)"
  aspect="square"
  maxWidth={512}
  accept={["image/svg+xml", "image/png"]}
/>
```
Inclui aviso quando `storeId === null` ou quando a loja ainda não foi aprovada.

## Detalhes técnicos

### Migração SQL (resumo)
```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('store-logos', 'store-logos', true, 2097152,
        array['image/svg+xml','image/png']);

-- SELECT público
create policy "store logos public read"
  on storage.objects for select
  using (bucket_id = 'store-logos');

-- INSERT/UPDATE/DELETE apenas dono da loja ou admin
create policy "owners manage store logo"
  on storage.objects for all
  using (
    bucket_id = 'store-logos'
    and (
      exists (
        select 1 from public.stores s
        where s.id::text = (storage.foldername(name))[1]
          and s.owner_id = auth.uid()
      )
      or public.has_role(auth.uid(), 'admin')
    )
  )
  with check (
    bucket_id = 'store-logos'
    and (
      exists (
        select 1 from public.stores s
        where s.id::text = (storage.foldername(name))[1]
          and s.owner_id = auth.uid()
      )
      or public.has_role(auth.uid(), 'admin')
    )
  );
```

### Alterações no `ImageUploader.tsx`
- Adicionar props: `accept?: string[]`, `maxBytes?: number`, `sanitizeSvg?: boolean` (default true quando aceita SVG).
- Detectar `file.type === "image/svg+xml"` → ler como texto, sanitizar com DOMPurify (`USE_PROFILES: { svg: true, svgFilters: true }`), enviar `Blob([sanitized], { type: "image/svg+xml" })`.
- Para PNG, manter o pipeline atual de compressão (ou pular compressão se PNG transparente — opcional).
- Instalar dependência: `dompurify` + `@types/dompurify`.

### Arquivos a modificar
- `supabase/migrations/*` (nova migração) — bucket + políticas.
- `src/components/site/ImageUploader.tsx` — suporte a SVG e props configuráveis.
- `src/pages/LojaForm.tsx` — substituir input por `ImageUploader` + aviso de status.
- `package.json` — adicionar `dompurify`.

## O que NÃO muda
- Schema da tabela `stores` (coluna `logo_url` já existe).
- Fluxo de cadastro/edição da loja em si.
- Bucket `offer-images` e seu uso atual.

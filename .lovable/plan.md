## Problema atual

No formulário de Nova Oferta o lojista precisa colar uma **URL de imagem** externa. Isso é frágil:
- Imagens podem sair do ar (link quebrado), o lojista não sabe hospedar
- Sem controle de tamanho/formato → quebra o layout dos cards
- Risco de hotlink / conteúdo impróprio
- Experiência ruim para usuário não técnico

## Solução proposta — Upload nativo seguro

Usar o **armazenamento da Lovable Cloud** (bucket dedicado) com upload direto pelo navegador, mantendo controle total e custo previsível.

### UX no formulário

```text
┌─────────────────────────────────────┐
│  Imagem da oferta                   │
│  ┌───────────────────────────────┐  │
│  │   [ ↑ Arraste ou clique ]     │  │
│  │   JPG/PNG/WebP até 5 MB       │  │
│  └───────────────────────────────┘  │
│  (após upload)                      │
│  ┌──────────┐                       │
│  │ preview  │  arquivo.jpg          │
│  │  120x120 │  [Trocar] [Remover]   │
│  └──────────┘                       │
└─────────────────────────────────────┘
```

- Drag-and-drop + clique para selecionar
- Preview imediato + barra de progresso
- Botões “Trocar” e “Remover”
- Validação client-side: tipo (jpg/png/webp), tamanho (≤ 5 MB)
- Compressão/redimensionamento automático no navegador para no máx **1200 px** de largura antes do upload (reduz custo e padroniza visual)
- Mensagens claras de erro ("arquivo muito grande", "formato não suportado")

### Segurança e organização do armazenamento

- Bucket `offer-images` **público para leitura** (imagens precisam aparecer no site sem auth)
- Caminho dos arquivos: `offer-images/{store_id}/{uuid}.{ext}`
- Políticas RLS no `storage.objects`:
  - **SELECT**: público (qualquer um pode ver a imagem)
  - **INSERT/UPDATE/DELETE**: somente o dono da loja (`store_id` na primeira pasta = loja do `auth.uid()`) ou admin
- Limpeza: ao trocar imagem ou apagar oferta, removemos o arquivo antigo do bucket (evita lixo acumulado)

### Controle de custo de armazenamento

- Compressão para 1200 px + qualidade 80% → tipicamente **~150-300 KB por imagem**
- Limite por arquivo: 5 MB no client, reforçado por política
- Limite implícito por plano (já existe `max_offers`): Básico 5, Destaque X, Plus X → teto natural de imagens por loja
- Trigger de delete: quando uma `offer` é apagada, removemos a imagem associada

### Mudanças técnicas

1. **Migração SQL**
   - Criar bucket `offer-images` (público)
   - 4 políticas RLS no `storage.objects` (select público, insert/update/delete pelo dono via path)
2. **`src/components/site/ImageUploader.tsx`** (novo)
   - Componente reutilizável com drag-drop, preview, progresso, validação, compressão (canvas API, sem libs novas)
   - Props: `value`, `onChange(url)`, `storeId`
3. **`src/pages/OfertaForm.tsx`**
   - Substituir o `<Input>` de URL pelo `<ImageUploader>`
   - Manter `image_url` no schema (continua sendo string), mas preenchido pelo uploader
   - Ao remover/trocar, deletar arquivo antigo do bucket
4. **`src/pages/LojaForm.tsx`** (bônus, opcional)
   - Aplicar o mesmo uploader para `logo_url` e `cover_url` da loja (mesma necessidade)

### O que o lojista ganha
- Não precisa saber hospedar imagem
- Imagens nunca somem
- Padrão visual consistente nos cards
- Upload em 1 clique no celular

### O que o admin ganha
- Tudo no mesmo lugar, sob políticas de acesso
- Custo previsível (compressão + limite por plano)
- Possível auditar/remover imagens impróprias direto no painel admin no futuro

Posso seguir com essa implementação?
# Gestão de Loja no Admin

Nova aba **"Gestão de Loja"** no Admin. Você escolhe o lojista em uma lista com busca (nome da loja, cidade, e-mail do dono) e abre uma ficha completa, editável, com tudo em um só lugar.

## O que aparece ao selecionar o lojista

1. **Identidade**: logo e capa (troca de imagem), nome, endereço da página, descrição.
2. **Contato e localização**: telefone, WhatsApp, Instagram, endereço, UF/Cidade com busca, ponto no mapa.
3. **Horário de funcionamento** (mesmo editor do lojista, com plantão).
4. **Status**: aprovada/pendente, selo de destaque, dias de teste grátis.
5. **Plano e assinatura**: plano atual, situação, validade; trocar plano manualmente (sem Stripe) ou estender validade.
6. **Dados sensíveis do dono**: nome completo, telefone, e-mail de acesso, papel (lojista/admin), opção de enviar link para redefinir senha. Mostrados mascarados até clicar em "Revelar".
7. **Resumo**: nº de ofertas, eventos, avaliações e FlyScore, com atalhos.

Cada bloco tem seu botão "Salvar" e pede confirmação nas alterações sensíveis (e-mail, papel, plano). Tudo fica registrado em um histórico (quem alterou, o quê, quando) visível no rodapé da ficha.

## Detalhes técnicos

- Componente `src/components/admin/AdminStoreManager.tsx` + aba em `Admin.tsx`; reutiliza `ImageUploader`, `LocationSelect`, `LocationPicker`, `OpeningHoursEditor`.
- `stores` e `subscriptions` já permitem edição pelo admin (RLS verificada). `profiles` hoje só permite leitura ao admin: migração adiciona política UPDATE para admin.
- Nova tabela `admin_audit_log` (admin_id, store_id, section, changes jsonb, created_at) com GRANT/RLS somente admin.
- Edge Function `admin-manage-user` (verifica papel admin no servidor) para: ler e-mail do dono, alterar e-mail, enviar redefinição de senha, alterar papéis. Nenhuma senha é exibida ou definida diretamente.
- Trim nos campos de texto, como no LojaForm.

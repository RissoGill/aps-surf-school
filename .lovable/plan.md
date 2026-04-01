
Objetivo: resolver definitivamente o “erro de permissão” ao criar pack no `/admin/payments`.

Diagnóstico confirmado:
- Nos logs da Edge Function `create-pack` aparece: **“Missing userId or role in request body”**.
- No frontend (`PaymentManagement.tsx`) o `userId` enviado está a ler `adminSession.userId || adminSession.adminId`, mas o login grava sessão como `{ id, email, role }` (não `userId/adminId`).
- Quando a função falha, o frontend faz fallback para insert direto em `packs`, que falha por RLS (`42501`), gerando exatamente o erro que está a ver.

Plano de implementação:
1) Ajustar o payload enviado para `create-pack` em `src/pages/admin/PaymentManagement.tsx`
- Ler sessão com fallback correto:
  - `userId`: `adminSession.id || adminSession.userId || adminSession.adminId || adminSession.email`
  - `role`: `adminSession.role || adminSession.admin_role || 'admin'`
- Se `userId` não existir, mostrar “sessão expirada” e redirecionar para `/login/administration` (sem tentar criar pack).

2) Remover o fallback de insert direto em `packs` no mesmo ficheiro
- Se a Edge Function responder erro, **não** tentar `.from('packs').insert(...)` no cliente.
- Mostrar erro real da função (auth/permissão/validação) em vez de erro RLS genérico.
- Isto elimina o falso “erro de permissão” quando o problema real é payload/sessão.

3) Tornar a Edge Function mais tolerante em `supabase/functions/create-pack/index.ts`
- Deixar `role` opcional na validação inicial.
- Exigir apenas `userId` e validar permissão no `users.admin_role` (fonte de verdade).
- Manter validações de `athleteId/planType/paymentDate/paymentId` e lógica de criação de pack como está.

4) Validação após alterações
- Testar criação de pack para A48 com sessão super_admin.
- Confirmar no log da função:
  - já não aparece “Missing userId or role in request body”
  - aparece “Pack created successfully”.
- Confirmar no UI:
  - sem toast de RLS
  - novo registo em `packs` com `payment_id` correto
  - `needsPackCreation` deixa de aparecer para esse pagamento.

Detalhes técnicos (resumo):
- Ficheiros a alterar:
  - `src/pages/admin/PaymentManagement.tsx`
  - `supabase/functions/create-pack/index.ts`
- Sem migrações de base de dados.
- Sem alteração de políticas RLS; a escrita continua a ser feita via Edge Function (service role) com validação de admin no backend.

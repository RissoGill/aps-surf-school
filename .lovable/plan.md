

# Plano: Correção de Presenças para Treinador T01

## Diagnóstico

O erro "Edge Function returned a non-2xx status code" acontece porque:

1. **Políticas RLS atualizadas** - As políticas de INSERT na tabela `attendance` agora exigem `auth.uid()` correspondente ao `auth_uid` do treinador. Mas a autenticação legacy (localStorage) não define `auth.uid()`, que retorna `NULL`.

2. **Versão publicada desatualizada** - O código do **preview** já envia `role: 'coach', userId: coachId` para a Edge Function (corrigido recentemente). Contudo, o **site publicado** (apsportugal.lovable.app) pode ainda ter uma versão anterior onde este parâmetro não é enviado, causando resposta 401.

3. **Fluxo atual no site publicado**:
   ```text
   Coach tenta marcar presença
         ↓
   INSERT direto → Falha (RLS: auth.uid() = NULL)
         ↓
   Fallback para Edge Function sem role/userId
         ↓
   Edge Function retorna 401 → "non-2xx status code"
   ```

---

## Solução

### Ação Imediata (Recomendada)

**Publicar a versão atual do projeto** para que o site apsportugal.lovable.app receba as correções que já funcionam no preview.

No Lovable, basta clicar no botão "Publish" no canto superior direito para publicar a versão atual.

### Verificação Alternativa

Se após publicar o problema persistir, será necessário:

1. **Adicionar política RLS para inserção anónima** (temporária, menos segura):
   - Permitir INSERT na tabela `attendance` para utilizadores anónimos
   - Isto só deve ser feito como último recurso

2. **Forçar uso da Edge Function para todos os INSERTs**:
   - Modificar o código para sempre usar a Edge Function
   - Garantir que a autenticação legacy é sempre validada server-side

---

## Secção Técnica

### Fluxo Correto (após publicação)

```text
Coach tenta marcar presença
      ↓
INSERT direto → Falha (RLS esperado)
      ↓
Fallback para Edge Function COM role='coach', userId='T01'
      ↓
Edge Function valida treinador na BD → Sucesso
```

### Código já corrigido no preview

```typescript
// BulkAttendanceRegistration.tsx linha 217-218
const { data, error } = await supabase.functions.invoke('attendance-admin', {
  body: { ...record, role: 'coach', userId: coachId },
});
```

### Comparação Preview vs Publicado

| Aspeto | Preview | Publicado |
|--------|---------|-----------|
| Payload Edge Function | `{...record, role:'coach', userId:'T01'}` | `{...record}` (sem auth) |
| INSERT direto | Falha (RLS) | Falha (RLS) |
| Fallback Edge Function | Sucesso (200) | Falha (401) |

---

## Passos para Resolver

1. **Publicar o projeto agora** (botão Publish no Lovable)
2. O treinador T01 deve atualizar a página (hard refresh: Ctrl+Shift+R ou limpar cache)
3. Testar novamente o registo de presenças em lote

Se após estes passos o erro persistir, podemos investigar outras causas como cache no browser do treinador.


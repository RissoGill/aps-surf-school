
# Corrigir Erro "Expected number, received nan" na Mensalidade

## Problema

Ao editar o valor da mensalidade (amount_due) ou o valor pago (amount_paid) no painel de gestão de pagamentos, o sistema mostra o erro:

> "Erro de Validação: Expected number, received nan"

### Causa Raiz

No ficheiro `src/pages/admin/PaymentManagement.tsx`, linha 444-446, o código converte os valores do formulário usando `parseFloat()` diretamente:

```typescript
const validated = paymentEditSchema.parse({
  amount_due: parseFloat(editForm.amount_due),   // ← PROBLEMA
  amount_paid: parseFloat(editForm.amount_paid), // ← PROBLEMA
  ...
});
```

O `parseFloat()` do JavaScript retorna `NaN` (Not a Number) em dois casos comuns:
1. **Campo vazio** - `parseFloat("")` retorna `NaN`
2. **Separador decimal de vírgula** - Em Portugal usa-se vírgula como separador decimal (ex: `"120,50"`), mas `parseFloat("120,50")` só lê `120` e ignora o resto - em casos mais extremos retorna `NaN`

O Zod valida que o valor seja um número válido (`z.number()`), e como recebe `NaN`, mostra o erro "Expected number, received nan".

## Solução

Substituir o `parseFloat()` puro por uma função de parsing mais robusta que:
1. Trata campos vazios como `0` (sem erro de validação)
2. Aceita tanto vírgula como ponto como separador decimal (suporte ao formato português)
3. Remove símbolos de moeda ou espaços acidentais

### Ficheiro a Alterar

**`src/pages/admin/PaymentManagement.tsx`** - Função `handleEditSave`:

Adicionar no topo do componente uma função auxiliar:
```typescript
const parseAmount = (value: string): number => {
  if (!value || value.trim() === "") return 0;
  // Replace comma decimal separator with dot (Portuguese format)
  const normalized = value.trim().replace(",", ".");
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
};
```

Atualizar a chamada do `paymentEditSchema.parse()`:
```typescript
const validated = paymentEditSchema.parse({
  amount_due: parseAmount(editForm.amount_due),
  amount_paid: parseAmount(editForm.amount_paid),
  payment_date: editForm.payment_date || null,
  plan_type: editForm.plan_type || null,
  notes: editForm.notes || null
});
```

## Resumo das Alterações

- 1 ficheiro alterado: `src/pages/admin/PaymentManagement.tsx`
- Adicionar função `parseAmount` para parsing robusto de valores monetários
- Substituir `parseFloat()` por `parseAmount()` nas duas linhas problemáticas
- Sem alterações de base de dados nem de outros ficheiros

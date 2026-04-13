

# Fix: Relatório Mensal Completo não lê receitas

## Problema
A query de payments no `generateCompleteReport` filtra por `status IN ('paid', 'partial')` em minúsculas, mas a base de dados guarda `"Paid"` e `"Partial"` com maiúscula. O filtro `.in()` do Supabase é case-sensitive, logo retorna 0 resultados.

## Correção em `src/components/admin/ExpenseReportsCard.tsx`

Linha 150 -- alterar o filtro de status:
```tsx
// De:
.in('status', ['paid', 'partial'])

// Para:
.in('status', ['Paid', 'Partial', 'paid', 'partial'])
```

Isto cobre ambos os formatos e garante compatibilidade. Alternativa: usar a mesma abordagem do dashboard (buscar todos e filtrar no cliente com `.toLowerCase()`), mas incluir ambos os valores no `.in()` é mais simples e eficiente.

Também corrigir o mesmo filtro no gráfico anual em `AccountingManagement.tsx` se aplicável.

## Secção Técnica
- Ficheiro: `src/components/admin/ExpenseReportsCard.tsx`, linha ~150
- Verificar também `AccountingManagement.tsx` (gráfico anual) para o mesmo problema


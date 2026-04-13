

# Corrigir Cálculo de Despesas do Mês Corrente

## Problema
O cartão "Despesas Mês Corrente" está a calcular com base na `expense_date` (data da despesa), mas o utilizador quer que some todas as despesas que foram **registadas/entradas** no mês atual (usando `created_at`).

## Alteração

### `src/pages/admin/AccountingManagement.tsx`
1. Adicionar `created_at` à query de despesas (linha 46)
2. Alterar o filtro das despesas do mês corrente para usar `created_at` em vez de `expense_date` (linhas 55-58)
3. Usar `(allExpenses || [])` como base do filtro em vez de `expensesSinceSept` para incluir todas as despesas registadas no mês, independentemente da data da despesa


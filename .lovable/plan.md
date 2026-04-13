

# Fix: Current Month Expenses card counting retroactive entries

## Problem
The "Despesas Mês Corrente" summary card in `AccountingManagement.tsx` filters expenses by `created_at` (line 56-58). When recurring expenses were generated retroactively (all created today but with `expense_date` ranging from Sept 2025 to April 2026), all 16 entries count as "current month expenses" — inflating the total.

## Solution
Change the "Current Month Expenses" card to use `expense_date` instead of `created_at` for filtering. This way only expenses with `expense_date` in April 2026 are counted.

### Change in `src/pages/admin/AccountingManagement.tsx` (lines 55-59)

Replace:
```tsx
const expensesCurrentMonth = (allExpenses || []).filter((e: any) => {
  const createdAt = new Date(e.created_at);
  return createdAt.getFullYear() === currentYear && createdAt.getMonth() + 1 === currentMonth;
});
```

With:
```tsx
const expensesCurrentMonth = (allExpenses || []).filter((e: any) => {
  const d = new Date(e.expense_date);
  return d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth;
});
```

This aligns the summary card with the same logic used in the ExpensesCard header, and correctly shows only April 2026 expenses (€15.60) instead of all retroactively-created entries.


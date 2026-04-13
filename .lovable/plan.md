

# Incluir Salários (Coach Payments) no Gráfico Anual e Relatório Mensal Completo

## Contexto
Os `coach_payments` são os salários dos treinadores. Devem ser incluídos como despesas (categoria "Salários") tanto no gráfico anual como no relatório mensal completo e nos cartões de resumo.

## Alterações

### 1. Gráfico Anual e Cartões de Resumo (`AccountingManagement.tsx`)

**Query `annual-chart-data`:** Adicionar fetch de `coach_payments` com `payment_date` entre 2025-09-01 e 2026-08-31. No cálculo mensal de despesas, somar `expenses + coach_payments` (por `payment_date`).

**Query `accounting-stats`:** Incluir `coach_payments` nos totais de `totalExpensesSinceSept` e `totalExpensesCurrentMonth`, atualizando automaticamente o `monthlyBalance`.

### 2. Relatório Mensal Completo (`ExpenseReportsCard.tsx`)

**Na função `generateCompleteReport`:**
- Buscar `coach_payments` do mês (por `payment_date`) e `coach` para mapear nomes
- Somar ao `totalExpenses` para o balanço correto
- Adicionar secção "Salários (Treinadores)" no HTML com tabela: Treinador, Data, Valor, Notas
- O resumo mostra: Despesas Operacionais + Salários separadamente, e o total combinado

### 3. Secção Técnica

```tsx
// AccountingManagement.tsx - query adicional no annual-chart-data
supabase.from('coach_payments').select('amount, payment_date')
  .gte('payment_date', '2025-09-01').lte('payment_date', '2026-08-31')

// No cálculo por mês do gráfico:
const coachTotal = coachPayments
  .filter(cp => { const d = new Date(cp.payment_date); return d.getFullYear() === sm.year && d.getMonth() + 1 === sm.month; })
  .reduce((s, cp) => s + Number(cp.amount || 0), 0);
// expenses no gráfico = expTotal + coachTotal

// accounting-stats: mesmo padrão para totalExpensesSinceSept e totalExpensesCurrentMonth

// ExpenseReportsCard.tsx - no generateCompleteReport:
const [expensesRes, paymentsRes, athletesRes, coachPaymentsRes, coachesRes] = await Promise.all([
  /* existentes */,
  supabase.from('coach_payments').select('*').gte('payment_date', startDate).lte('payment_date', endDate),
  supabase.from('coach').select('coach_id, first_name, last_name'),
]);

const totalCoachPayments = coachPayments.reduce((s, cp) => s + Number(cp.amount || 0), 0);
const totalAllExpenses = totalExpenses + totalCoachPayments;
const balance = totalIncome - totalAllExpenses;
```

Ficheiros a alterar:
- `src/pages/admin/AccountingManagement.tsx`
- `src/components/admin/ExpenseReportsCard.tsx`


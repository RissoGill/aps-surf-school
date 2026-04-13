

# Adicionar Relatório Mensal Completo (Income + Despesas)

## Resumo
Adicionar uma nova opção de tipo de relatório no `ExpenseReportsCard`: além do relatório atual filtrado por categoria, incluir a opção "Relatório Mensal Completo" que mostra receitas (payments) e despesas lado a lado, com resumo e balanço.

## Alterações em `src/components/admin/ExpenseReportsCard.tsx`

### 1. Novo estado `reportType`
- Select com duas opções: "Despesas por Categoria" (atual) e "Relatório Mensal Completo"
- Quando "Completo" está selecionado, esconder os filtros de categoria/subcategoria

### 2. Nova lógica `generateCompleteReport`
- Buscar `expenses` do mês selecionado (já existe)
- Buscar `payments` do mês selecionado com `status = 'paid'` ou `'partial'`, filtrando por `month` (nome em inglês) e `year`
- Mapear mês numérico para nome inglês (January, February...) para corresponder ao campo `month` da tabela payments

### 3. HTML do relatório completo
- **Secção Resumo**: Total Receitas, Total Despesas, Balanço (receitas - despesas) com cor verde/vermelho
- **Tabela Receitas**: Atleta, Mês, Valor Pago, Status
- **Tabela Despesas**: Data, Fornecedor, Categoria, Valor (reutiliza a existente)
- Mesmo estilo visual (#31A896, logo APS, footer)

### 4. Traduções
- `expenses.reports.reportType` / `expenses.reports.expensesByCategory` / `expenses.reports.completeMonthly`
- `expenses.reports.income` / `expenses.reports.balance`

## Secção Técnica

```tsx
// Novo estado
const [reportType, setReportType] = useState<"expenses" | "complete">("expenses");

// Query payments para relatório completo
const monthNames = ["January", "February", ...];
const { data: payments } = await supabase
  .from('payments').select('*')
  .eq('month', monthNames[viewMonth - 1])
  .eq('year', viewYear)
  .in('status', ['paid', 'partial']);

// Resumo no HTML
const totalIncome = payments.reduce((s, p) => s + Number(p.amount_paid || 0), 0);
const balance = totalIncome - totalExpenses;
```

O Select de tipo de relatório fica acima dos seletores de mês/ano. Os filtros de categoria só aparecem quando `reportType === "expenses"`.


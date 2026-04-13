

# Nova Página "Contabilidade"

## Resumo
Criar uma nova página `/admin/accounting` com cartões de resumo financeiro (despesas e receitas) no topo e o componente completo de registo de despesas por baixo. No dashboard principal, substituir o cartão `ExpensesCard` por um cartão de navegação para esta nova página (igual ao padrão de Gestão Diária e Receitas).

## Layout da Página

```text
┌─────────────────┬──────────────────┐
│ Total Despesas   │ Despesas Mês     │
│ desde Set 2025   │ Corrente         │
├─────────────────┼──────────────────┤
│ Total Recebido   │ Diferença        │
│ Mês Corrente     │ (Recebido-Pago)  │
└─────────────────┴──────────────────┘
┌────────────────────────────────────┐
│ ExpensesCard (registo despesas)    │
│ (componente completo existente)    │
└────────────────────────────────────┘
```

## Alterações

### 1. Criar `src/pages/admin/AccountingManagement.tsx`
- `AppHeader` com título "Contabilidade" e botão voltar para `/dashboard/administration`
- Query para despesas (`expenses` table) filtrando desde Setembro 2025 e mês corrente
- Query para receitas do mês corrente (reutilizar lógica de `RevenueManagement` - `totalReceivedThisMonth`)
- 4 cartões pequenos em grid 2x2:
  - Total Despesas desde Setembro 2025
  - Despesas Mês Corrente
  - Total Recebido Mês Corrente
  - Diferença (Recebido - Despesas mês corrente)
- Componente `ExpensesCard` por baixo

### 2. Editar `src/pages/admin/AdministrationDashboard.tsx`
- Remover o bloco `<ExpensesCard />` (linhas 796-799)
- Substituir por cartão de navegação clicável para `/admin/accounting` com `ArrowRight` (mesmo padrão dos outros)
- Remover import de `ExpensesCard`

### 3. Editar `src/App.tsx`
- Adicionar rota `/admin/accounting` → `AccountingManagement`

### 4. Traduções (`en.json` e `pt.json`)
- Adicionar chaves:
  - `admin.management.accounting`: "Contabilidade" / "Accounting"
  - `admin.stats.totalExpensesSept`: "Total Despesas desde Set" / "Total Expenses since Sep"
  - `admin.stats.expensesCurrentMonth`: "Despesas Mês Corrente" / "Expenses Current Month"
  - `admin.stats.monthlyBalance`: "Balanço Mensal" / "Monthly Balance"


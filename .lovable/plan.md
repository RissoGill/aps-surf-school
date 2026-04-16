

## Plano: Mover CoachPaymentsCard para a página de Contabilidade

Mover o componente `CoachPaymentsCard` de `RevenueManagement.tsx` para `AccountingManagement.tsx`, posicionando-o depois do `ExpensesCard` e antes do `ExpenseReportsCard`.

### Alterações

**1. `src/pages/admin/AccountingManagement.tsx`**
- Importar `CoachPaymentsCard`
- Obter `userRole` do `adminSession` no localStorage (já existe lógica de parsing)
- Inserir `<CoachPaymentsCard userRole={userRole} />` entre `<ExpensesCard />` e `<ExpenseReportsCard />`

**2. `src/pages/admin/RevenueManagement.tsx`**
- Remover o import de `CoachPaymentsCard`
- Remover `<CoachPaymentsCard userRole={userRole} />` (linha 325)


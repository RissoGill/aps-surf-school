

# Despesas com Total do Mês e Lista Colapsável

## Resumo
Modificar o `ExpensesCard` para mostrar o total de despesas do mês corrente no cabeçalho do cartão e tornar a tabela de despesas colapsável (fechada por defeito), para que com muitas despesas a página fique limpa.

## Layout

```text
┌────────────────────────────────────┐
│ 📄 Registo de Despesas    [+ Nova] │
│ Total Mês Corrente: €XXX.XX        │
│ ▶ Ver despesas (colapsável)        │
│   ┌──────────────────────────────┐ │
│   │ Tabela de despesas           │ │
│   └──────────────────────────────┘ │
└────────────────────────────────────┘
```

## Alterações

### 1. Editar `src/components/admin/ExpensesCard.tsx`
- Calcular `totalCurrentMonth` filtrando despesas pelo mês/ano corrente (usando `expense_date`)
- Substituir o total geral existente (linha 444-446) pelo total do mês corrente
- Envolver a tabela de despesas num `Collapsible` (importar de `@/components/ui/collapsible`)
- `CollapsibleTrigger` com texto "Ver despesas" / ícone ChevronDown
- `CollapsibleContent` contém a tabela existente
- Estado `open` começa `false` (colapsado por defeito)

### 2. Traduções (`en.json` e `pt.json`)
- Adicionar chave `expenses.viewExpenses`: "Ver despesas" / "View expenses"
- Adicionar chave `expenses.totalCurrentMonth`: "Total Mês Corrente" / "Total Current Month"


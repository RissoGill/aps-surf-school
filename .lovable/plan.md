

# Adicionar Filtro de Mês à Lista de Despesas

## Resumo
A lista de despesas mostra todas as entradas desde Setembro 2025, tornando-a demasiado longa. Vamos adicionar um seletor de mês/ano para filtrar as despesas exibidas na tabela.

## Alterações em `src/components/admin/ExpensesCard.tsx`

### 1. Novo estado para mês/ano selecionado
- Adicionar `viewMonth` e `viewYear` (default: mês e ano atuais)

### 2. Seletor de mês acima da tabela
- Dois `<Select>`: um para o mês (Janeiro–Dezembro), outro para o ano (2025, 2026)
- Substituir a linha estática "Total mês corrente" pelo total do mês selecionado

### 3. Filtrar despesas pela seleção
- Criar `filteredExpenses` com `useMemo` filtrando por `viewMonth`/`viewYear` usando `expense_date`
- Usar `filteredExpenses` no `.map()` da tabela (linha 631) e no contador (linha 611)
- Mostrar o total do mês selecionado em vez do mês corrente fixo

### 4. Traduções
- `expenses.selectMonth` / `expenses.selectYear` em `pt.json` e `en.json`

## Secção Técnica

```tsx
// Novo estado
const [viewMonth, setViewMonth] = useState(new Date().getMonth() + 1);
const [viewYear, setViewYear] = useState(new Date().getFullYear());

// Filtro
const filteredExpenses = useMemo(() => 
  expenses.filter(e => {
    const d = new Date(e.expense_date);
    return d.getFullYear() === viewYear && d.getMonth() + 1 === viewMonth;
  }), [expenses, viewMonth, viewYear]);

// Total do mês selecionado
const totalSelectedMonth = useMemo(() => 
  filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
  [filteredExpenses]);
```

Os seletores ficam entre o botão "Ver Despesas" e a tabela, dentro do `CollapsibleContent`.


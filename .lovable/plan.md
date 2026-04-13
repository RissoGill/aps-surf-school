

# Gráfico Anual Receitas vs Despesas (Setembro 2025 - Agosto 2026)

## Resumo
Adicionar um gráfico de barras entre os 4 cartões de resumo e o ExpensesCard, mostrando receitas (payments) e despesas (expenses) mês a mês para a época 2025-2026.

## Alterações

### 1. Nova query `annual-chart-data` em `AccountingManagement.tsx`
- Buscar todas as `expenses` com `expense_date` entre 2025-09-01 e 2026-08-31
- Buscar todos os `payments` dos anos 2025 e 2026 com status paid/partial
- Agrupar por mês: Set, Out, Nov, Dez, Jan, Fev, Mar, Abr, Mai, Jun, Jul, Ago
- Calcular por mês: total receitas, total despesas, balanço

### 2. Componente do gráfico (inline em AccountingManagement ou novo componente)
- Usar `recharts` (BarChart) com o `ChartContainer` existente do shadcn
- 2 barras por mês: Receitas (cor primary/#31A896) e Despesas (cor destructive/vermelho)
- Tooltip com valores em €
- Legenda
- Título: "Época 2025-2026"
- Renderizar entre os stats cards e o ExpensesCard

### 3. Traduções
- `admin.chart.seasonTitle`: "Época 2025-2026" / "Season 2025-2026"
- `admin.chart.revenue`: "Receitas" / "Revenue"  
- `admin.chart.expenses`: "Despesas" / "Expenses"

## Secção Técnica

**Dados do gráfico:**
```tsx
const seasonMonths = [
  { month: 9, year: 2025, label: "Set" },
  { month: 10, year: 2025, label: "Out" },
  // ... até
  { month: 8, year: 2026, label: "Ago" },
];

// Para cada mês: somar expenses por expense_date e payments por month+year+status
```

**Gráfico (recharts + ChartContainer shadcn):**
```tsx
<ChartContainer config={chartConfig}>
  <BarChart data={chartData}>
    <CartesianGrid vertical={false} />
    <XAxis dataKey="label" />
    <YAxis />
    <ChartTooltip content={<ChartTooltipContent />} />
    <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
    <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
  </BarChart>
</ChartContainer>
```

**Posição:** Entre `</div>` dos stats cards (linha 156) e `<ExpensesCard />` (linha 159).


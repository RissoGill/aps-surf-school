

# Remover Bold dos Títulos Colapsáveis

## Problema
O `CardTitle` aplica `text-2xl font-bold` por defeito (via `card.tsx`). A classe `text-lg` sobrepõe o tamanho mas não remove o bold.

## Alteração

### `src/pages/admin/AdministrationDashboard.tsx`
Adicionar `font-normal` à className dos dois `CardTitle`:

- Linha 815: `<CardTitle className="text-lg font-normal">` (dailyManagement)
- Linha 882: `<CardTitle className="text-lg font-normal">` (revenueManagement)

Isto mantém o mesmo tamanho (`text-lg`) que "Relatórios" e "Despesas" mas sem bold.


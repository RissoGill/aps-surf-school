

# Adicionar Data de Fim às Despesas Recorrentes

## Objetivo
Permitir definir um intervalo de meses (de X a Y) para cada despesa recorrente, em vez de gerar indefinidamente até ao mês atual.

## Alterações

### 1. Migration: adicionar coluna `end_date` à tabela `recurring_expenses`
```sql
ALTER TABLE recurring_expenses ADD COLUMN end_date date DEFAULT NULL;
```
Quando `end_date` é `NULL`, a despesa gera indefinidamente (comportamento atual). Quando definida, para de gerar após esse mês.

### 2. Edge Function `generate-recurring-expenses/index.ts`
No loop de meses, adicionar verificação: se `rec.end_date` existe, não gerar despesas para meses após essa data (comparar `y-m` com o ano/mês de `end_date`).

### 3. Frontend `ExpensesCard.tsx`
- Novo estado `recEndDate` (Date | null, default null)
- Checkbox/toggle "Definir data de fim" que mostra/esconde o date picker de fim
- Passar `end_date` nas mutations de create e update
- Resetar `recEndDate` no `resetRecurringForm`
- Carregar `end_date` no `handleEditRecurring`
- Na tabela de listagem, mostrar coluna "Período" com formato "Set 2025 → Jun 2026" ou "Set 2025 → ∞"

### 4. Traduções (`pt.json` e `en.json`)
- `expenses.endDate`: "Data de Fim" / "End Date"
- `expenses.indefinite`: "Indefinido" / "Indefinite"
- `expenses.setEndDate`: "Definir data de fim" / "Set end date"
- `expenses.period`: "Período" / "Period"

## Detalhe técnico
- A coluna `end_date` é nullable (NULL = sem fim)
- O edge function compara: `if (rec.end_date) { const [eY, eM] = rec.end_date.split('-').map(Number); if (y > eY || (y === eY && m > eM)) break; }`
- No formulário, o date picker de fim aparece apenas quando o checkbox está ativo
- A coluna "Data Início" na tabela passa a "Período" mostrando ambas as datas

5 ficheiros a editar: migration SQL, `generate-recurring-expenses/index.ts`, `ExpensesCard.tsx`, `pt.json`, `en.json`.


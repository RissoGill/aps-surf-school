

# Adicionar Data de Início às Despesas Recorrentes

## Problema
Atualmente todas as despesas recorrentes são geradas desde Setembro 2025, independentemente de quando devem começar. O utilizador quer escolher uma data específica por cada template recorrente, para que só gere a partir desse mês e com o dia correto.

## Alterações

### 1. Migração — Nova coluna `start_date` na tabela `recurring_expenses`
- Adicionar coluna `start_date` (type `date`, nullable, default `'2025-09-01'`)
- As entradas existentes ficam com `2025-09-01` por defeito

### 2. UI — Date picker no formulário de recorrentes (`ExpensesCard.tsx`)
- Adicionar estado `recStartDate` (Date)
- Adicionar um date picker (Popover + Calendar) no formulário "Adicionar/Editar Recorrente"
- Passar `start_date` nas mutations de criar e editar
- Mostrar a data na tabela de recorrentes (nova coluna "Início")
- Preencher o campo ao editar (`handleEditRecurring`)

### 3. Edge Function — Usar `start_date` de cada template
- Em vez de usar o `from_date` global do request para todos os templates, usar `rec.start_date` de cada template individual
- Para cada template, gerar entradas apenas a partir do seu `start_date` até ao mês atual
- Manter o `from_date` do request como fallback (se `start_date` não existir, usa `from_date` ou `2025-09-01`)
- O dia do `expense_date` gerado será o dia do `start_date` (ex: se start_date é `2025-09-15`, gera no dia 15 de cada mês)

### 4. Traduções
- `expenses.startDate`: "Data Início" / "Start Date"

## Secção Técnica

**Migração SQL:**
```sql
ALTER TABLE recurring_expenses 
ADD COLUMN start_date date DEFAULT '2025-09-01';
```

**Edge Function — lógica por template:**
```typescript
for (const rec of recurring) {
  const startDate = rec.start_date || fromDate || "2025-09-01";
  const [sY, sM, sD] = startDate.split("-").map(Number);
  // Iterar meses desde sY/sM até agora
  // Usar sD como dia do expense_date (com clamp ao último dia do mês)
}
```

**UI — DatePicker no formulário:**
- Usa Popover + Calendar (padrão Shadcn) com `pointer-events-auto`
- Label: "Data Início"


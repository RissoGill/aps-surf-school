

# Despesas Recorrentes: Retroativo desde Set 2025 + Editar/Eliminar

## Resumo
Modificar o botão "Gerar Agora" para gerar despesas recorrentes retroativamente desde Setembro 2025 até ao mês atual (em vez de apenas o mês corrente). Adicionar botão de editar nas despesas recorrentes existentes.

## Alterações

### 1. Edge Function `generate-recurring-expenses/index.ts`
- Aceitar parâmetro opcional `from_date` no body do request (default: mês atual)
- Quando chamado com `from_date: "2025-09-01"`, iterar por todos os meses desde Set 2025 até ao mês atual, gerando uma entrada por mês para cada template ativo (com verificação de duplicados)

### 2. UI - Botão "Gerar Agora" (`ExpensesCard.tsx`)
- Passar `{ from_date: "2025-09-01" }` no body da invocação da Edge Function, para que gere retroativamente todos os meses em falta

### 3. UI - Editar Despesa Recorrente (`ExpensesCard.tsx`)
- Adicionar botão de edição (ícone Pencil) ao lado do botão de eliminar na tabela de recorrentes
- Ao clicar, preencher o formulário "Adicionar Recorrente" com os valores existentes e mudar o botão para "Guardar"
- Criar mutation `updateRecurringMutation` que faz `supabase.from("recurring_expenses").update(...)` 
- A eliminação já existe (botão Trash2 na linha 846)

### 4. Traduções (`pt.json` / `en.json`)
- `expenses.editRecurring`: "Editar Recorrente" / "Edit Recurring"
- `expenses.saveRecurring`: "Guardar" / "Save"

## Secção Técnica
- A Edge Function itera meses: loop de Set 2025 até `now()`, incrementando mês a mês
- Para cada mês + cada template, verifica duplicado antes de inserir
- O estado de edição usa um `editingRecurringId` para distinguir entre criar e atualizar


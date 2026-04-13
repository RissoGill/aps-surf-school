

# Adicionar edição de despesas existentes

## Contexto
Atualmente as despesas só podem ser criadas e eliminadas. O utilizador quer poder editar todos os campos (nome, data, valor, factura).

## Alteração

### `src/components/admin/ExpensesCard.tsx`

1. Adicionar estado `editingExpense` para a despesa em edição e estados de formulário de edição (`editName`, `editDate`, `editAmount`, `editFile`)

2. Adicionar um botão de edição (ícone Pencil) em cada linha da tabela, ao lado do botão de eliminar

3. Criar um novo `Dialog` de edição (semelhante ao de criação) com:
   - Campo Nome (input text, pré-preenchido)
   - Campo Data (datepicker, pré-preenchido)
   - Campo Valor (input number, pré-preenchido)
   - Opção de substituir factura (scan ou upload, igual ao formulário de criação)
   - Se já existe factura, mostrar link para a atual

4. Criar `updateMutation` que faz `supabase.from("expenses").update({...}).eq("id", id)`:
   - Se um novo ficheiro foi escolhido, faz upload ao storage e actualiza `invoice_url`
   - Se não, mantém o `invoice_url` existente

### Traduções (`pt.json` e `en.json`)
- `"expenses.edit"`: "Editar Despesa" / "Edit Expense"
- `"expenses.updated"`: "Despesa atualizada" / "Expense updated"
- `"expenses.save"`: "Guardar" / "Save"
- `"expenses.currentInvoice"`: "Factura atual" / "Current invoice"




# Adicionar campo de Categoria nas Despesas

## Resumo
Criar um dropdown de categoria a seguir ao campo "Fornecedor" no formulário de despesas, com as opções pedidas.

## Alterações

### 1. Migração Supabase
Adicionar coluna `category` (text, nullable) à tabela `expenses`.

### 2. `src/components/admin/ExpensesCard.tsx`
- Adicionar estado `category` e `editCategory` para os formulários de criação e edição
- Adicionar um `Select` dropdown após o campo Fornecedor com as opções:
  Despesas Bancárias, Salários, Leasing, Portagens, Carrinhas, Impostos, Comunicações, Contabilidade, Compras Fornecedores, Material Técnico, Seguros, Despesas Legais, Licenças, Devolução Sócios, Custos Campeonatos, Outros
- Incluir `category` no `createMutation` e `updateMutation`
- Adicionar coluna "Categoria" na tabela de listagem
- Atualizar interface `Expense` com `category: string | null`

### 3. Traduções (`pt.json` e `en.json`)
- `expenses.category`: "Categoria" / "Category"
- `expenses.categoryPlaceholder`: "Selecionar categoria" / "Select category"
- Chaves para cada opção do dropdown

### 4. Tipos (`types.ts`)
Regenerados automaticamente com a nova coluna, ou adicionados manualmente.




# Adicionar Subcategorias nas Despesas

## Resumo
Criar um segundo dropdown de subcategoria que aparece condicionalmente consoante a categoria selecionada. Para "Despesas Bancárias" mostra opções específicas bancárias; para "Salários" mostra nomes de colaboradores com opção "Outro" que permite introduzir um nome personalizado.

## Alterações

### 1. Migração Supabase
Adicionar coluna `subcategory` (text, nullable) à tabela `expenses`.

### 2. `src/components/admin/ExpensesCard.tsx`

- Definir mapa de subcategorias:
  - **Despesas Bancárias**: Manutenção, Imposto de Selo, Avales e Garantias, Juros
  - **Salários**: Nuno Telmo, David, Danilo, Gustavo, Aaron, Zé Pinho, Outro
- Adicionar estados `subcategory`, `editSubcategory`, `customSubcategory`, `editCustomSubcategory`
- Quando a categoria muda, limpar a subcategoria
- Mostrar o dropdown de subcategoria apenas quando a categoria tem subcategorias definidas
- Se "Outro" selecionado (em Salários), mostrar input de texto para nome personalizado
- Incluir `subcategory` nos `createMutation` e `updateMutation` (guardar o nome custom se "Outro")
- Adicionar coluna "Subcategoria" na tabela de listagem
- Atualizar interface `Expense` com `subcategory: string | null`

### 3. Traduções (`pt.json` e `en.json`)
- `expenses.subcategory`: "Subcategoria" / "Subcategory"
- `expenses.subcategoryPlaceholder`: "Selecionar subcategoria" / "Select subcategory"
- `expenses.customName`: "Nome" / "Name"

### 4. Tipos (`types.ts`)
Atualizar com a nova coluna `subcategory`.


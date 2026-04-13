

# Adicionar Sub-subcategoria para "Carrinhas"

## Resumo
Para a categoria "Carrinhas", o primeiro dropdown de subcategoria mostrará as matrículas dos veículos (85-QD-72, 85-QD-73, 21-XA-53, 21-XA-61, 26-DB-02). Depois, aparecerá um segundo dropdown (sub-subcategoria) com os tipos de despesa: Gasóleo, Oficinas, AdBlue, Leasing, IUC, Seguros, Multas.

## Alterações

### 1. Migração Supabase
Adicionar coluna `sub_subcategory` (text, nullable) à tabela `expenses`.

### 2. `src/components/admin/ExpensesCard.tsx`

- Adicionar "Carrinhas" ao mapa `SUBCATEGORIES` com as matrículas: `["85-QD-72", "85-QD-73", "21-XA-53", "21-XA-61", "26-DB-02"]`
- Criar novo mapa `SUB_SUBCATEGORIES` para categorias que têm um terceiro nível:
  ```
  "Carrinhas": ["Gasóleo", "Oficinas", "AdBlue", "Leasing", "IUC", "Seguros", "Multas"]
  ```
- Adicionar estados `subSubcategory` e `editSubSubcategory`
- No formulário de criação e edição, após o dropdown de subcategoria, mostrar condicionalmente o terceiro dropdown quando `SUB_SUBCATEGORIES[category]` existe e uma subcategoria está selecionada
- Incluir `sub_subcategory` nos mutations de criação e atualização
- Adicionar coluna "Sub-subcategoria" na tabela de listagem
- Atualizar interface `Expense` com `sub_subcategory: string | null`
- Limpar `subSubcategory` quando a subcategoria muda

### 3. Traduções (`pt.json` e `en.json`)
- `expenses.subSubcategory`: "Tipo de Despesa" / "Expense Type"
- `expenses.subSubcategoryPlaceholder`: "Selecionar tipo" / "Select type"

### 4. Tipos (`types.ts`)
Atualizar automaticamente com a nova coluna.


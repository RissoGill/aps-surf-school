

# Adicionar Descrição para "Custos Campeonatos"

## Resumo
Quando a categoria "Custos Campeonatos" for selecionada, mostrar um campo de texto livre para o utilizador escrever a descrição do custo. O valor será guardado na coluna `subcategory` já existente.

## Alterações

### `src/components/admin/ExpensesCard.tsx`

1. Adicionar lógica para mostrar um `Input` de texto livre quando a categoria é "Custos Campeonatos" (sem dropdown, apenas campo de descrição)
2. Tratar este caso especial: quando `category === "Custos Campeonatos"`, mostrar um campo `Input` em vez de `Select`, guardando o valor em `subcategory`
3. Aplicar a mesma lógica no formulário de edição

A abordagem mais simples: definir uma constante `FREETEXT_SUBCATEGORIES` (ex: `["Custos Campeonatos"]`) que indica categorias onde a subcategoria é texto livre em vez de dropdown.

### Traduções (`pt.json` e `en.json`)
- `expenses.descriptionPlaceholder`: "Descrição do campeonato" / "Championship description"


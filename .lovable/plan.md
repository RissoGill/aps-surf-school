

# Alterar label "Descrição" para "Fornecedor" nas despesas

## Alteração

Atualizar as traduções do campo `expenses.name` e `expenses.namePlaceholder`:

### `src/i18n/translations/pt.json` (linha 1575-1576)
- `"name"`: "Descrição" → "Fornecedor"
- `"namePlaceholder"`: "Ex: Material de surf" → "Ex: Decathlon"

### `src/i18n/translations/en.json` (linha 1575-1576)
- `"name"`: "Description" → "Supplier"
- `"namePlaceholder"`: "E.g.: Surf equipment" → "E.g.: Decathlon"

Também atualizar o header da tabela que usa a mesma chave `expenses.name`.


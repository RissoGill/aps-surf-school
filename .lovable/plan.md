

# Remover Bold dos Títulos dos Cartões Colapsáveis

## Alteração

### `src/pages/admin/AdministrationDashboard.tsx`

Substituir `CardTitle` por um `span` ou `p` com `className="text-xl font-normal"` nos dois títulos colapsáveis ("Gestão Diária" e "Gestão de Receitas"). O `CardTitle` aplica `font-semibold` por defeito — ao usar um elemento simples com `font-normal`, os títulos deixam de estar a bold.


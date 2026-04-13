

# Adicionar Cartão de Relatórios de Despesas na Contabilidade

## Resumo
Criar um novo componente `ExpenseReportsCard` na página de Contabilidade com filtros por mês/ano, categoria e subcategoria, e opções de ver PDF e download -- seguindo exatamente o padrão visual e técnico do `ReportsCard` existente.

## Alterações

### 1. Novo componente `src/components/admin/ExpenseReportsCard.tsx`
- Cartão com o mesmo estilo do `ReportsCard` (ícone FileText, círculo `bg-primary/10`, título e descrição)
- **Filtros:**
  - Mês (Select com Janeiro-Dezembro, default mês atual) + Ano (Select 2025/2026)
  - Categoria (Select com todas as categorias de despesas + opção "Todas")
  - Subcategoria (Select dinâmico, aparece só quando a categoria selecionada tem subcategorias)
- **Botão "Gerar Relatório"** que consulta a tabela `expenses` com os filtros aplicados
- **Botões "Ver PDF" e "Download PDF"** que aparecem após geração, idênticos ao `ReportsCard`
- **HTML do relatório** usa as mesmas cores (#31A896 headers, tabela com bordas, summary section, logo APS, footer)
- Colunas da tabela: Data, Fornecedor, Categoria, Subcategoria, Sub-subcategoria, Valor
- Summary section: total de despesas, número de registos, breakdown por categoria
- Usa `html2pdf.js` para download e `window.open` + `document.write` para visualização

### 2. Atualizar `src/pages/admin/AccountingManagement.tsx`
- Importar e renderizar `ExpenseReportsCard` abaixo do `ExpensesCard`

### 3. Traduções (`en.json` e `pt.json`)
- `expenses.reports.title`: "Relatórios de Despesas" / "Expense Reports"
- `expenses.reports.description`: "Gerar relatórios por mês, categoria ou subcategoria" / "Generate reports by month, category or subcategory"
- `expenses.reports.allCategories`: "Todas as Categorias" / "All Categories"
- `expenses.reports.allSubcategories`: "Todas as Subcategorias" / "All Subcategories"
- `expenses.reports.generate`: "Gerar Relatório" / "Generate Report"

## Secção Técnica

**Query de dados:**
```tsx
let query = supabase.from('expenses').select('*');
// Filtrar por mês/ano usando expense_date
// Filtrar por categoria/subcategoria se selecionados
```

**HTML do relatório** segue o template de `generateReportHTML` do `ReportsCard`:
- Header com logo APS e cor `#31A896`
- `th { background-color: #31A896; color: white; }`
- Summary box com `background-color: #f5f5f5`
- Footer com copyright
- Linha de total com `background-color: #f0f0f0; font-weight: bold`

**View/Download** reutiliza o mesmo padrão:
- `viewReport`: `window.open('', '_blank')` + `document.write(html)`
- `downloadReport`: `html2pdf().from(element).set(opt).save()`


# Editar as listas de categorias, subcategorias e tipos de despesa

Como a pergunta ficou sem resposta, escolhi isto: a administração passa a poder acrescentar, mudar o nome e apagar as opções das listas de despesas, sem ter de pedir alterações. As despesas já lançadas continuam a poder ser editadas no lápis, como agora.

## O que muda para si
- No cartão de Despesas aparece um botão "Gerir listas".
- Abre uma janela com as categorias. Em cada categoria vê as subcategorias e os tipos de despesa.
- Em cada lista pode: acrescentar uma opção, mudar o nome (lápis) e apagar (caixote do lixo).
- Ficam disponíveis logo ao lançar uma despesa e nos relatórios de despesas.
- Começa com as listas que tem hoje (incluindo Aluguer, Carro Nuno, Carro David, matrículas, Material Técnico, etc.).
- As despesas já lançadas não mudam. Se mudar o nome de uma opção ou a apagar, as despesas antigas mantêm o valor que tinham.

## Detalhes técnicos
- Nova tabela `expense_options` (id, level: category|subcategory|type, name, parent_category, parent_subcategory nullable, sort_order, created_at), com GRANTs e RLS permissiva (auth legado). Preenchida com as constantes atuais, incluindo os tipos de Impostos > IUC (matrículas) através de parent_subcategory.
- Novo hook `useExpenseOptions` (react-query, limit 10000) que devolve categorias, SUBCATEGORIES e getSubSubcategories com a mesma forma das constantes, para mudar pouco código.
- `ExpensesCard.tsx` e `ExpenseReportsCard.tsx` passam a usar o hook em vez das constantes fixas. Mantêm-se "Outro" e o texto livre em Custos Campeonatos.
- Novo `ExpenseOptionsDialog.tsx` com o CRUD; invalida a query depois de guardar.
- Traduções `expenses.options.*` em pt.json e en.json.

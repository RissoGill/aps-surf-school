
## Plano: Mover seletores de mês/ano para fora do collapsible

O cartão de despesas já tem seletores de mês e ano, mas estão escondidos dentro do `CollapsibleContent` (linhas 691-711). O utilizador só os vê depois de expandir a lista.

### Alteração

**`src/components/admin/ExpensesCard.tsx`**

1. Mover os dois `<Select>` (mês e ano) de dentro do `<CollapsibleContent>` (linhas 691-711) para **antes** do `<Collapsible>`, logo após a linha que mostra o total do mês (linha 680-682).
2. Combinar o texto do total com os seletores numa linha compacta.

Resultado: o utilizador vê e pode mudar o mês/ano sem precisar expandir a lista de despesas.

Ficheiro a alterar: `src/components/admin/ExpensesCard.tsx` (linhas 680-712).

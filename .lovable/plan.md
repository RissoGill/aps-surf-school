
Objetivo: corrigir o cartão para deixar de mostrar €31,20 quando na base de dados Abril já só tem €15,60.

Diagnóstico
- Verifiquei os registos reais de Abril 2026 na tabela `expenses`.
- Neste momento só existem 2 despesas em Abril:
  - Manutenção de Conta — €15,00
  - Imposto de Selo — €0,60
- Ou seja, a base de dados está correta e não há duplicado real em Abril.
- O problema está no frontend: o cartão de resumo está a mostrar valor antigo em cache.

Causa provável
- `AccountingManagement.tsx` usa uma query própria com a key `['accounting-stats']`.
- `ExpensesCard.tsx` ao apagar/editar/criar despesas só invalida `['expenses']`.
- Resultado: a lista atualiza, mas os cartões de topo podem ficar com valor antigo até refresh manual.

Plano de correção
1. Atualizar `src/components/admin/ExpensesCard.tsx`
- Em todas as mutations que alteram despesas, invalidar também:
  - `['accounting-stats']`
- Isto aplica-se a:
  - criar despesa
  - editar despesa
  - eliminar despesa
  - gerar recorrentes manualmente

2. Garantir consistência da dashboard
- Manter o cálculo do mês corrente em `AccountingManagement.tsx` por `expense_date` (já está certo).
- Não alterar a lógica de soma, porque os dados reais de Abril já confirmam €15,60.

3. Validar comportamento esperado
- Após eliminar uma despesa de Abril, o cartão “Despesas Mês Corrente” deve passar imediatamente para €15,60 sem precisar de refresh.
- O total “desde Setembro 2025” também deve refrescar logo.

Secção técnica
- Ficheiro principal: `src/components/admin/ExpensesCard.tsx`
- Ajuste esperado nos `onSuccess`:
```tsx
queryClient.invalidateQueries({ queryKey: ["expenses"] });
queryClient.invalidateQueries({ queryKey: ["accounting-stats"] });
```

Resultado esperado
- O cartão deixa de mostrar o valor antigo em cache.
- A página de Contabilidade fica sincronizada com a tabela de despesas em tempo real.

# Ordenar anos e meses nos resumos de treinos (área do treinador)

## Objetivo
Na área do treinador, nos resumos mensal e anual de presenças, garantir ordem decrescente (mais recente primeiro) e que o **mês/ano atual aparece sempre em primeiro lugar e fica selecionado por defeito**, mesmo que ainda não tenha registos.

## Estado atual (confirmado por leitura do código)
- `MonthlyAttendanceSummary.tsx` e `AnnualAttendanceSummary.tsx` já ordenam do mais recente para o mais antigo, mas apenas incluem meses/anos que **têm registos**. Se o mês em vigor ainda não tiver treinos marcados, não aparece na lista nem fica selecionado.
- `AnnualAttendanceSummary.tsx` chama `setSelectedYear` durante o render (linha 72-74), o que provoca comportamento instável na seleção por defeito.
- Os componentes são usados em `CoachDashboard.tsx` (linhas 1529-1530), e também no dashboard do atleta e do encarregado — a correção beneficia todos.

## Alterações
1. **MonthlyAttendanceSummary.tsx**
   - Garantir que o mês atual (ex.: `2026-09`) existe sempre na lista, com totais a zero se não houver registos, ficando no topo (ordem decrescente já o coloca primeiro).
   - Seleção por defeito passa a ser o mês atual (em vez do "mais recente com registos").
2. **AnnualAttendanceSummary.tsx**
   - Garantir que o ano atual existe sempre na lista de anos e é o ano selecionado por defeito.
   - Substituir o `setSelectedYear` feito durante o render por inicialização correta no estado/efeito.
3. Sem alterações a dados nem à base de dados — apenas apresentação.

## Detalhes técnicos
- Ficheiros: `src/components/coach/MonthlyAttendanceSummary.tsx`, `src/components/coach/AnnualAttendanceSummary.tsx`.
- Mês/ano atual calculados com `new Date()`; chave no formato `YYYY-MM` já existente.
- Manter traduções existentes (`coach.monthlyAttendance.*`, `coach.annualAttendance.*`); nenhuma chave nova prevista.
- Verificação: typecheck + preview com Playwright na área do treinador, confirmando que setembro 2026 aparece primeiro e selecionado.

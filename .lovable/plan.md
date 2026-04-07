
Corrigir o relatório “Conta Corrente Pro” em `src/components/admin/ReportsCard.tsx`.

1. Alinhar a query dos atletas Pro com a lógica que já funciona
- No `generateReport`, trocar o filtro rígido `.eq("surf_level", "Competition")` por `.ilike("surf_level", "competition")`.
- Manter também `.eq("is_active", true)`.
- Isto evita o caso em que o atleta aparece no seletor, mas depois desaparece na geração do relatório por diferença de capitalização/valor guardado.

2. Garantir que a geração usa o atleta selecionado corretamente
- Confirmar que, quando `selectedAthlete !== "all"`, a query filtra por `athlete_id` sem anular o resultado por causa do filtro de `surf_level`.
- Tratar o cenário em que a lista de atletas devolvida fica vazia, para não fazer `.in("athlete_id", [])` e parecer que “não foi buscar informação”.

3. Corrigir a lógica de totais e linhas do relatório
- O HTML do relatório está a assumir tipos `credit` e `debit`, mas o módulo `ProAccountTab` grava `prize_money`, `expense` e `other`.
- Vou atualizar o relatório para:
  - somar créditos com `prize_money` + `other`
  - somar débitos com `expense`
  - calcular saldo como `pro_prior_balance + créditos - débitos`
  - mostrar o tipo correto em cada linha

4. Melhorar a apresentação quando não houver movimentos
- Se o atleta existir mas não tiver entradas no intervalo escolhido, mostrar mensagem clara do tipo “Sem movimentos neste período”.
- Se houver entradas, listar normalmente os movimentos desse atleta.

5. Validar o impacto sem alterar o layout geral
- Manter o dropdown, datas e PDF como estão.
- Apenas corrigir:
  - carregamento dos dados
  - mapeamento dos tipos
  - cálculo dos totais
  - estado vazio

Detalhes técnicos
- Ficheiro principal: `src/components/admin/ReportsCard.tsx`
- Causa principal identificada:
  - seletor usa `ilike("surf_level", "competition")`
  - geração usa `eq("surf_level", "Competition")`
- Causa secundária identificada:
  - relatório interpreta tipos errados (`credit`/`debit`) enquanto os dados reais usam `prize_money` / `expense` / `other`
- Não são necessárias alterações de base de dados nem migrations.

Validação após implementação
- Testar com “Francisco Ordonhas” entre `2025-01-01` e `2026-04-30`
- Confirmar 3 cenários:
  1. atleta específico com movimentos
  2. atleta específico sem movimentos
  3. opção “todos os atletas”
- Confirmar que o PDF mostra valores e saldos corretos.

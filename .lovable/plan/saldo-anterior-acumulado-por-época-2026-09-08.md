# Saldo anterior acumulado por época

## Objetivo

Na Gestão de Pagamentos, o cartão "Saldo anterior" passa a mostrar tudo o que ficou em dívida antes da época selecionada, e não apenas o valor histórico guardado na ficha do atleta.

Exemplo confirmado (A38):
- Saldo histórico guardado na ficha: 168€
- Em falta na época 25/26: 744€ (Fevereiro, Maio e Junho, 248€ cada)
- Na época 26/27 o cartão passa a mostrar **912€**
- Na época 25/26 continua a mostrar 168€

O valor é calculado automaticamente sempre que se muda de época — não é preciso "fechar" nenhuma época nem gravar nada.

## O que muda no ecrã

- O cartão de saldo anterior mostra o total acumulado (histórico + meses por pagar de épocas anteriores).
- Por baixo do valor, uma linha discreta com a repartição, por exemplo: "168€ histórico + 744€ de épocas anteriores".
- O cartão "Total em dívida" passa a usar este novo total acumulado, deixando de contar duas vezes.
- Registar pagamento e editar valor continuam a atuar apenas sobre a parte histórica (168€ no exemplo). Os meses por pagar de 25/26 são acertados nas próprias linhas desses meses, como hoje. O botão de registar pagamento fica indisponível quando a parte histórica é zero, e o limite máximo do pagamento é essa parte histórica.

## Detalhes técnicos

`src/pages/admin/PaymentManagement.tsx`
- Nova query (`athlete-all-payments`, dependente apenas do atleta) que lê todos os pagamentos do atleta sem filtro de época.
- Nova função `calculatePreSeasonOutstanding()`: soma `max(amount_due - amount_paid, 0)` de todos os registos cujo serial (`ano*12 + mês`) seja inferior a Setembro da época selecionada. Reutiliza o `monthMap`/`normalize` já existentes.
- `priorBalanceStored` = `atletas.prior_balance` (inalterado). `priorBalanceTotal` = `priorBalanceStored + calculatePreSeasonOutstanding()`.
- `calculateTotalOutstanding()` passa a `priorBalanceTotal + calculateCurrentSeasonOutstanding()`.

`src/components/admin/PriorBalanceCard.tsx`
- Novas props `priorBalanceTotal` e `preSeasonOutstanding`; `priorBalance` mantém-se como o valor histórico editável.
- Valor grande passa a mostrar `priorBalanceTotal`; nova linha de repartição quando `preSeasonOutstanding > 0`.
- Validações de pagamento e "pagar valor total" continuam ligadas a `priorBalance` (histórico).
- Toda a lógica de escrita em `atletas.prior_balance` e `prior_balance_payments` fica inalterada.

Sem alterações à base de dados nem à função `generate-season`.

## Traduções

Duas chaves novas em `pt.json` e `en.json` para a linha de repartição (histórico / épocas anteriores).

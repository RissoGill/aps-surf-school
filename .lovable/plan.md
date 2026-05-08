## Problema

No relatório Pro Account (1/1/2025 → hoje), o Francisco Ordonhas (A14) aparece com **18.036,83 €** de créditos. Esse valor inclui:

- **Prémios** (`type = prize_money`): ~17.438,33 €
- **Outros** (`type = other`, ex: Carro PJ Portimão 292,5 €, Carro PJ Aveiro 306 €): ~598,5 €

A função `generateReportHTML` em `ReportsCard.tsx` (linhas 505-510) trata `prize_money` **e** `other` como créditos:

```ts
const totalCredits = athleteEntries
  .filter(e => e.type === "prize_money" || e.type === "other")
  .reduce(...);
```

Tu queres que apenas `prize_money` conte como crédito.

## Alteração proposta

**Ficheiro:** `src/components/admin/ReportsCard.tsx`

1. **Linhas 505-510** — filtrar créditos só por `prize_money`; tratar `other` como despesa (ou linha separada).
2. **Linha 511** — manter fórmula `priorBalance + credits − expenses`, mas agora `expenses` inclui `type = expense` **e** `type = other`.
3. **Linhas 536-538** — ao renderizar cada linha, `isCredit = entry.type === "prize_money"` (só prémios a verde com `+`); restantes a vermelho com `−`.
4. **Linha 542** — rótulo: "Credit" só para prize_money; "Expense" para `expense` e `other` (ou manter "Other" distinto se preferires — assumo "Expense" para simplicidade).

## Resultado para A14

- Créditos (só prémios): **17.438,33 €**
- Despesas (expense + other): **11.713,20 + 598,50 = 12.311,70 €**
- Saldo período: 17.438,33 − 12.311,70 = **+5.126,63 €** (+ prior balance)

## Nota de coerência

Esta mudança afecta **apenas o relatório PDF**. O ecrã `/admin/pro-accounts` (ProAccountTab) continua a tratar `other` como crédito no saldo total — é a lógica que conversámos antes (ex: "Carro PJ Aveiro" como receita). Se quiseres alinhar os dois sítios, diz-me qual deve ser a fonte de verdade.

## Plano: Reconciliação Pro Account — Francisco Ordonhas (A14)

Aplicar correções pontuais à tabela `pro_account_entries` para alinhar com o Excel oficial.

### Decisões já confirmadas

1. **PJ Portimão** (31-Jul-2025): corrigir valor de **16,63 €** para **168,63 €** (despesa).
2. **Carro PJ Aveiro** (31-Ago-2025, 306 €): manter como **despesa** na BD (Excel será corrigido fora da app).
3. **Coaching 2026** (Figueira 146,88 + Porto 132,04 + Casablanca 547,17 = 826,09 €): **manter** as 3 entradas na BD.

### Pendente de confirmação (4ª pergunta)

Adicionar entradas em falta na BD que constam no Excel (assumido como sim):

| Data | Descrição | Categoria | Valor | Fatura |
|---|---|---|---|---|
| 2025 | Projunior 3ª Etapa | prize_money | +500,00 | — |
| 2025 | Projunior 4ª Etapa | prize_money | +155,00 | — |
| 2025 | 5ª Etapa Liga MEO 13º | prize_money | +300,00 | — |
| 2026 | 1ª etapa Liga MEO Surf 2026 — 1º lugar | prize_money | +4.500,00 | 75 |
| 2026 | 2ª etapa Liga MEO Surf 2026 — 1º lugar | prize_money | +4.500,00 | 105 |
| 2026 | Sub-Troféu Liga Meo — Best Wave | prize_money | +500,00 | 105 |
| 2026 | Sub-Troféu Liga Meo — Waversby | prize_money | +500,00 | 105 |
| 2026 | Viagem California | expense | −1.125,00 | — |

(Verificarei via SQL antes de inserir, para evitar duplicar entradas que já existam.)

### Passos de execução

1. Correr `SELECT` em `pro_account_entries WHERE athlete_id='A14'` ordenado por data para listar exatamente o que existe.
2. Comparar linha-a-linha com o Excel e produzir lista final de:
   - **UPDATE** PJ Portimão (16,63 → 168,63).
   - **INSERT** das entradas em falta (tabela acima, apenas as não existentes).
3. Apresentar a lista exata de SQL antes de executar (via insert tool, não migration — são dados).
4. Após aplicar, mostrar saldo recalculado e diferença vs Excel (7.945,36 €).

### Detalhes técnicos

- Tabela: `pro_account_entries` (athlete_id, type, category, entry_date, description, amount, invoice_number).
- Tipo `expense` é guardado como valor positivo e subtraído na UI; `prize_money` e `other` são positivos somados. Confirmar convenção de sinal lendo `ProAccountTab.tsx` antes de inserir.
- Não há alteração de schema, apenas dados.
- Se restar diferença após estes ajustes, fazer auditoria adicional (possíveis duplicados ou mensalidades extra na BD).

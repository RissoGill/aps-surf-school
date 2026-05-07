## Diferença atual: 612,00 €

| Fonte | Saldo final |
|---|---|
| Excel (novo) | 7.166,44 € |
| BD | 6.554,44 € |
| **Diferença** | **612,00 €** |

Esta diferença corresponde **exactamente** ao flip do **Carro PJ Aveiro** (306 €):
- Excel trata como **receita** (+306)
- BD ainda tem como **despesa** (−306)
- Diferença: 306 − (−306) = **612 €** ✓

Todos os outros itens (Coaching 2026, prémios 4500€, Sub-troféus, Viagem California, PJ Portimão 168,63 €) já batem certo entre Excel e BD.

## Alteração proposta na BD

Atualizar a entrada `Carro PJ Aveiro` (A14, 2025-08-31, 306 €):
- `type`: `expense` → `other`
- `category`: `other` → `other` (mantém)

Resultado: saldo BD passa de **6.554,44 €** para **7.166,44 €**, igual ao Excel.

## SQL

```sql
UPDATE pro_account_entries
SET type = 'other'
WHERE athlete_id = 'A14'
  AND description = 'Carro PJ Aveiro'
  AND amount = 306;
```

Sem alterações de código — apenas migração de dados.
## Objetivo
Criar os registos de pagamento mensais da nova época **2026/2027** (Setembro 2026 → Junho 2027, 10 meses) para todos os atletas ativos com plano mensal, para que apareçam no Payment Management.

## O que vai ser feito
Uma única migração SQL (idempotente) que:

1. Para cada atleta com `plan_type` mensal (excluir `pack%` e `daily`) e `status = 'Active'`, insere 10 linhas em `payments`:
   - Meses: September, October, November, December (year = 2026)
   - January, February, March, April, May, June (year = 2027)
   - `amount_due = 0`, `amount_paid = 0`, `status = 'Unpaid'`
   - `payment_id` gerado sequencialmente a partir do `MAX(payment_id)` atual (formato `PAY<n>`)
2. Usa `WHERE NOT EXISTS (...)` no par (`athlete_id`, `month`, `year`) para evitar duplicados caso alguns já existam.

Os valores `amount_due` ficam a 0 (igual ao comportamento do trigger `handle_new_athlete`) — podem depois ser preenchidos manualmente ou via sincronização da mensalidade.

## Perguntas antes de avançar
- Confirmas que devem ser criados para **todos os atletas ativos com plano mensal** (excluindo `pack*` e `daily`)? 
- Queres que `amount_due` seja **0** (igual ao trigger atual) ou que copie o `monthly_fee` atual de cada atleta?

## Nota técnica
A sessão Supabase está expirada — preciso que reconectes para correr a migração. Posso preparar o SQL agora e executá-lo assim que reconectares.

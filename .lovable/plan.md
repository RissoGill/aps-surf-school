## Criar pagamentos da época 2026/2027

Inserir 10 registos de pagamento (Setembro 2026 → Junho 2027) para cada atleta `Active` com plano mensal (exclui `pack%` e `daily`).

- `amount_due = 0`, `amount_paid = 0`, `status = 'Unpaid'`
- `payment_id` sequencial `PAY<n>` a continuar do máximo atual
- `NOT EXISTS` em (`athlete_id`, `month`, `year`) para não duplicar

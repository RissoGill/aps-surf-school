

# Adicionar Prior Balance aos cartões Outstanding

## Contexto
Os dois cartões "Em Dívida Learning/Pré-Comp" e "Em Dívida Competição" no dashboard de administração apenas contabilizam as mensalidades em dívida desde Setembro 2025. O `prior_balance` (saldo anterior) de cada atleta não está incluído.

## Alteração

### `src/pages/admin/AdministrationDashboard.tsx`

1. Na query `all-payments-summary`, o código já busca os atletas com `athlete_id, surf_level, is_active`. Alterar para também buscar `prior_balance`:
   ```
   .select('athlete_id, surf_level, is_active, prior_balance')
   ```

2. Após calcular `septemberOnwardsOutstandingLearning` e `septemberOnwardsOutstandingCompetition`, somar o `prior_balance` de cada grupo de atletas ativos:
   - **Learning/Pre-Comp**: somar `prior_balance` de atletas ativos com `surf_level` = Learning ou Pre-Competition
   - **Competition**: somar `prior_balance` de atletas ativos com `surf_level` = Competition

3. Os valores finais passam a ser:
   ```
   septemberOnwardsOutstandingLearning = (dívida mensalidades) + (soma prior_balance Learning/Pre-Comp)
   septemberOnwardsOutstandingCompetition = (dívida mensalidades) + (soma prior_balance Competition)
   ```

O `prior_balance` na tabela `atletas` já é actualizado automaticamente quando se registam pagamentos contra o saldo anterior (via PriorBalanceCard), portanto o valor em BD já reflecte o saldo real em dívida.


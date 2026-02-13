

# Filtrar Atletas Inativos dos Relatórios Financeiros

## Problema

O relatório financeiro inclui pagamentos de atletas inativos (ex: Manuel Correia), mostrando-os como tendo dívidas pendentes. Os outros relatórios (presenças, pessoal, geral) já filtram corretamente por `is_active = true`, mas o relatório financeiro não.

## Solução

Adicionar filtro de atletas inativos no relatório financeiro, filtrando os resultados após a query para incluir apenas pagamentos de atletas ativos.

## Secção Técnica

### Ficheiro: `src/components/admin/ReportsCard.tsx`

**Alteração 1**: Na query do relatório financeiro (caso `"financial"`), após obter os pagamentos (linha ~137), adicionar um filtro para excluir atletas inativos. Como a query já faz join com `atletas`, podemos verificar `is_active` nos dados retornados. Contudo, a query atual não seleciona `is_active`, por isso precisamos de:

1. Atualizar o select da query de pagamentos para incluir `is_active`:
   ```
   atletas:athlete_id (first_name, last_name, surf_level, is_active)
   ```

2. Adicionar filtro in-memory após a query (junto dos filtros existentes de `showOnlyOutstanding` e `selectedSurfLevels`):
   ```typescript
   // Filter out inactive athletes
   filteredPayments = filteredPayments.filter((p: any) => p.atletas?.is_active === true);
   ```

**Alteração 2**: Na query do relatório geral ("overall"), o `paymentsRes` também não filtra por atletas ativos. Adicionar filtro `.in("athlete_id", activeAthleteIds)` à query de pagamentos do relatório geral, tal como já é feito para a query de presenças.

### Resumo

- 1 ficheiro alterado: `src/components/admin/ReportsCard.tsx`
- 2 alterações: adicionar `is_active` ao select + filtrar atletas inativos nos relatórios financeiro e geral
- Sem alterações de base de dados


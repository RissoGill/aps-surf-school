

# Adicionar Saldo Anterior à Conta Corrente Pro

## Objetivo

Permitir definir um saldo anterior (previous balance) por atleta na conta corrente pro, que será incluído no cálculo do saldo total. Funciona como ponto de partida antes dos registos de prize money e despesas.

## Alterações

### 1. Base de dados
Adicionar coluna `pro_prior_balance` (numeric, default 0) à tabela `atletas`. Este valor representa o saldo inicial da conta corrente pro antes de se começarem a registar movimentos.

```sql
ALTER TABLE public.atletas ADD COLUMN pro_prior_balance numeric DEFAULT 0;
```

### 2. Frontend — `ProAccountTab.tsx`

- **Buscar `pro_prior_balance`** do atleta selecionado (já temos query de atletas, basta incluir o campo)
- **Mostrar campo editável** de saldo anterior junto ao seletor de atleta (input numérico com botão guardar)
- **Incluir no cálculo do saldo**: `balance = pro_prior_balance + totalPrize - totalExpense`
- **Adicionar card extra** nos summary cards para mostrar o saldo anterior, ou incluí-lo no card de saldo total

### 3. Traduções
Adicionar chaves `proAccount.priorBalance`, `proAccount.priorBalanceSaved` em `pt.json` e `en.json`.

## Ficheiros alterados
1. **Migração SQL** — `ALTER TABLE atletas ADD COLUMN pro_prior_balance`
2. **`src/components/admin/ProAccountTab.tsx`** — campo editável + cálculo atualizado
3. **`src/i18n/translations/pt.json`** e **`en.json`** — traduções




# Editar Prior Balance com Data

## Problema
O prior balance atual é apenas um campo numérico sem data associada e sem possibilidade fácil de editar após guardar.

## Alterações

### 1. Base de dados
Adicionar coluna `pro_prior_balance_date` (date) à tabela `atletas` para guardar a data associada ao saldo anterior.

```sql
ALTER TABLE public.atletas ADD COLUMN pro_prior_balance_date date;
```

### 2. Frontend — `ProAccountTab.tsx`
- Adicionar campo de **data** ao lado do input do prior balance (input type date)
- Manter o prior balance **sempre editável** (não escondido após guardar) — o admin pode alterar o valor e a data a qualquer momento
- Ao selecionar um atleta, carregar tanto o valor como a data do prior balance
- Ao guardar, enviar ambos os campos (`pro_prior_balance` e `pro_prior_balance_date`) para a tabela `atletas`
- No card de resumo do prior balance, mostrar também a data

### 3. Traduções
Adicionar chaves para `proAccount.priorBalanceDate` em `pt.json` e `en.json`.

## Ficheiros alterados
1. **Migração SQL** — adicionar `pro_prior_balance_date`
2. **`src/components/admin/ProAccountTab.tsx`** — campo de data + edição sempre acessível
3. **`src/i18n/translations/pt.json`** e **`en.json`** — tradução da label de data
4. **`src/integrations/supabase/types.ts`** — atualizado automaticamente


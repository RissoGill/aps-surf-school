

# Correção: Pagamento de Saldo Anterior não Atualiza a Dívida

## Problema Identificado

O pagamento de 911€ do Francisco Queimado (A15) foi **registado com sucesso** na tabela `prior_balance_payments`, mas o `prior_balance` na tabela `atletas` **não foi atualizado** (continua a 0).

### Causa Raiz

As políticas RLS de UPDATE na tabela `atletas` são todas do tipo **RESTRICTIVE** (não permissivas). Isto significa que **todas** devem ser satisfeitas simultaneamente:

1. "Anonymous can update atletas" -- passa (true)
2. "Authenticated can update atletas" -- passa (true)
3. **"Admins can update athlete records"** -- FALHA porque `auth.uid()` retorna NULL com autenticação legacy

Como a terceira policy falha, o UPDATE é **silenciosamente bloqueado** pelo Supabase (não gera erro, simplesmente não atualiza nenhuma linha).

### Dados Atuais na Base de Dados

| Campo | Valor |
|-------|-------|
| prior_balance (atletas) | 0 (deveria ser -911 após o pagamento) |
| Pagamento registado | 911€ em 2026-02-09 |
| Dívida época atual | 2.484€ |

## Solução

### Passo 1: Corrigir a Policy RLS (migração SQL)

Alterar a policy "Admins can update athlete records" de RESTRICTIVE para **PERMISSIVE**, ou removê-la completamente já que as policies anónima e autenticada já permitem updates.

A solução mais segura é **remover a policy RESTRICTIVE** do admin, mantendo apenas as permissivas para anónimos e autenticados (que já existem com `true`).

### Passo 2: Corrigir o Saldo do Francisco Queimado

Depois da migração, executar um UPDATE manual ou pedir ao admin para apagar e re-registar o pagamento de 911€, para que o `prior_balance` seja corretamente atualizado.

Alternativamente, corrigir diretamente via SQL: `UPDATE atletas SET prior_balance = -911 WHERE athlete_id = 'A15'`.

## Secção Técnica

### Migração SQL Necessária

```sql
-- Remove the RESTRICTIVE admin update policy that blocks legacy auth
DROP POLICY IF EXISTS "Admins can update athlete records" ON atletas;
```

Esta migração remove a policy restrictiva que bloqueia updates quando `auth.uid()` é NULL (autenticação legacy). As policies "Anonymous can update atletas" e "Authenticated can update atletas" (ambas com `true`) continuam ativas, permitindo os updates.

### Correção Imediata do Saldo

```sql
UPDATE atletas SET prior_balance = -911 WHERE athlete_id = 'A15';
```

Isto coloca o `prior_balance` no valor correto (0 - 911 = -911), refletindo o pagamento já registado.

### Resumo das Alterações

1. **Uma migração SQL** para remover a policy RLS restrictiva na tabela `atletas`
2. **Uma correção de dados** para atualizar o `prior_balance` do Francisco Queimado
3. **Sem alterações de código** no frontend (a lógica do PriorBalanceCard está correta)

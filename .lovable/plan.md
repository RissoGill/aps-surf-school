

# Corrigir UI que não atualiza o saldo anterior após pagamento

## Problema

Quando se regista um pagamento de saldo anterior (ex: 150€ para Santiago Carreira), o valor é **corretamente atualizado na base de dados**, mas a interface não reflete a alteração. O valor mostrado permanece o mesmo.

**Causa raiz**: O `selectedAthlete` é guardado como estado local (`useState`). Quando o `onBalanceUpdated` invalida a query `athletes-search`, os dados da lista de atletas são atualizados, mas o `selectedAthlete` continua com o valor antigo de `prior_balance`. O `priorBalance` é derivado de `selectedAthlete?.prior_balance`, logo nunca muda.

## Solução

Sincronizar `selectedAthlete` com os dados atualizados da query `athletes-search`. Após invalidar as queries, atualizar o `selectedAthlete` com os dados frescos.

## Secção Técnica

### Ficheiro: `src/pages/admin/PaymentManagement.tsx`

**Alteração 1**: Adicionar um `useEffect` que sincronize `selectedAthlete` quando os dados da query `athletes-search` mudam:

```typescript
useEffect(() => {
  if (selectedAthlete && athletes) {
    const updated = athletes.find(a => a.athlete_id === selectedAthlete.athlete_id);
    if (updated && updated.prior_balance !== selectedAthlete.prior_balance) {
      setSelectedAthlete(updated);
    }
  }
}, [athletes, selectedAthlete]);
```

Isto garante que, quando a query é invalidada e retorna dados novos, o `selectedAthlete` é atualizado com o `prior_balance` correto.

### Resumo

- 1 ficheiro alterado: `src/pages/admin/PaymentManagement.tsx`
- Adicionar `useEffect` para sincronizar estado local com dados da query
- Sem alterações de base de dados (o valor já está correto na DB: 524€)


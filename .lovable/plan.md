

# Proteger queries de payments contra o limite de 1000 linhas do Supabase

## Problema
As queries à tabela `payments` não especificam `.range()` nem `.limit()`, ficando sujeitas ao limite default de 1000 rows. Com 816 registos em 2026, em breve os dados serão truncados silenciosamente.

## Solução
Criar uma função helper que faz fetch paginado (blocos de 1000) e retorna todos os registos. Aplicar em todas as queries de payments nos dois ficheiros afetados.

## Alterações

### 1. Função helper de fetch paginado

Adicionar no topo de `AccountingManagement.tsx` (e importar/reutilizar em `ExpenseReportsCard.tsx`) uma função:

```tsx
const fetchAllRows = async (query: any) => {
  const PAGE_SIZE = 1000;
  let allData: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await query.range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    allData = allData.concat(data || []);
    if (!data || data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return allData;
};
```

### 2. `AccountingManagement.tsx` -- 3 queries afetadas

- **Linha 91-94** (`accounting-stats`): `monthPayments` query `.eq('year', currentYear)` -- usar fetch paginado
- **Linha 137** (`annual-chart-data`): `payments2025` `.eq('year', 2025)` -- usar fetch paginado
- **Linha 138** (`annual-chart-data`): `payments2026` `.eq('year', 2026)` -- usar fetch paginado

Como `.range()` não funciona encadeado com o query builder da mesma forma, a solução será construir a query base e paginar. Alternativa mais simples: adicionar `.limit(10000)` a cada query de payments, dado que o volume total por ano não excederá ~2000-3000 registos nos próximos anos.

### 3. `ExpenseReportsCard.tsx` -- 1 query afetada

- **Linha 147-150** (`generateCompleteReport`): query de payments por mês -- volume menor (~100/mês), menos urgente mas proteger igualmente com `.limit(10000)`.

### Abordagem final

Usar `.limit(10000)` em todas as queries de `payments` nos dois ficheiros. É simples, seguro, e suficiente para o volume esperado (max ~1500 payments/ano). Sem necessidade de paginação complexa.

## Ficheiros a alterar
- `src/pages/admin/AccountingManagement.tsx` -- adicionar `.limit(10000)` às 3 queries de payments
- `src/components/admin/ExpenseReportsCard.tsx` -- adicionar `.limit(10000)` à query de payments no relatório completo




# Adicionar .limit(10000) às queries de payments em RevenueManagement e PaymentManagement

## Alterações

### 1. `src/pages/admin/RevenueManagement.tsx` — 3 queries

- **Linha 42-44**: query geral de payments (sem filtro de ano) → adicionar `.limit(10000)`
- **Linha 81-84**: query de `monthRows` filtrada por `currentYear` → adicionar `.limit(10000)`
- **Linha 125-128**: query de `sept2025OnwardsRows` com `.gte('year', 2025)` → adicionar `.limit(10000)`

### 2. `src/pages/admin/PaymentManagement.tsx` — 1 query SELECT

- **Linha 213-218**: query de payments por `athlete_id` → adicionar `.limit(10000)` (volume por atleta é pequeno, mas por consistência)

A query de `.update()` (linha 452) não precisa de `.limit()`.

## Secção Técnica

Adicionar `.limit(10000)` no final de cada cadeia de query SELECT, antes do `;`. Padrão idêntico ao já aplicado em `AccountingManagement.tsx` e `ExpenseReportsCard.tsx`.


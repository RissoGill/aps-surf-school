

# Nova Página "Gestão de Receitas"

## Resumo
Substituir o cartão colapsável "Gestão de Receitas" no dashboard por um cartão simples que navega para uma nova página `/admin/revenue`. Essa página terá no topo os cartões financeiros (Total Recebido desde Setembro, Total Recebido este Mês, e os 4 cartões de dívidas) e por baixo os cartões de administração (Pagamentos, Conta Corrente Pro, Pagamentos a Treinadores).

## Alterações

### 1. Criar `src/pages/admin/RevenueManagement.tsx` (novo ficheiro)
- Nova página com `AppHeader` (título "Gestão de Receitas", botão voltar para `/dashboard/administration`)
- Reutiliza a mesma query `all-payments-summary` para obter dados financeiros
- **Topo**: Grid 2x2 com os 6 cartões de stats financeiros (Total Recebido, Total Recebido Mês, 4 dívidas)
- **Abaixo**: Os 3 cartões de acção (Pagamentos → `/admin/payments`, Conta Corrente Pro → `/admin/pro-accounts`, Pagamentos Treinadores via `CoachPaymentsCard`)

### 2. Editar `src/pages/admin/AdministrationDashboard.tsx`
- Remover o bloco `Collapsible` de "Gestão de Receitas" (linhas 877-930)
- Substituir por um cartão simples clicável que navega para `/admin/revenue`
- Remover os quickStats financeiros do dashboard (índices 0-7), mantendo apenas os 3 de contagem de atletas por nível
- Remover imports não necessários (`Landmark`, `CoachPaymentsCard`)

### 3. Editar `src/App.tsx`
- Adicionar rota `/admin/revenue` → `RevenueManagement`

### 4. Traduções (`en.json` e `pt.json`)
- Adicionar chave para título da página se necessário (pode reutilizar `admin.management.revenueManagement`)


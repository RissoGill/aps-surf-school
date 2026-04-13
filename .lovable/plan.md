

# Adicionar .limit(10000) a todas as queries SELECT restantes sem proteção

## Contexto
Já protegemos `payments`, `attendance`, `expenses` e `coach_payments` nos ficheiros principais. Faltam queries de tabelas que podem crescer ou por consistência devem ser protegidas.

## Queries a proteger (16 queries em 10 ficheiros)

### 1. `src/pages/admin/AdministrationDashboard.tsx`
- **Linha 90**: `payments` SELECT sem limit → `.limit(10000)`
- **Linha 105**: `atletas` SELECT sem limit → `.limit(10000)`
- **Linha 134**: `payments` por year sem limit → `.limit(10000)`
- **Linha 245**: `payments` gte year sem limit → `.limit(10000)`

### 2. `src/components/admin/ExpensesCard.tsx`
- **Linha 145**: `expenses` SELECT sem limit → `.limit(10000)`
- **Linha 355**: `recurring_expenses` SELECT sem limit → `.limit(10000)`

### 3. `src/components/admin/CoachPaymentsCard.tsx`
- **Linha 109**: `coach` SELECT sem limit (volume baixo, por consistência) → `.limit(10000)`

### 4. `src/components/admin/AlertsManagementCard.tsx`
- **Linha 62**: `alerts` SELECT sem limit → `.limit(10000)`

### 5. `src/components/admin/CoachMessagesManagementCard.tsx`
- **Linha 80**: `coach_messages` SELECT sem limit → `.limit(10000)`
- **Linha 106**: `coach_message_replies` SELECT sem limit → `.limit(10000)`

### 6. `src/components/admin/ProAccountTab.tsx`
- **Linha 149**: `pro_account_entries` SELECT sem limit → `.limit(10000)`

### 7. `src/pages/admin/UserManagement.tsx`
- **Linha 120**: `coach` SELECT sem limit → `.limit(10000)`
- **Linha 124**: `atletas` SELECT sem limit → `.limit(10000)`

### 8. `src/pages/admin/DailyManagement.tsx`
- **Linha 36**: `atletas` SELECT sem limit → `.limit(10000)`

### 9. `src/pages/admin/AthleteManagement.tsx`
- **Linha 126**: `atletas` SELECT sem limit → `.limit(10000)`

### 10. `src/pages/attendance/AthletesList.tsx`
- **Linha 27**: `atletas` SELECT sem limit → `.limit(10000)`

## Ficheiros que NÃO precisam de alteração
- `CoachDashboard.tsx` — attendance já usa `.range()`, atletas/coach têm volume controlado mas serão cobertos acima noutros ficheiros
- `AthleteDetails.tsx` — queries filtradas por ID individual
- `AthleteDashboard.tsx`, `GuardianDashboard.tsx` — filtradas por atleta
- `CoachMessagesCard.tsx` — filtrada por coach_id
- `PriorBalanceCard.tsx` — filtrada por athlete_id
- `ChampionshipsTab.tsx`, `EstagiosTab.tsx` — tabelas de referência com volume muito baixo
- `BulkAttendanceRegistration.tsx` — attendance já tem `.limit(10000)`
- `AlertsCard.tsx` (shared) — filtrada por `is_resolved = false`, volume baixo
- `PaymentsTab.tsx` (coach) — filtrada por coach_id

## Secção técnica
Adicionar `.limit(10000)` no final de cada cadeia SELECT, antes do `;` ou da atribuição. Padrão idêntico ao já aplicado nos ficheiros anteriores. Total: 16 alterações em 10 ficheiros.


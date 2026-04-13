
# Adicionar .limit(10000) às queries de attendance sem paginação

## Contexto
`CoachDashboard` e `AdministrationDashboard` já usam paginação manual (`.range()`) -- estão protegidos. Mas várias outras queries de attendance não têm limite e podem ser truncadas a 1000 rows.

## Queries a proteger (6 queries em 5 ficheiros)

### 1. `src/pages/attendance/AttendanceRecords.tsx` (linha ~43)
Query geral de attendance sem limite -- adicionar `.limit(10000)` após `.order()`

### 2. `src/components/admin/AttendanceManagementCard.tsx` (linha 48)
`supabase.from('attendance').select('*').order(...)` -- adicionar `.limit(10000)`

### 3. `src/components/admin/AttendanceManagement.tsx` (linha 45)
Mesmo padrão -- adicionar `.limit(10000)`

### 4. `src/components/admin/AdminAttendanceManagement.tsx` (linha 39)
Mesmo padrão -- adicionar `.limit(10000)`

### 5. `src/components/admin/ReportsCard.tsx` (linha 233)
Query de attendance filtrada por data e status -- adicionar `.limit(10000)`

### 6. `src/components/coach/BulkAttendanceRegistration.tsx` (linha ~144)
Query de duplicate check por data -- volume pequeno por dia, mas por consistência adicionar `.limit(10000)`

## Ficheiros que NÃO precisam de alteração
- `CoachDashboard.tsx` -- já usa paginação com `.range()`
- `AdministrationDashboard.tsx` -- já usa paginação com `.range()`
- `AthleteDetails.tsx` -- filtrado por atleta individual (volume baixo)
- `AthleteDashboard.tsx` -- filtrado por atleta individual
- `GuardianDashboard.tsx` -- filtrado por atleta individual
- `CoachTrainingManagement.tsx` -- filtrado por coach individual
- `packBalance.ts` -- filtrado por atleta individual

## Secção técnica
Adicionar `.limit(10000)` no final de cada cadeia SELECT, antes do `;` ou `,`. Padrão idêntico ao já aplicado nas queries de payments/expenses.

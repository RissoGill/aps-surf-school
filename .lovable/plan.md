
# Plano de Resolução: Registos de Presença Fantasma

## Resumo do Problema

Os treinadores não conseguem registar presenças em lote porque existem **32.455 registos "fantasma"** na tabela `attendance` — registos com `shift`, `status` e `coach_id` todos a NULL. O trigger `prevent_duplicate_attendance` bloqueia novos `INSERT` porque já existe um registo para a combinação `(athlete_id, date, NULL shift)`.

### Origem Provável
Um script externo pré-criou 90 registos por dia (um por atleta) de **2025-09-01 até 2026-08-29** — incluindo datas futuras impossíveis.

### Dados Adicionais
- **~312 registos antigos** têm `shift=NULL` mas já contêm `status` e `coach_id` válidos (dados reais introduzidos antes da obrigatoriedade do campo `shift`).

---

## Acções a Implementar

### 1. Exportar os registos vazios (para referência)
Gerar uma query para exportar/listar todos os IDs afectados antes da eliminação:

```sql
SELECT id, athlete_id, date
FROM attendance
WHERE shift IS NULL 
  AND status IS NULL 
  AND coach_id IS NULL
ORDER BY date, athlete_id;
```

O resultado será um CSV com ~32.455 linhas que pode descarregar no SQL Editor do Supabase antes de proceder.

---

### 2. Eliminar todos os registos fantasma
Executar a seguinte query via SQL Editor:

```sql
DELETE FROM attendance
WHERE shift IS NULL
  AND status IS NULL
  AND coach_id IS NULL;
```

Impacto esperado: **~32.455 linhas eliminadas**. 

Esta acção liberta todas as combinações `(athlete_id, date)` bloqueadas, permitindo os treinadores registar presenças normalmente.

---

### 3. Corrigir registos antigos sem shift
Para os ~312 registos que já têm dados (`status` e `coach_id`) mas `shift=NULL`, atribuir o valor `'Morning'` por defeito:

```sql
UPDATE attendance
SET shift = 'Morning'
WHERE shift IS NULL
  AND (status IS NOT NULL OR coach_id IS NOT NULL);
```

Impacto esperado: **~312 linhas actualizadas**.

---

### 4. (Opcional) Adicionar constraint NOT NULL ao campo shift
Depois de limpar os dados, pode ser útil impedir futuros registos sem shift:

```sql
ALTER TABLE attendance
ALTER COLUMN shift SET NOT NULL;
```

Só activar após verificar que não há mais registos com `shift IS NULL`.

---

## Sumário de Comandos SQL

```text
-- 1. Exportar (copiar resultado antes de eliminar)
SELECT id, athlete_id, date
FROM attendance
WHERE shift IS NULL AND status IS NULL AND coach_id IS NULL
ORDER BY date, athlete_id;

-- 2. Eliminar fantasmas
DELETE FROM attendance
WHERE shift IS NULL AND status IS NULL AND coach_id IS NULL;

-- 3. Corrigir shift nos registos antigos válidos
UPDATE attendance
SET shift = 'Morning'
WHERE shift IS NULL
  AND (status IS NOT NULL OR coach_id IS NOT NULL);

-- 4. (Opcional) Impedir futuros NULL
ALTER TABLE attendance ALTER COLUMN shift SET NOT NULL;
```

---

## Resultado Esperado

- **Treinadores conseguem registar presenças em lote** sem erros de duplicado.
- **Dados históricos preservados** com shift='Morning' atribuído aos registos antigos.
- **Sem registos fantasma** a ocupar espaço ou bloquear operações.

---

## Notas Técnicas

| Componente | Ficheiro | Alteração |
|------------|----------|-----------|
| Tabela `attendance` | N/A | DELETE + UPDATE via SQL Editor |
| Edge Function `attendance-admin` | `supabase/functions/attendance-admin/index.ts` | Sem alterações necessárias |
| Frontend `BulkAttendanceRegistration` | `src/components/coach/BulkAttendanceRegistration.tsx` | Sem alterações necessárias |

Os comandos SQL devem ser executados manualmente no [SQL Editor do Supabase](https://supabase.com/dashboard/project/bzzzecvzoahauqrhkvds/sql/new).



# Plano: Campos Obrigatórios para Presenças

## Resumo do Problema

Os registos "fantasma" foram criados porque era possível guardar presenças com campos essenciais vazios (`shift`, `status`, `coach_id`). Para evitar isto no futuro, vamos adicionar validação obrigatória em **3 níveis**:

1. **Base de dados** (última linha de defesa)
2. **Edge Function** (validação servidor)
3. **Frontend** (feedback imediato ao utilizador)

---

## O Que Vai Mudar

### Campos Que Passam a Ser Obrigatórios

| Campo | Descrição |
|-------|-----------|
| `athlete_id` | Identificador do atleta |
| `date` | Data do treino |
| `shift` | Turno (Morning/Afternoon) |
| `status` | Estado (Present/Absent/Justified/Late) |
| `coach_id` | Treinador responsável |

---

## Implementação

### 1. Migração de Base de Dados

Criar uma nova migração SQL que:

- Adiciona constraints `NOT NULL` às colunas `shift`, `status`, e `coach_id`
- Define valores por defeito seguros (ex: `shift = 'Morning'`, `status = 'Present'`)
- Atualiza o trigger de duplicados para rejeitar registos incompletos

```text
+-------------------+
|   attendance      |
+-------------------+
| athlete_id  [REQ] |
| date        [REQ] |
| shift       [REQ] | <- Novo NOT NULL
| status      [REQ] | <- Novo NOT NULL
| coach_id    [REQ] | <- Novo NOT NULL
+-------------------+
```

### 2. Edge Function (attendance-admin)

Melhorar a validação no `POST` e `PATCH`:

- Rejeitar pedidos sem `shift`, `status` ou `coach_id`
- Retornar mensagens de erro claras em português

### 3. Frontend (BulkAttendanceRegistration)

Já tem validação para:
- Pelo menos 1 atleta selecionado
- Turno obrigatório

Adicionar:
- Validação visual (asterisco nos campos obrigatórios)
- Desabilitar botão "Registar" se faltar algum campo

---

## Secção Técnica

### Migração SQL

```sql
-- Primeiro: limpar registos antigos inválidos (os 9 restantes)
DELETE FROM attendance 
WHERE shift IS NULL AND status IS NULL AND coach_id IS NULL;

-- Adicionar constraints NOT NULL com defaults
ALTER TABLE attendance 
  ALTER COLUMN shift SET NOT NULL,
  ALTER COLUMN shift SET DEFAULT 'Morning';

ALTER TABLE attendance 
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'Present';

ALTER TABLE attendance 
  ALTER COLUMN coach_id SET NOT NULL;

-- Adicionar CHECK constraints para valores válidos
ALTER TABLE attendance 
  ADD CONSTRAINT chk_shift_values 
  CHECK (shift IN ('Morning', 'Afternoon'));

ALTER TABLE attendance 
  ADD CONSTRAINT chk_status_values 
  CHECK (status IN ('Present', 'Absent', 'Justified', 'Late'));
```

### Edge Function Updates

```typescript
// POST - validação reforçada
if (!body.shift || !['Morning', 'Afternoon'].includes(body.shift)) {
  return new Response(
    JSON.stringify({ error: "Turno obrigatório (Morning/Afternoon)" }), 
    { status: 400 }
  );
}

if (!body.status || !['Present', 'Absent', 'Justified', 'Late'].includes(body.status)) {
  return new Response(
    JSON.stringify({ error: "Estado obrigatório" }), 
    { status: 400 }
  );
}
```

### Ficheiros a Modificar

1. **Nova migração SQL** - constraints na base de dados
2. **`supabase/functions/attendance-admin/index.ts`** - validação servidor
3. **`src/components/coach/BulkAttendanceRegistration.tsx`** - UX melhorada
4. **`src/components/admin/CoachTrainingManagement.tsx`** - validação no admin

---

## Impacto

| Área | Antes | Depois |
|------|-------|--------|
| Registos fantasma | Possível criar | Impossível |
| Erros do utilizador | Falha silenciosa | Mensagem clara |
| Integridade dados | Parcial | Garantida |

---

## Riscos e Mitigação

| Risco | Mitigação |
|-------|-----------|
| Os 9 registos pendentes | Serão eliminados pela migração (já confirmámos que são duplicados) |
| Registos antigos sem shift/status | A migração só aplica NOT NULL após limpar os inválidos |


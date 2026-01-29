
# Plano: Limpeza de Registos de Presença Fantasma

## Parte 1 — Resolver Agora via SQL Editor (Live)

### Passo 1: Exportar registos antes de apagar
1. Abre o [SQL Editor do Supabase](https://supabase.com/dashboard/project/bzzzecvzoahauqrhkvds/sql/new)
2. **No canto inferior esquerdo, muda o ambiente para "Live"** (não "Test")
3. Cola e executa:

```sql
SELECT id, athlete_id, date
FROM attendance
WHERE shift IS NULL 
  AND status IS NULL 
  AND coach_id IS NULL
ORDER BY date, athlete_id;
```

4. Clica no botão **"Download CSV"** para guardar a lista de ~32.455 registos

### Passo 2: Eliminar registos fantasma
No mesmo SQL Editor (ambiente Live), executa:

```sql
DELETE FROM attendance
WHERE shift IS NULL
  AND status IS NULL
  AND coach_id IS NULL;
```

Resultado esperado: `~32.455 rows deleted`

### Passo 3: Corrigir registos antigos (shift = NULL mas com dados)
Ainda no SQL Editor (ambiente Live), executa:

```sql
UPDATE attendance a
SET shift = 'Morning'
WHERE a.shift IS NULL
  AND (a.status IS NOT NULL OR a.coach_id IS NOT NULL)
  AND NOT EXISTS (
    SELECT 1 FROM attendance b 
    WHERE b.athlete_id = a.athlete_id 
      AND b.date = a.date 
      AND lower(trim(b.shift)) = 'morning' 
      AND b.id <> a.id
  );
```

Resultado esperado: `~312 rows updated`

### Passo 4: Verificar
Confirma que não restam fantasmas:

```sql
SELECT COUNT(*) FROM attendance
WHERE shift IS NULL AND status IS NULL AND coach_id IS NULL;
```

Deve retornar `0`.

---

## Parte 2 — Criar Botão no Painel de Administração

### Objectivo
Permitir aos administradores:
1. Ver quantos registos fantasma existem
2. Exportar lista (CSV) com um clique
3. Eliminar todos os fantasmas com confirmação
4. Corrigir automaticamente registos antigos sem shift

### Alterações de Código

#### 1. Novo Componente: `GhostAttendanceCleanupCard.tsx`

Localização: `src/components/admin/GhostAttendanceCleanupCard.tsx`

Funcionalidades:
- Query para contar registos fantasma em tempo real
- Botão "Exportar CSV" que faz download dos IDs
- Botão "Limpar Fantasmas" com confirmação
- Botão "Corrigir Shift" para registos antigos
- Feedback visual (loading, sucesso, erro)

#### 2. Nova Edge Function: `cleanup-ghost-attendance`

Localização: `supabase/functions/cleanup-ghost-attendance/index.ts`

Endpoints:
- `GET /count` — retorna contagem de fantasmas e antigos sem shift
- `GET /export` — retorna lista de IDs para download
- `POST /delete` — apaga registos fantasma
- `POST /fix-shift` — actualiza registos antigos com shift = 'Morning'

Segurança:
- Usa service role para bypass de RLS
- Valida role = admin ou super_admin
- Gera log de auditoria

#### 3. Integrar no Dashboard de Administração

Ficheiro: `src/pages/admin/AdministrationDashboard.tsx`

- Importar e adicionar o `GhostAttendanceCleanupCard` na secção de gestão de presenças
- Posicionar antes do card de gestão de presenças existente

---

## Resumo Visual

```text
┌─────────────────────────────────────────────────────────────┐
│  Painel de Administração                                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │  🗑️ Limpeza de Presenças Fantasma                   │    │
│  │                                                     │    │
│  │  Fantasmas encontrados: 32.455                      │    │
│  │  Registos antigos sem turno: 312                    │    │
│  │                                                     │    │
│  │  [Exportar CSV]  [Limpar Fantasmas]  [Corrigir]     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  📅 Gestão de Presenças (existente)                 │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Ficheiros a Criar/Modificar

| Ficheiro | Acção |
|----------|-------|
| `src/components/admin/GhostAttendanceCleanupCard.tsx` | Criar |
| `supabase/functions/cleanup-ghost-attendance/index.ts` | Criar |
| `supabase/config.toml` | Adicionar função |
| `src/pages/admin/AdministrationDashboard.tsx` | Modificar |

---

## Notas Técnicas

- A Edge Function usa `SUPABASE_SERVICE_ROLE_KEY` para bypass de RLS
- O frontend usa `supabase.functions.invoke()` conforme padrão de segurança
- A autenticação segue o modelo legacy (localStorage) já implementado
- O componente invalida a query cache após operações
- Export CSV usa Blob API nativa do browser

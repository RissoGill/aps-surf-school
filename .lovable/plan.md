# Plano: Campos Obrigatórios para Presenças

## ✅ IMPLEMENTADO

### Alterações Realizadas

1. **Base de dados** - Migração aplicada:
   - `shift`, `status`, `coach_id` agora são `NOT NULL`
   - CHECK constraints para valores válidos (`Morning`/`Afternoon`, `Present`/`Absent`/`Justified`/`Late`)
   - 9 registos duplicados com shift NULL foram apagados
   - 38 registos com status 'Present ' (espaço extra) foram corrigidos

2. **Edge Function** (`attendance-admin`):
   - POST agora rejeita pedidos sem `shift` válido
   - Mensagens de erro em português

3. **Frontend** (`BulkAttendanceRegistration`):
   - Asteriscos vermelhos nos campos obrigatórios (Data, Turno, Atletas)


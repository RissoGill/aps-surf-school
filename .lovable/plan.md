

# Reorganizar Painel de Administração

## Resumo
Agrupar os cartões existentes em duas secções visuais com títulos:
1. **Gestão Diária Atletas e Treinadores** - Gerir Utilizadores, Gestão de Atletas, Gestão de Presenças, Gestão de Presenças por Treinador (CoachTrainingManagement)
2. **Gestão de Receitas** - Administração de Pagamentos, Conta Corrente Pro, Pagamento a Treinadores (CoachPaymentsCard)

Os restantes cartões (Ghost Cleanup, Alerts, Coach Messages, Expenses, Reports) ficam abaixo, fora dos grupos.

## Alterações

### `src/pages/admin/AdministrationDashboard.tsx`

1. **Separar `adminActions` em dois grupos:**
   - Grupo 1 (Gestão Diária): Users, Athletes, Attendance
   - Grupo 2 (Gestão de Receitas): Payments, Pro Account

2. **Reestruturar o JSX (linhas ~806-910):**
   - Secção "Gestão Diária Atletas e Treinadores" com Card wrapper:
     - Renderizar cartões de Users, Athletes, Attendance (do adminActions)
     - Mover `CoachTrainingManagement` para dentro desta secção
   - Secção "Gestão de Receitas" com Card wrapper:
     - Renderizar cartões de Payments e Pro Account (do adminActions)
     - Mover `CoachPaymentsCard` para dentro desta secção
   - Manter os restantes cartões (Ghost, Alerts, Messages, Expenses, Reports) abaixo

3. **Cada secção terá:** um `Card` container com título (`CardHeader`/`CardTitle`) e os sub-cartões dentro do `CardContent`

### Traduções (`pt.json` e `en.json`)
- `admin.management.dailyManagement`: "Gestão Diária Atletas e Treinadores" / "Daily Athletes & Coaches Management"
- `admin.management.revenueManagement`: "Gestão de Receitas" / "Revenue Management"


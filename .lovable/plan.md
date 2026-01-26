

# Plano: Gestão Expandida de Treinos por Treinador

## Objetivo
Adicionar funcionalidade à secção "Gestão de Presenças por Treinador" no painel de administração para permitir:
1. Expandir treinos para ver os atletas presentes
2. Editar registos de presença
3. Eliminar registos de presença
4. Acrescentar novos atletas a um treino existente

## Análise Actual

A secção actual em `AdministrationDashboard.tsx` (linhas 846-935) apenas mostra:
- Resumo mensal de dias de treino por treinador
- Resumo anual de dias de treino
- Sem detalhes dos atletas ou opções de gestão

## Arquitectura da Solução

### Novo Componente: `CoachAttendanceManagementCard.tsx`

Criar um componente dedicado que seguirá o padrão já implementado no `CoachDashboard.tsx` para treinos expansíveis, mas com funcionalidades de administração.

### Estrutura de Dados

```text
Coach (Treinador)
  └── Month (Mês)
        └── Training Session (Treino: data + turno)
              └── Athletes List (Lista de Atletas com acções)
```

### Fluxo de Utilizador

```text
1. Seleccionar Treinador
           ↓
2. Ver lista de meses com contagem de treinos
           ↓
3. Expandir mês → Ver treinos (data + turno)
           ↓
4. Expandir treino → Ver atletas presentes
           ↓
5. Acções disponíveis:
   • Editar presença (status, praia, notas)
   • Eliminar presença
   • Adicionar atleta ao treino
```

## Alterações Técnicas

### 1. Novo Componente: `src/components/admin/CoachTrainingManagement.tsx`

**Funcionalidades:**
- Dropdown para seleccionar treinador
- Lista expansível de meses (com `Collapsible`)
- Sub-lista expansível de treinos por data+turno
- Lista de atletas em cada treino com acções

**Estado interno:**
```typescript
// Estados de expansão
const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

// Dialogs de edição
const [editDialogOpen, setEditDialogOpen] = useState(false);
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
const [addAthleteDialogOpen, setAddAthleteDialogOpen] = useState(false);

// Registo seleccionado
const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
const [selectedSession, setSelectedSession] = useState<{date: string, shift: string, coachId: string} | null>(null);
```

**Query de dados:**
```typescript
const { data: attendanceData } = useQuery({
  queryKey: ['admin-coach-attendance', selectedCoach],
  queryFn: async () => {
    // Buscar presenças do treinador
    // Agrupar por mês → data+turno → atletas
    // Incluir nomes de atletas
  }
});
```

### 2. Agrupamento de Treinos

Seguir o padrão do `CoachDashboard.tsx`:
```typescript
// Chave de sessão: "YYYY-MM-DD_shift"
const sessionKey = `${record.date}_${record.shift || 'unknown'}`;

// Estrutura:
Record<string, // mês (YYYY-MM)
  Record<string, // sessionKey (data_turno)
    Array<{
      id: string;
      athleteId: string;
      athleteName: string;
      status: string;
      beachLocation: string;
      notes: string;
    }>
  >
>
```

### 3. Acções de Gestão

**Editar Presença:**
```typescript
const updateMutation = useMutation({
  mutationFn: async ({ id, updates }) => {
    const adminId = localStorage.getItem('adminId') || 'admin';
    await supabase.functions.invoke('attendance-admin', {
      method: 'PATCH',
      body: { id, updates, role: 'admin', userId: adminId }
    });
  }
});
```

**Eliminar Presença:**
```typescript
const deleteMutation = useMutation({
  mutationFn: async (id: string) => {
    const adminId = localStorage.getItem('adminId') || 'admin';
    await supabase.functions.invoke('attendance-admin', {
      method: 'DELETE',
      body: { id, role: 'admin', userId: adminId }
    });
  }
});
```

**Adicionar Atleta a Treino:**
```typescript
const addMutation = useMutation({
  mutationFn: async ({ athleteId, date, shift, coachId }) => {
    const adminId = localStorage.getItem('adminId') || 'admin';
    const newId = `${athleteId}-${date}`;
    await supabase.functions.invoke('attendance-admin', {
      method: 'POST',
      body: {
        id: newId,
        athlete_id: athleteId,
        date,
        shift,
        coach_id: coachId,
        status: 'Present',
        role: 'admin',
        userId: adminId
      }
    });
  }
});
```

### 4. UI dos Dialogs

**Dialog Editar Presença:**
- Status (Present/Absent/Justified)
- Praia
- Notas
- Turno (Morning/Afternoon)

**Dialog Adicionar Atleta:**
- Dropdown com todos os atletas
- Pesquisa por nome
- Filtrar atletas já no treino
- Status inicial: Present

**Dialog Confirmar Eliminação:**
- Confirmar eliminação com nome do atleta e data

### 5. Substituir Secção Actual

Em `AdministrationDashboard.tsx`, substituir a secção actual (linhas 846-935) pelo novo componente:

```tsx
{/* Coach Training Management - Enhanced */}
<div className="mt-6">
  <CoachTrainingManagement 
    userRole={userRole}
    athletes={athletes}
  />
</div>
```

### 6. Traduções Necessárias

**Português (`pt.json`):**
```json
"coachAttendance": {
  "title": "Gestão de Presenças por Treinador",
  "subtitle": "Ver e gerir treinos por treinador",
  "expandMonth": "Expandir mês",
  "collapseMonth": "Recolher mês",
  "trainingSessions": "Treinos",
  "athletes": "Atletas",
  "addAthlete": "Adicionar Atleta",
  "editAttendance": "Editar Presença",
  "deleteAttendance": "Eliminar Presença",
  "confirmDelete": "Confirmar Eliminação",
  "deleteDescription": "Tem a certeza que deseja eliminar a presença de {athleteName} no dia {date}?",
  "noTrainings": "Sem treinos neste mês",
  "searchAthlete": "Pesquisar atleta...",
  "athleteAlreadyInTraining": "Este atleta já está neste treino",
  "addToTraining": "Adicionar ao Treino",
  "morning": "Manhã",
  "afternoon": "Tarde",
  "beach": "Praia",
  "notes": "Notas",
  "status": "Estado",
  "present": "Presente",
  "absent": "Ausente",
  "justified": "Justificado"
}
```

**Inglês (`en.json`):**
```json
"coachAttendance": {
  "title": "Coach Attendance Management",
  "subtitle": "View and manage trainings by coach",
  "expandMonth": "Expand month",
  "collapseMonth": "Collapse month",
  "trainingSessions": "Training Sessions",
  "athletes": "Athletes",
  "addAthlete": "Add Athlete",
  "editAttendance": "Edit Attendance",
  "deleteAttendance": "Delete Attendance",
  "confirmDelete": "Confirm Deletion",
  "deleteDescription": "Are you sure you want to delete the attendance of {athleteName} on {date}?",
  "noTrainings": "No trainings this month",
  "searchAthlete": "Search athlete...",
  "athleteAlreadyInTraining": "This athlete is already in this training",
  "addToTraining": "Add to Training",
  "morning": "Morning",
  "afternoon": "Afternoon",
  "beach": "Beach",
  "notes": "Notes",
  "status": "Status",
  "present": "Present",
  "absent": "Absent",
  "justified": "Justified"
}
```

## Ficheiros a Criar/Modificar

| Ficheiro | Acção |
|----------|-------|
| `src/components/admin/CoachTrainingManagement.tsx` | **Criar** - Novo componente |
| `src/pages/admin/AdministrationDashboard.tsx` | **Modificar** - Substituir secção actual |
| `src/i18n/translations/pt.json` | **Modificar** - Adicionar traduções |
| `src/i18n/translations/en.json` | **Modificar** - Adicionar traduções |

## Design Visual

A interface seguirá o padrão já existente no `CoachDashboard.tsx` (linhas 1861-1982):
- Cards expansíveis por mês com chevron animado
- Sub-cards por treino com data, dia da semana e turno
- Cores diferenciadas por turno (Manhã: âmbar, Tarde: azul)
- Lista de atletas com ícones de acção (editar, eliminar)
- Botão "Adicionar Atleta" em cada treino
- Badges com contagem de atletas

## Validações

1. Verificar se atleta já existe no treino antes de adicionar
2. Validar permissões de admin antes de operações
3. Prevenir duplicados (mesmo atleta + data + turno)
4. Actualizar contagem de tokens do pack quando aplicável

## Estimativa

- **Complexidade**: Média-Alta
- **Componente principal**: ~400 linhas
- **Dialogs**: ~200 linhas
- **Traduções**: ~60 chaves


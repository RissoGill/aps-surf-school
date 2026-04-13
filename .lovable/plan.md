

# Nova Página "Gestão Diária Atletas e Treinadores"

## Resumo
Converter a secção colapsável "Gestão Diária Atletas e Treinadores" num cartão de navegação (igual ao de Receitas) que abre uma nova página `/admin/daily-management`. A página mostra apenas os cartões de acção (Utilizadores, Atletas, Presenças) e o componente `CoachTrainingManagement`, sem cartões financeiros.

## Alterações

### 1. Criar `src/pages/admin/DailyManagement.tsx`
- `AppHeader` com título "Gestão Diária Atletas e Treinadores" e botão voltar para `/dashboard/administration`
- Grid com os 3 cartões de acção (Utilizadores → `/admin/users`, Atletas → `/admin/athletes`, Presenças → `/admin/attendance`)
- Componente `CoachTrainingManagement` por baixo
- Recebe `userRole` e `athletes` via query própria (reutilizar as mesmas queries do dashboard)

### 2. Editar `src/pages/admin/AdministrationDashboard.tsx`
- Remover o bloco `Collapsible` de "Gestão Diária" (linhas 773-839)
- Substituir por um cartão simples clicável com `ArrowRight` que navega para `/admin/daily-management` (igual ao de Receitas)
- Remover imports desnecessários (`Collapsible`, `CollapsibleContent`, `CollapsibleTrigger`, `ChevronDown`, `CoachTrainingManagement` se já não usado)

### 3. Editar `src/App.tsx`
- Adicionar rota `/admin/daily-management` → `DailyManagement`


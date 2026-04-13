

# Adicionar opção de ver histórico nos Alertas e Mensagens dos Treinadores

## Problema
Atualmente, ambos os cartões mostram todos os registos (ativos + resolvidos) misturados. O utilizador quer poder ver apenas os ativos por defeito e ter um botão/toggle para ver o histórico (resolvidos).

## Solução

### 1. `AlertsManagementCard.tsx`
- Adicionar estado `showHistory` (default: `false`)
- Por defeito, filtrar apenas alertas com `is_resolved === false` (ativos/pendentes)
- Adicionar botão "Ver Histórico" / "Ocultar Histórico" no header do cartão
- Quando `showHistory === true`, mostrar todos os alertas (incluindo resolvidos)
- Atualizar texto "Sem alertas ativos" para refletir o contexto

### 2. `CoachMessagesManagementCard.tsx`
- O filtro de status já existe (`all`/`pending`/`resolved`), mas o default é `all`
- Mudar o default de `statusFilter` de `"all"` para `"pending"`
- Adicionar botão "Ver Histórico" que alterna para mostrar todos/resolvidos
- Ou simplesmente: adicionar um botão toggle que alterna entre mostrar apenas pendentes e mostrar tudo (incluindo resolvidos)

### 3. Traduções (`pt.json` e `en.json`)
- Adicionar chaves: `admin.alerts.showHistory`, `admin.alerts.hideHistory`
- Adicionar chaves: `admin.coachMessages.showHistory`, `admin.coachMessages.hideHistory`

## Detalhe técnico

**AlertsManagementCard**: Novo estado `showHistory`. Filtrar `alerts` com `.filter(a => showHistory || !a.is_resolved)` antes de renderizar. Botão com ícone `History` do lucide-react.

**CoachMessagesManagementCard**: Novo estado `showHistory` (default false). Quando false, forçar `statusFilter` a "pending". Quando true, mostrar o filtro existente com todas as opções. Botão toggle com ícone `History`.

4 ficheiros a editar: `AlertsManagementCard.tsx`, `CoachMessagesManagementCard.tsx`, `pt.json`, `en.json`.


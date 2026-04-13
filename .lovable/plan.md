

# Restaurar cartões de Alertas e Mensagens no painel de administração

## Problema
Os componentes `AlertsManagementCard` e `CoachMessagesManagementCard` estão importados mas não são renderizados no JSX do `AdministrationDashboard.tsx`.

## Solução
Adicionar ambos os cartões no dashboard, logo após o cartão de header da administração (linha 747) e antes dos stats de atletas (linha 752), mantendo a posição de destaque.

## Alteração

**`src/pages/admin/AdministrationDashboard.tsx`** — Inserir após `</Card>` do admin header (linha 747):

```tsx
{/* Alerts Management */}
<AlertsManagementCard />

{/* Coach Messages */}
<CoachMessagesManagementCard />
```

Apenas 1 ficheiro, 2 linhas de código a adicionar.


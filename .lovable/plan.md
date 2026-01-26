
# Plano: Badge "Pendente" a Vermelho

## Problema Identificado

O badge com o texto "Pendente" aparece a azul no painel de administração quando deveria estar a vermelho para melhor visibilidade. No painel do treinador, o estilo vermelho já foi implementado para mensagens não lidas.

## Alterações Necessárias

### 1. Painel de Administração - CoachMessagesManagementCard.tsx

**Ficheiro:** `src/components/admin/CoachMessagesManagementCard.tsx`

**Alteração na Linha 488:**
Mudar o variant do Badge de "default" para "destructive" quando a mensagem está pendente:

```tsx
// De:
<Badge variant={msg.is_resolved ? "secondary" : "default"} className="text-xs">

// Para:
<Badge variant={msg.is_resolved ? "secondary" : "destructive"} className="text-xs">
```

Isto fará com que:
- **Pendente** → Badge vermelho (`variant="destructive"`)
- **Resolvido** → Badge cinzento (`variant="secondary"`)

### 2. Painel do Treinador - CoachMessagesCard.tsx

**Ficheiro:** `src/components/coach/CoachMessagesCard.tsx`

O badge "Pendente" na linha 281-284 também deve estar vermelho, não apenas o badge "Por Ler". 

**Alteração na Linha 280-284:**
Mudar para usar `variant="destructive"` no badge de mensagens pendentes:

```tsx
// De:
{pendingCount > 0 && unreadCount === 0 && (
  <Badge variant="secondary">
    {pendingCount} {t('coach.messages.pending')}
  </Badge>
)}

// Para:
{pendingCount > 0 && unreadCount === 0 && (
  <Badge variant="destructive">
    {pendingCount} {t('coach.messages.pending')}
  </Badge>
)}
```

E na lista de mensagens (linha ~374):
```tsx
// De:
<Badge variant={msg.is_resolved ? "outline" : "default"} className="text-xs">

// Para:
<Badge variant={msg.is_resolved ? "outline" : "destructive"} className="text-xs">
```

## Resumo das Alterações

| Local | Badge | Antes | Depois |
|-------|-------|-------|--------|
| Admin - Lista de mensagens | Pendente | Azul (default) | Vermelho (destructive) |
| Coach - Cabeçalho | X Pendentes | Cinzento (secondary) | Vermelho (destructive) |
| Coach - Lista de mensagens | Pendente | Azul (default) | Vermelho (destructive) |

## Ficheiros a Modificar

1. **src/components/admin/CoachMessagesManagementCard.tsx** - Linha 488
2. **src/components/coach/CoachMessagesCard.tsx** - Linhas 281 e ~374

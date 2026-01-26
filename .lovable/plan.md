
# Plano: Adicionar Ícone ao Badge "Por Ler"

## Objetivo
Adicionar um ícone antes do texto no badge "Por Ler" (unread) para melhorar a visibilidade e consistência visual.

## Alteração

### Ficheiro: src/components/coach/CoachMessagesCard.tsx

**Linhas 372-375** - Adicionar ícone `Mail` ou `MessageSquare` dentro do Badge:

```tsx
// De:
{!msg.read_by_coach && (
  <Badge variant="destructive" className="text-xs">
    {t('coach.messages.unread')}
  </Badge>
)}

// Para:
{!msg.read_by_coach && (
  <Badge variant="destructive" className="text-xs flex items-center gap-1">
    <Mail className="h-3 w-3" />
    {t('coach.messages.unread')}
  </Badge>
)}
```

### Import necessário

Adicionar `Mail` à lista de imports do lucide-react (linha 2):

```tsx
import { MessageSquare, Plus, Send, Clock, Check, X, ChevronDown, ChevronUp, Mail } from "lucide-react";
```

## Resultado Visual

| Antes | Depois |
|-------|--------|
| `Por Ler` | `📧 Por Ler` |

O ícone `Mail` foi escolhido porque representa uma mensagem nova/não lida, sendo intuitivo para o utilizador.

## Ficheiros a Modificar

1. **src/components/coach/CoachMessagesCard.tsx** - Linhas 2 e 372-375

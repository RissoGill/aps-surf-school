

# Plano: Adicionar Ícone Mail ao Botão "Nova Mensagem" no Painel de Administração

## Problema Identificado

O botão "Nova Mensagem" no painel de administração (`CoachMessagesManagementCard.tsx`) está a usar o ícone `Send` em vez do ícone `Mail`, criando inconsistência visual com o painel do treinador.

## Alterações Necessárias

### Ficheiro: src/components/admin/CoachMessagesManagementCard.tsx

**1. Adicionar import do ícone Mail (Linha 2):**

```tsx
// De:
import { MessageSquare, Send, Clock, Check, Filter, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";

// Para:
import { MessageSquare, Send, Clock, Check, Filter, ChevronDown, ChevronUp, RefreshCw, Mail } from "lucide-react";
```

**2. Substituir ícone no botão (Linhas 344-347):**

```tsx
// De:
<Button variant="default" size="sm" onClick={() => setShowNewMessageForm(!showNewMessageForm)}>
  <Send className="h-4 w-4 mr-1" />
  {t('admin.coachMessages.newMessage')}
</Button>

// Para:
<Button variant="default" size="sm" onClick={() => setShowNewMessageForm(!showNewMessageForm)}>
  <Mail className="h-4 w-4 mr-1" />
  {t('admin.coachMessages.newMessage')}
</Button>
```

## Resultado Visual

| Antes | Depois |
|-------|--------|
| ➤ Nova Mensagem | 📧 Nova Mensagem |

## Ficheiros a Modificar

1. **src/components/admin/CoachMessagesManagementCard.tsx** - Linhas 2 e 345


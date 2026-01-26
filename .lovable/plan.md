
# Plano: Mensagens Não Lidas a Vermelho

## Objetivo
Quando a administração responde a uma mensagem, essa mensagem deve aparecer destacada a vermelho até que o treinador a abra e "leia".

## Alterações Necessárias

### 1. Base de Dados - Nova Coluna

Adicionar coluna `read_by_coach` à tabela `coach_messages`:

```text
coach_messages
└── read_by_coach (boolean, default: true)
    - true = mensagem lida pelo treinador
    - false = tem respostas novas da administração por ler
```

**Lógica:**
- Quando o treinador cria uma mensagem: `read_by_coach = true` (ele próprio criou)
- Quando a administração responde: `read_by_coach = false` (notificar treinador)
- Quando o treinador expande a mensagem: `read_by_coach = true` (marcada como lida)

### 2. Trigger Automático

Criar trigger que automaticamente marca `read_by_coach = false` quando:
- Uma nova resposta é inserida em `coach_message_replies`
- E o `sender_type = 'admin'`

### 3. Componente CoachMessagesCard

**Ficheiro:** `src/components/coach/CoachMessagesCard.tsx`

Alterações visuais para mensagens não lidas:
- Borda do cartão da mensagem: `border-red-500` em vez de `border`
- Fundo: `bg-red-50` para destaque suave
- Badge "Por Ler" a vermelho junto ao assunto
- Ícone `Clock` em vermelho em vez de âmbar

**Função para marcar como lida:**
- Quando o treinador clica para expandir uma mensagem
- Chamar mutation para atualizar `read_by_coach = true`

### 4. Contador de Não Lidas

Atualizar o contador no cabeçalho do cartão:
- Mostrar quantidade de mensagens não lidas (em vez de apenas "pending")
- Badge a vermelho com texto "X Por Ler"

## Detalhes Técnicos

### Migração SQL

```sql
-- Adicionar coluna
ALTER TABLE public.coach_messages 
ADD COLUMN read_by_coach boolean NOT NULL DEFAULT true;

-- Trigger para marcar como não lida quando admin responde
CREATE OR REPLACE FUNCTION public.mark_message_unread_on_admin_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.sender_type = 'admin' THEN
    UPDATE public.coach_messages 
    SET read_by_coach = false 
    WHERE id = NEW.message_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_admin_reply_mark_unread
  AFTER INSERT ON public.coach_message_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.mark_message_unread_on_admin_reply();
```

### Alterações no Componente

**Interface atualizada:**
```typescript
interface CoachMessage {
  // ... campos existentes
  read_by_coach: boolean;
}
```

**Mutation para marcar como lida:**
```typescript
const markAsReadMutation = useMutation({
  mutationFn: async (messageId: string) => {
    await supabase
      .from('coach_messages')
      .update({ read_by_coach: true })
      .eq('id', messageId);
  }
});
```

**Estilo condicional:**
```tsx
<div className={`border rounded-lg p-3 ${
  !msg.read_by_coach 
    ? 'border-red-500 bg-red-50' 
    : ''
}`}>
```

### Traduções

Adicionar aos ficheiros de tradução:
- `pt.json`: `"unread": "Por Ler"`
- `en.json`: `"unread": "Unread"`

## Ficheiros a Modificar

1. **Nova migração SQL** - Adicionar coluna e trigger
2. **src/components/coach/CoachMessagesCard.tsx** - Estilo vermelho + marcar como lida
3. **src/i18n/translations/pt.json** - Nova chave de tradução
4. **src/i18n/translations/en.json** - Nova chave de tradução

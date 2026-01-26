
# Plano de Implementação: Sistema de Mensagens Treinador-Administração

## Resumo

Criar um sistema de mensagens bidireccional que permite aos treinadores enviar mensagens para a administração, com histórico de conversas, respostas e gestão de estados (resolvido/pendente).

## Arquitectura Proposta

O sistema utilizará uma nova tabela `coach_messages` para armazenar as mensagens e respostas, separada do sistema de alertas existente (que é unidireccional: admin → utilizadores).

### Fluxo de Comunicação

```text
+----------------+                    +----------------------+
|   Treinador    |  Envia mensagem    |   Administração     |
|   Dashboard    | -----------------> |     Dashboard        |
+----------------+                    +----------------------+
        ^                                      |
        |         Responde                     |
        +--------------------------------------+
                                               |
                                    Marca como resolvido
```

## 1. Alterações na Base de Dados

### Nova Tabela: `coach_messages`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Chave primária |
| `coach_id` | text | ID do treinador (ex: T01) |
| `subject` | text | Assunto da mensagem |
| `message` | text | Conteúdo da mensagem |
| `is_resolved` | boolean | Estado (resolvido/pendente) |
| `resolved_at` | timestamp | Data de resolução |
| `resolved_by` | text | Admin que resolveu |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Última atualização |

### Nova Tabela: `coach_message_replies`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Chave primária |
| `message_id` | uuid | FK para coach_messages |
| `sender_type` | text | 'coach' ou 'admin' |
| `sender_id` | text | ID do remetente |
| `content` | text | Conteúdo da resposta |
| `created_at` | timestamp | Data de criação |

### Políticas RLS

- Treinadores podem ver/criar mensagens onde `coach_id` = seu ID
- Treinadores podem criar respostas nas suas mensagens
- Administradores podem ver/editar todas as mensagens
- Administradores podem criar respostas em qualquer mensagem
- Acesso anónimo para compatibilidade com autenticação legacy

## 2. Novos Componentes

### A. Componente do Treinador: `CoachMessagesCard`

**Localização:** `src/components/coach/CoachMessagesCard.tsx`

**Funcionalidades:**
- Botão para criar nova mensagem
- Lista de mensagens enviadas com estados (Pendente/Resolvido)
- Ver histórico de respostas de cada mensagem
- Responder a mensagens existentes
- Contador de mensagens pendentes

**Interface:**
```text
+-----------------------------------------------+
| 💬 Mensagens para Administração    [+ Nova]   |
+-----------------------------------------------+
| ⚡ Equipamento danificado           Pendente  |
|    Enviada: 25/01/2026                        |
|    [Ver Respostas] [Responder]                |
+-----------------------------------------------+
| ✓ Férias em Fevereiro              Resolvido  |
|    Enviada: 20/01/2026                        |
|    [Ver Respostas]                            |
+-----------------------------------------------+
```

### B. Componente do Admin: `CoachMessagesManagementCard`

**Localização:** `src/components/admin/CoachMessagesManagementCard.tsx`

**Funcionalidades:**
- Lista todas as mensagens de todos os treinadores
- Filtro por estado (Pendente/Resolvido)
- Filtro por treinador
- Ver histórico de conversa
- Responder a mensagens
- Marcar como resolvido/não resolvido
- Badge de contagem de mensagens pendentes

**Interface:**
```text
+----------------------------------------------------------+
| 💬 Mensagens dos Treinadores                    🔴 3     |
| Comunicação com os treinadores                           |
+----------------------------------------------------------+
| Filtros: [Todos ▼] [Pendentes ▼]                         |
+----------------------------------------------------------+
| T01 - Nuno Telmo                                         |
| Assunto: Equipamento danificado                 Pendente |
| "Olá, preciso reportar que..."                           |
| 25/01/2026                                               |
| [Ver Conversa] [Responder] [✓ Resolver]                  |
+----------------------------------------------------------+
```

## 3. Ficheiros a Modificar

| Ficheiro | Alteração |
|----------|-----------|
| `src/pages/coach/CoachDashboard.tsx` | Adicionar `CoachMessagesCard` após `AlertsCard` |
| `src/pages/admin/AdministrationDashboard.tsx` | Adicionar `CoachMessagesManagementCard` após `AlertsManagementCard` |
| `src/i18n/translations/pt.json` | Adicionar traduções para mensagens |
| `src/i18n/translations/en.json` | Adicionar traduções para mensagens |

## 4. Ficheiros a Criar

| Ficheiro | Descrição |
|----------|-----------|
| `src/components/coach/CoachMessagesCard.tsx` | Cartão de mensagens para treinadores |
| `src/components/admin/CoachMessagesManagementCard.tsx` | Gestão de mensagens no painel admin |

## 5. Migração de Base de Dados

```sql
-- Tabela principal de mensagens
CREATE TABLE public.coach_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  is_resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamp with time zone,
  resolved_by text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela de respostas
CREATE TABLE public.coach_message_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.coach_messages(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('coach', 'admin')),
  sender_id text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_coach_messages_coach_id ON public.coach_messages(coach_id);
CREATE INDEX idx_coach_messages_is_resolved ON public.coach_messages(is_resolved);
CREATE INDEX idx_coach_message_replies_message_id ON public.coach_message_replies(message_id);

-- RLS
ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_message_replies ENABLE ROW LEVEL SECURITY;

-- Políticas para suportar autenticação legacy (anónima)
CREATE POLICY "Anyone can view coach messages" ON public.coach_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can insert coach messages" ON public.coach_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update coach messages" ON public.coach_messages FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete coach messages" ON public.coach_messages FOR DELETE USING (true);

CREATE POLICY "Anyone can view coach message replies" ON public.coach_message_replies FOR SELECT USING (true);
CREATE POLICY "Anyone can insert coach message replies" ON public.coach_message_replies FOR INSERT WITH CHECK (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_coach_message_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_coach_messages_updated_at
  BEFORE UPDATE ON public.coach_messages
  FOR EACH ROW EXECUTE FUNCTION update_coach_message_timestamp();
```

## 6. Traduções a Adicionar

### Português (pt.json)

```json
{
  "coach": {
    "messages": {
      "title": "Mensagens para Administração",
      "description": "Envie mensagens e comunique com a administração",
      "new": "Nova Mensagem",
      "subject": "Assunto",
      "subjectPlaceholder": "Escreva o assunto...",
      "message": "Mensagem",
      "messagePlaceholder": "Escreva a sua mensagem...",
      "send": "Enviar",
      "cancel": "Cancelar",
      "pending": "Pendente",
      "resolved": "Resolvido",
      "viewReplies": "Ver Respostas",
      "reply": "Responder",
      "replyPlaceholder": "Escreva a sua resposta...",
      "noMessages": "Nenhuma mensagem enviada",
      "sent": "Enviada",
      "conversation": "Conversa",
      "you": "Você",
      "admin": "Administração",
      "messageSent": "Mensagem enviada com sucesso",
      "replySent": "Resposta enviada com sucesso",
      "sendError": "Erro ao enviar mensagem"
    }
  },
  "admin": {
    "coachMessages": {
      "title": "Mensagens dos Treinadores",
      "description": "Comunicação com os treinadores",
      "filterAll": "Todos",
      "filterPending": "Pendentes",
      "filterResolved": "Resolvidos",
      "filterByCoach": "Por Treinador",
      "allCoaches": "Todos os Treinadores",
      "noMessages": "Nenhuma mensagem dos treinadores",
      "viewConversation": "Ver Conversa",
      "reply": "Responder",
      "markResolved": "Marcar Resolvido",
      "markPending": "Reabrir",
      "replyPlaceholder": "Escreva a sua resposta...",
      "from": "De",
      "coach": "Treinador",
      "replySent": "Resposta enviada",
      "statusUpdated": "Estado atualizado"
    }
  }
}
```

## 7. Ordem de Implementação

1. **Migração de BD** - Criar tabelas e políticas RLS
2. **Componente Treinador** - `CoachMessagesCard.tsx`
3. **Integração Treinador** - Adicionar ao `CoachDashboard.tsx`
4. **Componente Admin** - `CoachMessagesManagementCard.tsx`
5. **Integração Admin** - Adicionar ao `AdministrationDashboard.tsx`
6. **Traduções** - Actualizar ficheiros pt.json e en.json
7. **Testes** - Testar fluxo completo de envio e resposta

## 8. Detalhes Técnicos

### Validação de Input

Todas as mensagens serão validadas com:
- Assunto: mínimo 3 caracteres, máximo 100
- Mensagem/Resposta: mínimo 10 caracteres, máximo 2000
- Sanitização HTML para prevenir XSS

### Real-time Updates

Adicionar subscrições Supabase para:
- Notificar treinadores de novas respostas
- Actualizar lista de mensagens no admin quando novas mensagens chegam

### Compatibilidade Legacy

O sistema mantém compatibilidade com autenticação localStorage:
- Treinador identificado via `coach_session` do localStorage
- Admin identificado via `adminSession` do localStorage
- RLS permite acesso anónimo (segurança ao nível da aplicação)

## Resumo Visual

```text
┌─────────────────────────────────────────────────────────────┐
│                    TREINADOR DASHBOARD                       │
├─────────────────────────────────────────────────────────────┤
│  AlertsCard (existente - alertas da admin)                  │
├─────────────────────────────────────────────────────────────┤
│  CoachMessagesCard (NOVO - mensagens para admin)            │
│  ├── Lista de mensagens enviadas                            │
│  ├── Criar nova mensagem                                    │
│  ├── Ver respostas                                          │
│  └── Responder                                              │
├─────────────────────────────────────────────────────────────┤
│  BulkAttendanceRegistration (existente)                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD                           │
├─────────────────────────────────────────────────────────────┤
│  AlertsManagementCard (existente - alertas para users)      │
├─────────────────────────────────────────────────────────────┤
│  CoachMessagesManagementCard (NOVO - mensagens de coaches)  │
│  ├── Lista de todas as mensagens                            │
│  ├── Filtros (estado, treinador)                            │
│  ├── Ver conversa completa                                  │
│  ├── Responder                                              │
│  └── Marcar como resolvido                                  │
├─────────────────────────────────────────────────────────────┤
│  CoachPaymentsCard (existente)                              │
└─────────────────────────────────────────────────────────────┘
```

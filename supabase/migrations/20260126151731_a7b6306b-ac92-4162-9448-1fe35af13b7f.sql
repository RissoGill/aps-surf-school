-- Criar função para o trigger primeiro
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

-- Tabela principal de mensagens dos treinadores
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

-- Tabela de respostas às mensagens
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

-- Habilitar RLS
ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_message_replies ENABLE ROW LEVEL SECURITY;

-- Políticas para suportar autenticação legacy (anónima)
CREATE POLICY "Anyone can view coach messages" ON public.coach_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can insert coach messages" ON public.coach_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update coach messages" ON public.coach_messages FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete coach messages" ON public.coach_messages FOR DELETE USING (true);

CREATE POLICY "Anyone can view coach message replies" ON public.coach_message_replies FOR SELECT USING (true);
CREATE POLICY "Anyone can insert coach message replies" ON public.coach_message_replies FOR INSERT WITH CHECK (true);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_coach_messages_updated_at
  BEFORE UPDATE ON public.coach_messages
  FOR EACH ROW EXECUTE FUNCTION update_coach_message_timestamp();
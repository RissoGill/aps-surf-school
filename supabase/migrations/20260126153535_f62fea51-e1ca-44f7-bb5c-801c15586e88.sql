-- Adicionar coluna read_by_coach
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
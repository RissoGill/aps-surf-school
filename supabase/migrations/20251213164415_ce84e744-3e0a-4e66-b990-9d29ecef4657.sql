-- Add prior_balance column to atletas table for tracking debt before September 2025
ALTER TABLE public.atletas 
ADD COLUMN IF NOT EXISTS prior_balance NUMERIC DEFAULT 0;

COMMENT ON COLUMN public.atletas.prior_balance IS 'Saldo em dívida anterior a Setembro 2025';
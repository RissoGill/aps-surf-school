-- Add invoice_number and entity columns to payments table
ALTER TABLE payments 
ADD COLUMN invoice_number TEXT,
ADD COLUMN entity TEXT;
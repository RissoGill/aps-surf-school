-- Passo 1: Apagar registos duplicados com shift NULL
DELETE FROM attendance WHERE shift IS NULL;

-- Passo 2: Corrigir status com espaços extra (trim)
UPDATE attendance SET status = TRIM(status) WHERE status != TRIM(status);

-- Passo 3: Corrigir shift com espaços extra (trim)
UPDATE attendance SET shift = TRIM(shift) WHERE shift != TRIM(shift);

-- Passo 4: Corrigir registo com coach_id NULL
UPDATE attendance 
SET coach_id = (SELECT coach_id FROM coach WHERE status = true LIMIT 1)
WHERE coach_id IS NULL;

-- Passo 5: Adicionar constraints NOT NULL
ALTER TABLE attendance 
  ALTER COLUMN shift SET NOT NULL,
  ALTER COLUMN shift SET DEFAULT 'Morning';

ALTER TABLE attendance 
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'Present';

ALTER TABLE attendance 
  ALTER COLUMN coach_id SET NOT NULL;

-- Passo 6: Adicionar CHECK constraints para valores válidos
ALTER TABLE attendance 
  ADD CONSTRAINT chk_shift_values 
  CHECK (shift IN ('Morning', 'Afternoon'));

ALTER TABLE attendance 
  ADD CONSTRAINT chk_status_values 
  CHECK (status IN ('Present', 'Absent', 'Justified', 'Late'));
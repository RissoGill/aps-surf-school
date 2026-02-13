-- Remove the RESTRICTIVE admin update policy that blocks legacy auth
DROP POLICY IF EXISTS "Admins can update athlete records" ON atletas;
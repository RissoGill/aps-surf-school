-- Update athlete A01 to use the correct guardian ID from guardians table
UPDATE public."Atletas"
SET guardian_id = '8c7351eb-1bed-4d31-9fe4-be3f362c16dc'
WHERE athlete_id = 'A01' AND guardian_id = '30755b3d-4e34-4e5a-8077-8d9f3cdc008f';
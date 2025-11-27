-- Simplify IDs by removing @aps.com domain
UPDATE coach 
SET coach_user_id = REPLACE(coach_user_id, '@aps.com', '')
WHERE coach_user_id LIKE '%@aps.com';

UPDATE users 
SET athlete_user_id = REPLACE(athlete_user_id, '@aps.com', '')
WHERE athlete_user_id LIKE '%@aps.com';

UPDATE users 
SET guardian_id = REPLACE(guardian_id, '@aps.com', '')
WHERE guardian_id LIKE '%@aps.com';
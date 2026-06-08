## Plan

The upload is still failing because Supabase is returning:

`new row violates row-level security policy`

That means the frontend can now send the PNG correctly, but the database/storage policy still blocks inserting the uploaded file into the `news-flyers` bucket.

### 1. Apply the missing Storage RLS migration
- Add/ensure a permissive `INSERT` policy on `storage.objects` for `bucket_id = 'news-flyers'`.
- Add/ensure matching `UPDATE` and `DELETE` policies for the same bucket so admins can replace/remove flyers later.
- Keep public read access for flyer display.

### 2. Ensure `public.news` still supports legacy admin writes
- Confirm the `news` table policies allow anonymous/legacy admin insert, update, and delete because this project uses localStorage admin sessions, not Supabase Auth.
- Keep `.limit(10000)` on admin/news queries.

### 3. Validate frontend upload handling
- Keep the existing image validation and `contentType: file.type` upload option.
- If needed, improve the displayed error so it shows the Supabase reason instead of a generic upload failure.

### Important note
Supabase access is currently expired in Lovable, so I can prepare/apply the code and migration file, but the live database policy will only take effect after Supabase is reconnected and the migration is run. Until that policy is active in Supabase, the upload will continue to fail.
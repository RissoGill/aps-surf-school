

# Fix: Frontend not sending userId to create-pack

## Root Cause

The edge function works correctly when called directly (tested with curl — returned 403 "Admin role required" which means it parsed userId correctly). The logs show "Missing userId in request body", confirming the **frontend is sending an empty/undefined userId**.

This happens because `adminSession.id` resolves to `undefined` — the user's cached localStorage session may not contain the `id` field, or the admin_id value from the database is empty for this user.

## Fix

### 1. Add debug logging to `supabase/functions/create-pack/index.ts`

Log the full received body immediately after parsing so we can see exactly what the frontend sends:

```typescript
body = await req.json();
console.log('create-pack received body keys:', Object.keys(body), 'userId:', body.userId, 'role:', body.role);
```

### 2. Add debug logging + robust session fallback in `src/pages/admin/PaymentManagement.tsx`

Before invoking the function, log what the session contains. Also add a fallback that reads `admin_id` from the `users` table query stored elsewhere:

```typescript
const adminSession = JSON.parse(localStorage.getItem('adminSession') || '{}');
console.log('adminSession contents:', JSON.stringify(adminSession));
const userId = adminSession.id || adminSession.userId || adminSession.adminId || adminSession.admin_id || adminSession.email;
console.log('Resolved userId:', userId, 'role:', role);
```

Also add `admin_id` as a fallback key (the users table column name).

### 3. Redeploy edge function

Redeploy `create-pack` after adding the debug log.

### Summary
- 2 files changed
- Adds debug logging to both frontend and edge function to identify exactly why userId is empty
- Adds `admin_id` as additional session key fallback
- After this deploy, the user attempts pack creation again and we check console/logs for the actual values


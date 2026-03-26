

# Fix create-pack Edge Function: Legacy Auth Compatibility

## Problem

The `create-pack` edge function uses `supabaseClient.auth.getUser()` to authenticate, but the admin uses legacy localStorage-based authentication (not Supabase Auth). This causes "invalid claim: missing sub claim" errors, blocking pack creation.

## Solution

Adopt the same legacy auth pattern used by `attendance-admin`: accept `role` and `userId` in the request body, verify against the `users` table using the service role client.

### 1. `supabase/functions/create-pack/index.ts`

Replace the Supabase Auth validation (lines 34-81) with legacy auth:
- Remove `supabaseClient` (user-context client) entirely
- Parse `role` and `userId` from the request body alongside existing fields
- Verify admin credentials against the `users` table using `supabaseAdmin` (service role)
- Keep all existing pack creation logic unchanged

```typescript
// Instead of auth.getUser(), do:
const { role, userId, athleteId, planType, paymentDate, paymentId } = body;

// Verify admin in users table
const { data: adminData } = await supabaseAdmin
  .from('users')
  .select('admin_id, admin_role')
  .eq('admin_id', userId)
  .single();

if (!adminData || !['admin', 'super_admin'].includes(adminData.admin_role)) {
  return 403 Forbidden;
}
```

### 2. `src/pages/admin/PaymentManagement.tsx` (~line 315)

Pass legacy auth credentials in the function invoke body:

```typescript
const adminSession = JSON.parse(localStorage.getItem('adminSession') || '{}');
await supabase.functions.invoke('create-pack', {
  body: {
    athleteId, planType, paymentDate, paymentId,
    role: adminSession.role || 'admin',
    userId: adminSession.userId || adminSession.adminId
  }
});
```

### Summary
- 2 files changed
- Aligns `create-pack` with the existing `attendance-admin` legacy auth pattern
- No database changes needed




# Fix: create-pack permission error

## Root Cause

`supabase/config.toml` has `verify_jwt = true` for `create-pack`. Since the admin panel uses legacy localStorage authentication (not Supabase Auth), no valid JWT is sent. The request is rejected at the infrastructure level before reaching the edge function code.

## Fix

### 1. `supabase/config.toml`

Change `verify_jwt` from `true` to `false` for `create-pack`, matching the pattern used by `attendance-admin`:

```toml
[functions.create-pack]
verify_jwt = false
```

The function already has its own admin verification logic (checking userId/role against the `users` table), so security is maintained.

### 2. Redeploy

Redeploy the `create-pack` edge function after the config change.

**One file changed, one redeployment.**



# Fix: Summary cards content overflowing

## Problem
The `CardContent` component has default classes `p-6 pt-0`. When the summary cards override with `p-4`, the `pt-0` from the base class still takes precedence via CSS specificity, removing top padding. This causes the content (icon, values, labels) to appear outside/above the card boundary.

## Fix
In `ProAccountTab.tsx` lines 232-264, change all four summary card `CardContent` classes from `p-4 text-center` to `p-4 pt-4 text-center` to explicitly set top padding, overriding the base `pt-0`.

Affected lines: 233, 243, 250, 257 — each `CardContent` in the summary grid.

## Files changed
1. `src/components/admin/ProAccountTab.tsx` — add `pt-4` to all four summary card `CardContent` elements



# Fix Recurring Expenses Category Dropdown Overflow

## Problem
The category `SelectContent` dropdown in the "Add Recurring" form overflows the dialog because there are many categories and no scroll constraint.

## Solution
Add `className="max-h-60 overflow-y-auto"` to the `SelectContent` components in the recurring expenses form section (lines 764, 783, 801). This limits the dropdown height to ~240px and enables scrolling.

### Changes to `src/components/admin/ExpensesCard.tsx`

- **Line 764**: `<SelectContent className="max-h-60 overflow-y-auto">`
- **Line 783**: `<SelectContent className="max-h-60 overflow-y-auto">`
- **Line 801**: `<SelectContent className="max-h-60 overflow-y-auto">`


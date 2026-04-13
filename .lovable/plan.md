

# Fix ExpensesCard Header Layout

## Problem
The header buttons ("Manage Recurring", "Generate Now", "New Expense") overflow outside the card on smaller screens because they're all in a single row with `flex-row items-center justify-between`.

## Solution
Restructure the `CardHeader` to stack the title and buttons vertically, with buttons wrapping on smaller screens.

### Changes to `src/components/admin/ExpensesCard.tsx`

**Lines 415-419**: Change the CardHeader layout from a single horizontal row to a vertical stack with the buttons wrapping below the title:

```tsx
<CardHeader className="flex flex-col gap-3">
  <div className="flex items-center gap-2">
    <FileText className="h-5 w-5" />
    <CardTitle className="text-lg">{t("expenses.title")}</CardTitle>
  </div>
  <div className="flex flex-wrap gap-2">
    {/* existing buttons unchanged */}
  </div>
</CardHeader>
```

This ensures all buttons stay within the card boundaries and wrap naturally on narrow screens.


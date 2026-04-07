

# Add "Other" entry type as credit

## What changes
Add a third type option "Other" (`other`) to the entry form, which behaves like Prize Money (credit — added to the balance).

## Files to change

### 1. `src/components/admin/ProAccountTab.tsx`
- Add `"other"` to the type `Select` options (Prize Money, Expense, Other)
- Update balance calculation: treat `other` same as `prize_money` (sum into credits)
- When type is `"other"`, show all expense categories plus "prize" or just default to "other" category — simplest: set category to `"other"` automatically
- Update the table badge: show "Other" with a neutral variant for `other` type
- Update the amount sign in the table: `+` for `other` (like prize_money)

### 2. `src/i18n/translations/pt.json`
- Add `"proAccount.other": "Outros"`

### 3. `src/i18n/translations/en.json`
- Add `"proAccount.other": "Other"`

## Balance formula update
```
balance = priorBalance + totalPrize + totalOther - totalExpense
```

No database changes needed — the `type` column is `text`, so `"other"` works immediately.




# Fix Pro Account report: missing translation and athlete selector

## Problems
1. **Translation key missing**: `shared.reports.proAccount` doesn't exist in either translation file, so the dropdown shows the raw key text
2. **Athlete selector**: Need to verify the dropdown works — the `proAthletes` fetch looks correct but the user reports it doesn't let them select an athlete

## Files to change

### 1. `src/i18n/translations/pt.json`
- Add `"proAccount": "Conta Corrente Pro"` inside the `shared.reports` object (after line 1316, alongside other report types)

### 2. `src/i18n/translations/en.json`
- Add `"proAccount": "Pro Current Account"` inside the `shared.reports` object (after line 1316)

### 3. `src/components/admin/ReportsCard.tsx`
- Review and fix the athlete selector for `pro_account` — ensure the `proAthletes` state is populated and the `SelectItem` components render correctly with valid values


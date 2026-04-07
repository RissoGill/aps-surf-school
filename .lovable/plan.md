

# Add Pro Account Current Account Report

## What changes
Add a new report type "Pro Account" to the ReportsCard, showing the current account (conta corrente) of competition athletes with all their entries, balance summary, and breakdown by athlete.

## Files to change

### 1. `src/components/admin/ReportsCard.tsx`
- Add `"pro_account"` to the `ReportType` union type
- Add a new `SelectItem` for "Pro Account" in the report type dropdown
- Show the athlete filter when `pro_account` is selected (only competition athletes)
- In `generateReport`, add a `case "pro_account"` that:
  - Fetches competition athletes from `atletas` (where `surf_level = 'Competition'` and `is_active = true`)
  - Fetches `pro_account_entries` for those athletes within the date range
  - Calculates per-athlete balance: `prior_balance + total_prize + total_other - total_expense`
  - If a specific athlete is selected, filter to just that athlete
- In `generateReportHTML`, add the `pro_account` case:
  - Summary section: total balance across all athletes, number of athletes
  - Table with columns: Athlete, Date, Type, Category, Description, Amount, Balance
  - Per-athlete subtotals showing prior balance + credits - debits = balance
  - Color coding: green for credits (prize/other), red for expenses
- Add `"pro_account"` to `tableHeaders` mapping

### 2. `src/i18n/translations/en.json`
- Add `"shared.reports.proAccount": "Pro Current Account"`
- Update `"shared.reports.description"` to include pro account

### 3. `src/i18n/translations/pt.json`
- Add `"shared.reports.proAccount": "Conta Corrente Pro"`
- Update `"shared.reports.description"` accordingly

## Report layout
The report will group entries by athlete, showing:
- Athlete name and prior balance
- All entries sorted by date (within the selected date range)
- Running subtotals per athlete
- Grand total at the bottom


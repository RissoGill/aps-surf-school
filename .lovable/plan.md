

# Auto-register monthly fee payment when adding to Pro Account

## What it does
When a Pro Account entry is created (or edited) with category `monthly_fee`, the system automatically finds the matching payment record for that athlete (same month/year as the entry date) and updates it with `amount_paid = entry amount`, `status = Paid`, and `payment_date = entry date`.

## Logic
1. Parse `formDate` to extract the month name (e.g. "January") and year
2. Query the `payments` table for a record matching `athlete_id`, `month`, and `year`
3. If found, update that payment's `amount_paid`, `payment_date`, and auto-calculate `status`
4. If not found, show a warning toast but still save the Pro Account entry

## Files to change

### 1. `src/components/admin/ProAccountTab.tsx`
- Create a helper function `syncMonthlyFeePayment(athleteId, entryDate, amount)` that:
  - Converts the date to month name (English, matching the payments table format) and year
  - Queries `payments` where `athlete_id = athleteId AND month = monthName AND year = year`
  - If found: updates `amount_paid = amount`, `payment_date = entryDate`, auto-calculates status (Paid/Partial/Unpaid)
  - If not found: shows an info toast warning
- Call this function in `addEntry.onSuccess` and `updateEntry.onSuccess` when `formCategory === "monthly_fee"`
- Also handle the reverse on `deleteEntry`: if deleted entry was `monthly_fee`, reset the payment back to unpaid

### 2. `src/i18n/translations/pt.json`
- Add `"proAccount.paymentSynced": "Pagamento da mensalidade atualizado automaticamente"`
- Add `"proAccount.paymentNotFound": "Mensalidade não encontrada para o mês correspondente"`

### 3. `src/i18n/translations/en.json`
- Add `"proAccount.paymentSynced": "Monthly fee payment automatically updated"`
- Add `"proAccount.paymentNotFound": "No monthly payment found for the corresponding month"`

## Month mapping
The `payments` table uses English month names ("January", "February", etc.). The helper will use `format(parseISO(entryDate), "MMMM")` from date-fns (which outputs English names by default) to match.

## Edge cases
- Editing an entry that changes from/to `monthly_fee`: sync the new month, optionally reset the old one
- Deleting a `monthly_fee` entry: reset the corresponding payment to `amount_paid = 0, status = Unpaid`



# Implementation Plan: Daily Plan Type

## Overview

Add a new plan type called "daily" where payments are automatically tracked based on each training session attended. Unlike pack plans (pre-paid sessions) or monthly plans (fixed monthly fee), daily plans charge per attendance.

## Current Plan Types

| Plan Type | Behavior |
|-----------|----------|
| **month** | Fixed monthly fee, payments created automatically for Sep-Aug |
| **pack1/pack5/pack10** | Pre-paid sessions (1, 5, or 10 trainings), tokens decremented on attendance |
| **daily** (NEW) | Pay per training attended, payment records created per attendance |

## Technical Design

### 1. Database Changes

No new tables needed. The existing `payments` table will store daily payment records with `plan_type = 'daily'`. Each attendance record for a daily-plan athlete will generate a corresponding payment record.

**Daily Payment Pricing:**
- Need to define a daily training price (suggest adding to athlete record or using a fixed value)
- For simplicity, use a configurable daily rate (e.g., stored in athlete's notes or a new field)

### 2. Attendance Registration Impact

When attendance is marked for a "daily" plan athlete:
1. Create attendance record (existing behavior)
2. Auto-create a payment record in the `payments` table with:
   - `plan_type`: 'daily'
   - `month`: Training date formatted or "Daily"
   - `amount_due`: Daily training price
   - `status`: 'Unpaid'
   - `payment_date`: null (until paid)

### 3. Files to Modify

#### Frontend Components

1. **`src/components/coach/BulkAttendanceRegistration.tsx`**
   - Add logic to create payment record when athlete has `plan_type = 'daily'`
   - After successful attendance insert, insert corresponding payment record

2. **`src/pages/coach/CoachDashboard.tsx`**
   - Add similar logic for individual attendance registration
   - Handle daily payment creation on attendance

3. **`src/pages/admin/PaymentManagement.tsx`**
   - Add "Daily" option to plan type selector
   - Update display logic to show daily payment records
   - Filter/group daily payments appropriately

4. **`src/pages/admin/AthleteManagement.tsx`**
   - Allow setting `plan_type = 'daily'` for athletes
   - Optional: Add daily_rate field for per-athlete pricing

5. **`src/pages/guardian/GuardianDashboard.tsx`**
   - Display daily payment summary
   - Show total trainings attended vs. paid

6. **`src/pages/athlete/AthleteDashboard.tsx`**
   - Display daily payment status

#### Edge Functions

7. **`supabase/functions/attendance-admin/index.ts`**
   - Add logic to create payment record for daily plan athletes when attendance is registered via edge function

#### Utilities

8. **`src/utils/dailyBalance.ts`** (NEW)
   - Calculate daily training balance (attended vs. paid)
   - Similar structure to `packBalance.ts`

#### Database

9. **Database Trigger Update**
   - Modify `handle_new_athlete` to NOT create monthly payment records when `plan_type = 'daily'`
   - Daily payments are created per-attendance, not upfront

#### Translations

10. **`src/i18n/translations/pt.json`** and **`src/i18n/translations/en.json`**
    - Add translations for "Daily" plan type
    - Add daily-specific messages

### 4. Implementation Flow

```text
+----------------+     +------------------+     +-------------------+
|   Attendance   | --> | Check plan_type  | --> | plan_type='daily' |
|   Registered   |     |                  |     +-------------------+
+----------------+     +------------------+              |
                              |                          v
                              |              +-----------------------+
                              |              | Create payment record |
                              |              | amount_due = daily_rate|
                              |              | status = 'Unpaid'     |
                              |              +-----------------------+
                              |
                              v
                    +------------------+
                    | plan_type='pack' |
                    +------------------+
                              |
                              v
                    +---------------------+
                    | Increment used_tokens|
                    +---------------------+
```

### 5. Daily Balance Display

For athletes with `plan_type = 'daily'`:
- Show total trainings attended this season
- Show total amount due (trainings x daily_rate)
- Show total amount paid
- Show outstanding balance

## Technical Details

### Daily Payment Record Structure

```typescript
{
  payment_id: `PAY${sequence}`,
  athlete_id: athleteId,
  month: 'Daily',           // or formatted date
  year: currentYear,
  amount_due: dailyRate,    // e.g., 35 EUR
  amount_paid: 0,
  status: 'Unpaid',
  payment_date: null,
  plan_type: 'daily',
  notes: `Training: ${attendanceDate}` // Reference to specific training
}
```

### Daily Rate Configuration

Option A: Fixed rate for all daily athletes (simplest)
- Add constant: `DAILY_TRAINING_RATE = 35` (EUR)

Option B: Per-athlete rate (more flexible)
- Add `daily_rate` column to `atletas` table
- Admin can set individual rates

Recommend starting with **Option A** for simplicity, with a default value that admins can override in individual payment records.

### Plan Type Validation Updates

Update all locations that check plan types:

```typescript
// Current
if (planType?.startsWith('pack'))
if (planType === 'Pack')

// Updated to include daily
if (planType?.startsWith('pack'))
if (planType === 'daily')
if (!planType?.startsWith('pack') && planType !== 'daily') // monthly
```

## Summary of Changes

| File | Change |
|------|--------|
| `BulkAttendanceRegistration.tsx` | Add daily payment creation on attendance |
| `CoachDashboard.tsx` | Add daily payment creation on individual attendance |
| `PaymentManagement.tsx` | Add "Daily" plan option, display daily payments |
| `AthleteManagement.tsx` | Allow setting "daily" plan type |
| `GuardianDashboard.tsx` | Display daily payment summary |
| `AthleteDashboard.tsx` | Display daily payment status |
| `attendance-admin/index.ts` | Add daily payment creation logic |
| `pt.json` / `en.json` | Add daily translations |
| Database migration | Update trigger, optionally add daily_rate column |
| `dailyBalance.ts` (new) | Calculate daily training balance |

## Questions for Clarification

1. **Daily Rate**: What is the price per daily training session? (e.g., 35 EUR)
2. **Per-Athlete Rate**: Should each athlete have their own daily rate, or use a fixed rate for all?
3. **Payment Grouping**: Should daily payments be shown individually or grouped by month?

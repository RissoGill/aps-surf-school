

# Add edit functionality to Pro Account movements table

## What changes
Add an edit button next to the delete button on each entry row. Clicking it populates the existing add/edit form with that entry's data, and submitting updates the entry instead of inserting a new one.

## Files to change

### 1. `src/components/admin/ProAccountTab.tsx`
- Add `editingEntryId` state (`string | null`) to track if editing
- Add `Pencil` icon import from lucide-react
- Add an `updateEntry` mutation that does `supabase.from("pro_account_entries").update(...)` by id
- Add `handleEdit(entry)` function that sets the form fields from the entry and sets `editingEntryId`
- Update `handleSubmit`: if `editingEntryId` is set, call `updateEntry` instead of `addEntry`
- Update `resetForm` to also clear `editingEntryId`
- In the table actions column, add an edit button (Pencil icon) next to the delete button
- Update form title: show "Edit Entry" vs "New Entry" based on `editingEntryId`
- Update submit button label accordingly

### 2. `src/i18n/translations/pt.json`
- Add `"proAccount.editEntry": "Editar Movimento"`
- Add `"proAccount.update": "Atualizar"`

### 3. `src/i18n/translations/en.json`
- Add `"proAccount.editEntry": "Edit Entry"`
- Add `"proAccount.update": "Update"`

## Behavior
- Clicking edit opens the form pre-filled with the entry's values
- The form title and button text change to reflect editing mode
- Cancel returns to normal state
- After successful update, form resets and entries reload


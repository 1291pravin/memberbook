# Loading owners' data (AI routine)

Owners send their member list once from **Send us your data** (`/dashboard/upload`), or we add it for them from `/admin/setup`. It can be Excel or CSV files, photos of a paper register, a PDF, or pasted text, in any layout and often in Hinglish. A scheduled Claude Code routine runs every hour. It reads each waiting upload and loads the plans, members and due dates through the admin API. The data goes live straight away, with no human check, so load only what you can read with confidence.

Everything runs through `scripts/uploads.mjs`, which needs `MEMBERBOOK_UPLOADS_TOKEN` (the production `NUXT_AI_WORKER_UPLOADS_TOKEN`) in the environment. That token only opens the upload endpoints; never give the task the master admin token.

## Each run

1. `node scripts/uploads.mjs list` lists the waiting uploads. If there are none, stop.
2. For each upload, oldest first:
   1. `node scripts/uploads.mjs claim <id>`. If the claim fails, another run has the upload, so skip it.
   2. `node scripts/uploads.mjs show <id>` shows the business type, its existing plans, the owner's note, the pasted text and `today` (IST).
   3. `node scripts/uploads.mjs download <id> /tmp/upload-<id>` saves the files.
   4. Read every file. For photos, look at them carefully. For spreadsheets, read every sheet (use `pip install openpyxl xlrd` if needed). For PDFs, extract the text or render the pages.
   5. Write `/tmp/upload-<id>/load.json` in the format below.
   6. `node scripts/uploads.mjs load <id> /tmp/upload-<id>/load.json` loads it and prints the report.
   7. If nothing in the upload can be used (blank, unreadable, or unrelated), run `node scripts/uploads.mjs fail <id> "<message for the owner>"` instead. Write the message in simple English and say what to send instead, for example: "The photo is too blurry to read the names. Please send a clearer photo in daylight, one page at a time."

## load.json

```json
{
  "plans": [
    { "name": "Monthly", "price": 800, "durationType": "monthly", "durationValue": 1 }
  ],
  "members": [
    { "name": "Rahul Sharma", "phone": "9876543210", "plan": "Monthly", "dueDate": "2026-12-05" },
    { "name": "Priya", "phone": "9123456780", "plan": "Monthly", "dueDate": "2026-11-02", "pendingAmount": 300 }
  ],
  "skipped": [
    { "name": "Amit", "reason": "Couldn't read the phone number or due date" }
  ],
  "upiId": "9876543210@ybl"
}
```

- **plans**: `price` is in rupees. `durationType` is one of `daily`, `weekly`, `monthly` or `yearly`. Quarterly is `monthly` with value 3, and half-yearly is `monthly` with value 6. Plans with the same name as an existing plan are reused, not duplicated. Only list plans whose price you know, from the data or the owner's note. If the members show a duration but no price for it, don't invent one: load those members without a plan and explain under `skipped`.
- **members**:
  - `name` is required. Fix obvious capitalisation, but don't translate names.
  - `phone` must be a 10-digit Indian mobile number. Anything else gets the member skipped, so leave the field out if it's unreadable.
  - `plan` matches a plan name.
  - `dueDate` (`YYYY-MM-DD`) is the day the member's **next fee is due**. If the register says "paid till 4 Dec", the due date is 5 Dec. If it shows a joining date and a monthly fee, the due date is the next same-day-of-month on or after the last payment.
    - A future due date means the member is paid up, and we remind them before it.
    - A due date today or earlier means they owe the fee now.
  - `pendingAmount` (rupees) is an unpaid balance for the current period, such as a partial payment.
  - Optional fields: `email`, `gender` (`male` or `female`), `fatherName`, `address`, `batch` (a timing or batch, such as "Morning 6-7"), `notes`.
  - A member already in MemberBook (same phone number, or same name when there is no phone) is skipped automatically, so loading twice is safe.
  - Don't load rows that are clearly struck out, marked left or discontinued, or that are only totals.
- **skipped**: rows you could not use, each with a short reason the owner will understand. The owner sees this list.
- **upiId**: only if the owner wrote it in the note or the data. It is set only when the business has none yet.

## Judgement

- When a date has no year, use the year that puts it closest to `today`.
- When a date is ambiguous (03/04), assume Indian day/month order.
- Partial is better than wrong. Leave out a field you cannot read rather than guess it. A member without a due date is still useful, and the owner can add the date later.
- Never invent phone numbers, prices or dates.
- Keep the output in the business's language. Tuition centres call them students, but the field is still `members`.

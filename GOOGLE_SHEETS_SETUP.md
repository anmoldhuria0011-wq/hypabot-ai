# HYPA BOT — Google Sheets Integration Setup

Complete setup guide for connecting the website form to Google Sheets.

---

## OVERVIEW

When a visitor submits the strategy call form, the data flows like this:

```
Website Form
    ↓  (POST JSON)
Next.js API Route: /api/submit-lead
    ↓  (POST JSON, server-side)
Google Apps Script Web App
    ↓
Google Sheet (CRM)
```

The Apps Script URL is kept server-side (in .env.local) — never exposed to the browser.

---

## STEP 1 — Create the Apps Script

1. Open Google Sheets:
   https://docs.google.com/spreadsheets/d/1X9YpaAwVkNrj8urP0o44-3QxZ3G13nJOFd5nFmhagKo/edit

2. Click **Extensions → Apps Script**

3. Delete all existing code in the editor

4. Copy the entire contents of `GOOGLE_APPS_SCRIPT.js` (in this project root)

5. Paste it into the Apps Script editor

6. Click **Save** (the floppy disk icon, or Ctrl+S)

7. Name the project: `HYPA BOT Lead Capture`

---

## STEP 2 — Deploy as Web App

1. In the Apps Script editor, click **Deploy → New deployment**

2. Click the gear icon next to "Type" and select **Web app**

3. Set the following:
   - **Description:** `HYPA BOT Lead Capture v1`
   - **Execute as:** `Me` (your Google account)
   - **Who has access:** `Anyone`

4. Click **Deploy**

5. Google will ask you to **authorize the script**:
   - Click "Authorize access"
   - Choose your Google account
   - Click "Advanced" → "Go to HYPA BOT Lead Capture (unsafe)"
   - Click "Allow"

6. After authorization, Google shows you the **Web App URL**

   It looks like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

7. **Copy this URL** — you'll need it in Step 3

---

## STEP 3 — Add the URL to your environment

1. Open `.env.local` in your project root

2. Replace the placeholder with your actual URL:

   ```env
   GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_ACTUAL_ID/exec
   ```

3. Save `.env.local`

4. Restart your dev server:
   ```bash
   npm run dev
   ```

---

## STEP 4 — Test the integration

1. Open your website locally: http://localhost:3000

2. Scroll to the final CTA section

3. Select a service chip (e.g. "Book appointments")

4. Fill in all fields

5. Click "Book My Strategy Call"

6. You should see the success message

7. Check your Google Sheet — a new row should appear with:
   - Timestamp
   - Your test data
   - Status = "New"

---

## STEP 5 — Production deployment

When deploying to production (Vercel, etc.):

1. Add `GOOGLE_APPS_SCRIPT_URL` as an environment variable in your hosting dashboard

2. For Vercel: Settings → Environment Variables → Add

3. Redeploy after adding the variable

---

## GOOGLE SHEET STRUCTURE

The script automatically creates this header row on first submission:

| Timestamp | Name | Business Name | Email | Phone Number | Selected AI Employee | Biggest Business Challenge | Status | Notes |

**Manually updatable fields (you update these):**

- **Status** — New / Contacted / Meeting Scheduled / Proposal Sent / Won / Lost
- **Notes** — Any notes about the lead

**Auto-generated fields (script handles these):**

- **Timestamp** — Date and time of submission
- **Status** — Always set to "New" on submission
- **Notes** — Always blank on submission

---

## UPDATING THE APPS SCRIPT

If you need to update the script later:

1. Open Apps Script editor
2. Make your changes
3. Click **Deploy → Manage deployments**
4. Click the pencil icon on your existing deployment
5. Change version to "New version"
6. Click **Deploy**
7. The URL stays the same — no changes needed in .env.local

---

## TROUBLESHOOTING

**Form shows "Something went wrong"**
- Check that `GOOGLE_APPS_SCRIPT_URL` is set correctly in `.env.local`
- Make sure the Apps Script is deployed with "Anyone" access
- Check the Next.js server console for error details

**Sheet not updating but form shows success**
- Open Apps Script editor
- Click **Executions** in the left menu
- Check for errors in recent executions

**Authorization error during deployment**
- Make sure you're logged into the correct Google account
- The account must have edit access to the spreadsheet

**"Script function not found" error**
- Make sure you saved the script before deploying
- Verify the script contains `doPost` function

---

## SECURITY NOTES

- The Apps Script URL is stored in `.env.local` — never committed to git
- Add `.env.local` to your `.gitignore` (already done)
- The Next.js API route validates all data server-side before forwarding
- The Apps Script only accepts POST requests and validates required fields
- No sensitive credentials are exposed to the browser

---

## FILES CREATED/MODIFIED

```
noxic-ai/
├── .env.local                          ← Add your Apps Script URL here
├── .gitignore                          ← .env.local already excluded
├── GOOGLE_APPS_SCRIPT.js               ← Copy this into Apps Script editor
├── GOOGLE_SHEETS_SETUP.md              ← This file
├── app/
│   └── api/
│       └── submit-lead/
│           └── route.ts                ← Next.js API route (proxy)
└── sections/
    └── Scene6Section.tsx               ← Updated with real fetch + validation
```

# SKEI Admin: Leads Dashboard

A private dashboard at **`/skei-admin`** for viewing and managing enquiry leads.
There is intentionally **no link to it anywhere on the public site**. Reach it by
typing the URL.

## Roles

| Role  | Can do                                                                   |
| ----- | ------------------------------------------------------------------------ |
| Staff | View leads, add/edit **remarks**                                         |
| Admin | Everything: edit **status**, edit lead **details**, **delete**, **CSV export** |

## One-time setup

### 1. Google Apps Script (the leads backend)

1. Open your leads Google Sheet → **Extensions → Apps Script**.
2. Paste the contents of [`Code.gs`](./Code.gs), replacing what's there. Save.
3. **Project Settings → Script properties** → add:
   - `API_SECRET`: any long random string (you'll reuse it as `LEADS_API_SECRET`).
   - `SHEET_NAME`: optional; the tab name holding leads (defaults to the first tab).
4. **Deploy → New deployment → Web app**
   - _Execute as:_ **Me**
   - _Who has access:_ **Anyone**
   - Copy the `/exec` URL.
5. After any later edit, **Manage deployments → edit → deploy a new version**.

The script auto-adds the management columns (`id`, `status`, `remark`,
`updated_at`, `updated_by`) to your sheet on first run and is backward-compatible
with the existing public enquiry form.

### 2. Environment variables (`.env`)

```bash
# session signing secret
node scripts/hash-password.mjs --secret        # → AUTH_SECRET=...

# one hash per account
node scripts/hash-password.mjs "admin-password" # → ADMIN_PASSWORD_HASH
node scripts/hash-password.mjs "staff-password" # → STAFF_PASSWORD_HASH
```

Fill in `.env` (see [`.env.example`](../.env.example)):

- `AUTH_SECRET`, `ADMIN_PASSWORD_HASH`, `STAFF_PASSWORD_HASH`
- `ADMIN_USERNAME` / `STAFF_USERNAME` (and optional display names)
- `LEADS_SCRIPT_URL`: the `/exec` URL from step 1
- `LEADS_API_SECRET`: must equal the Apps Script `API_SECRET`

On Vercel, add the same variables under **Project → Settings → Environment Variables**.

### 3. Sign in

Visit `/skei-admin`, log in with either account. Staff land on the same dashboard
but only the remark field is editable for them.

## Security notes

- Session is a signed, httpOnly cookie (HS256), verified in middleware and in every
  API route. Admin-only actions are re-checked server-side, never trusting the client.
- The shared `LEADS_API_SECRET` stays server-side; it is never sent to the browser.
- `/skei-admin` and `/api` are disallowed in `robots.txt` and marked `noindex`.

# SKEI Portal: Leads Dashboard

A private portal at **`/skei-portal`** for viewing and managing enquiry leads.
There is intentionally **no link to it anywhere on the public site**. Reach it by
typing the URL.

## Roles

| Role  | Can do                                                                 |
| ----- | ---------------------------------------------------------------------- |
| Staff | Permissions are granted by an admin                                    |
| Admin | Manage users, permissions, leads, analytics, exports, and change logs  |

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
```

Fill in `.env` (see [`.env.example`](../.env.example)):

- `DATABASE_URL`: pooled PostgreSQL connection string
- `AUTH_SECRET`: session signing secret
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`: public enquiry form reCAPTCHA key

On Vercel, add the same variables under **Project → Settings → Environment Variables**.

### 3. Sign in

Visit `/skei-portal`, log in with username or email. Admin users can create more
users and grant specific portal permissions. Portal users, emails, permissions,
and password hashes are stored in PostgreSQL, not environment variables.

## Security notes

- Session is a signed, httpOnly cookie (HS256), verified in middleware and in every
  API route. Permission checks are re-run server-side, never trusting the client.
- The shared `LEADS_API_SECRET` stays server-side; it is never sent to the browser.
- `/skei-portal` and `/api` are disallowed in `robots.txt` and marked `noindex`.

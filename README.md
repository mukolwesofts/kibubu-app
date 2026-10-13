# Kibubu

A minimal, mobile-first personal budget app for a household of two — one shared
budget, separate logins. Amounts are integer KES shillings; dates are
`YYYY-MM-DD` in Africa/Nairobi time.

**Stack:** Next.js (App Router, TypeScript), Tailwind, Turso (libSQL) + Drizzle
ORM, Resend (email OTP), jose (signed session cookies), Vercel (hosting + cron).

## Screens

- **Home** — period label, days left, remaining-to-spend hero, daily allowance,
  status pill (Good / Watch / Over), per-category progress bars, floating "+"
  quick-add sheet.
- **Spend** — add expenses, grouped-by-date history, category filter, tap to
  edit/delete.
- **Budget** — income entries and planned budget lines, with totals and buffer
  (income − planned). Inline editing.
- **Savings** — goals with computed balances and optional targets;
  deposit/withdraw history (withdrawals can't exceed the balance).
- **Loans** — remaining balance (starting balance − payments) and payment
  history.
- **Settings** — invite your spouse by email, toggle the daily reminder, log out.

Budget **periods**: the active period is the one with `end_date = null`.
Starting a new period closes the previous one (end date = day before the new
start) and carries over budget lines — not income or transactions. Past periods
are read-only via the switcher on Home.

## Setup

### 1. Turso (database)

```bash
# https://turso.tech — install the CLI, then:
turso db create kibubu
turso db show kibubu --url          # → TURSO_DATABASE_URL
turso db tokens create kibubu       # → TURSO_AUTH_TOKEN
```

### 2. Resend (email)

Create an API key at https://resend.com and verify a sending domain (or use the
test sender for development). Set `RESEND_API_KEY` and `EMAIL_FROM`.

### 3. Environment variables

```bash
cp .env.example .env.local
```

Fill in:

| Var                  | Purpose                                        |
| -------------------- | ---------------------------------------------- |
| `TURSO_DATABASE_URL` | `libsql://...` database URL                    |
| `TURSO_AUTH_TOKEN`   | Turso auth token                               |
| `RESEND_API_KEY`     | Resend API key                                 |
| `EMAIL_FROM`         | Verified sender, e.g. `Kibubu <app@you.com>`   |
| `SESSION_SECRET`     | `openssl rand -hex 32` — signs session cookies |
| `CRON_SECRET`        | Bearer token Vercel sends to the cron route    |

Without `TURSO_DATABASE_URL` the app falls back to a local SQLite file
(`kibubu-local.db`) for development.

### 4. Migrate and seed

```bash
npm run db:generate   # regenerate migrations after schema changes
npm run db:migrate    # apply migrations to Turso
npm run seed          # demo household with a sample active period
```

### 5. Run

```bash
npm run dev
```

Sign in at `/login` with any email — a 6-digit code is sent via Resend. A
first-time user creates a new household; an invited email joins the inviter's
household.

## Deployment (Vercel)

1. Import the repo into Vercel and set all env vars above.
2. `vercel.json` registers a cron job hitting `GET /api/cron/reminder` daily at
   **15:00 UTC** (18:00 Nairobi). Vercel automatically sends
   `Authorization: Bearer $CRON_SECRET`, which the route verifies.
3. The reminder emails any user with `reminder_enabled` who hasn't logged a
   transaction that day (Africa/Nairobi).

## Notes

- Auth: passwordless email OTP. Codes are stored hashed (SHA-256 with the
  session secret as pepper), expire after 10 minutes, allow 5 attempts, and
  sends are rate-limited (1/minute, 5/hour per email).
- Sessions: httpOnly signed JWT cookie (`jose`), 30 days.
- `src/proxy.ts` (Next.js 16's middleware convention) redirects unauthenticated
  requests to `/login`; data access is additionally enforced server-side by
  scoping every query/mutation to the user's `household_id`.
- Balances (savings, loans, remaining, buffer) are always computed, never
  stored.

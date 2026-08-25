# HealthNet — one-page cheat sheet

`PITCH.md` is the study document. This is the page you skim in the five minutes
before the call. Every number here is checked against the code.

---

## The 30-second answer

> HealthNet is a hospital management app — patients sign up, book appointments
> with real doctors and keep a medical profile; admins manage doctors,
> appointments, users and contact enquiries from a dashboard. Next.js 16 App
> Router with React 19 and TypeScript, Prisma 7 against Neon Postgres, Tailwind
> v4, Resend for transactional email. Auth is hand-rolled: bcrypt passwords and
> SHA-256-hashed session tokens in the database. No `app/api` folder — reads
> happen in Server Components, writes in Server Actions.

## Numbers to know cold

| Thing | Value |
| --- | --- |
| bcrypt cost | **12** |
| Session token | **32 random bytes**, hex; SHA-256 stored, raw in cookie |
| Cookie | `healthnet_session` — httpOnly, SameSite=Lax, Secure in prod, **7 days** |
| Models | **6**: User, UserProfile, Session, Doctor, Appointment, ContactMessage |
| Enums | **3**: Role (USER/ADMIN), Gender (4), AppointmentStatus (4) |
| Ids | `cuid()` |
| Indexes | Appointment.doctorId, .patientId, .scheduledAt, ContactMessage.createdAt |
| Admin overview | **6 queries** in one `Promise.all` — 5 counts + 1 findMany(take 5) |
| Inbox | `take: 100` |
| Upload limits | PNG/JPEG/WebP, **2 MB**, UUID filename, ext from MIME |
| Font | Poppins, static, weights **400/600/700 only** |
| Places showing a time | **6**, all through `formatDateTime` |
| Theme | `primaryColor` `#c80040`, `primaryLight` `#ff85ab` |

## Request lifecycle, one line each

1. Root layout is `async`, calls `getCurrentUser()` → reading a cookie makes the
   whole site render per-request.
2. `getCurrentUser` is wrapped in React `cache()` → layout, guard and page share
   one query.
3. Route group layout runs `requireUser()` or `requireAdmin()` → redirects if not
   allowed.
4. Server Component queries Prisma directly and returns HTML.
5. A form posts to a Server Action (`"use server"`, colocated `actions.ts`).
6. The action re-checks auth itself, validates by hand, writes via Prisma.
7. `revalidatePath(...)` then `redirect("...?success=...")` — POST/redirect/GET.

## File → purpose

- `lib/auth.ts` — **know this by heart.** `createSession`, `destroySession`,
  `getCurrentUser`, `requireUser`, `requireAdmin` (five exports).
- `lib/prisma.ts` — `PrismaNeon` adapter, singleton on `globalThis` when
  `NODE_ENV !== "production"`.
- `lib/format.ts` — `formatDateTime` / `formatTime` / `formatDate` /
  `formatDateOfBirth` / `calculateAge` / `humanize` / `toDateInputValue`.
- `lib/mail.ts` — Resend; `sendContactEmail` returns a boolean, never throws.
- `lib/uploads.ts` — doctor photos to local disk (**breaks on Vercel**).
- `prisma.config.ts` — datasource URL (`DIRECT_URL ?? DATABASE_URL`) + seed.
- `app/(auth)/`, `app/dashboard/`, `app/admin/`, `app/contact/` — each with its
  own `actions.ts`.

## Five sentences that answer most questions

1. **Why no API routes?** Server Components read and Server Actions write, so a
   REST layer would only serialise data for my own frontend; I'd add one when
   something external needs to call in.
2. **Why re-check auth inside actions?** A Server Action is a real HTTP endpoint —
   anyone can POST to it directly, so the layout guard protects the UI, not the
   mutation.
3. **Why hash the session token?** It protects against a database compromise, not
   guessing — a leaked `Session` table then contains no usable credential.
4. **Why SHA-256 for tokens but bcrypt for passwords?** Passwords are
   low-entropy so they need a deliberately slow hash; a 256-bit random token
   doesn't, and it's hashed on every request.
5. **How is ownership enforced?** The id comes from the form, the owner comes from
   the session: `updateMany({ where: { id, patientId: user.id } })`.

## The details that prove authorship

- `escapeHtml` replaces `&` **first** — escaping it last would double-escape the
  ampersands in `&lt;`.
- `||` not `??` for `CONTACT_FROM_EMAIL` — an empty `.env` value is an empty
  string, which `??` passes through.
- Resend **resolves with an `error` property** instead of rejecting, so `await`
  alone looks like success.
- Honeypot `website` is **silently accepted**, not rejected — an error would teach
  the bot to leave it blank.
- Contact row is written **before** the email, so a bad API key can't lose an
  enquiry; `emailSent` surfaces the failure as a badge.
- Upload extension comes from the **MIME type**, never the filename.
- Enum type derived from the tuple: `(typeof VALID_STATUSES)[number]`.
- `updateMany` over `update` so a missing row is a no-op, not a P2025 → 500.
- Poppins is **static, not variable**, so weights must be named or 600 silently
  renders as 700 — the PT Sans bug.

## Disclose these before you're asked

- Git history is **one commit** — start committing per change now.
- **No rate limiting**, no session rotation, no password reset.
- Timezone handling is naive: `datetime-local` parsed in the *server's* zone.
- Uploads write to local disk → **breaks on Vercel**.
- `zod` is an unused dependency; `components/NavBar.tsx` and `data/doctors.ts` are
  dead code. (`data/faqs.ts`, `features.ts`, `services.ts` are live.)
- Server-side length caps exist **only on the contact form**.
- One session per user is a **simplification**, not a security feature — logging
  in on a phone logs you out on a laptop.

## Your best evidence

Open `prisma/migrations/20260817181825_init/migration.sql` and show them
`Account`, `VerificationToken`, `PatientProfile`, `DoctorProfile` and a `Role` of
`PATIENT | DOCTOR | ADMIN`. That's NextAuth's schema — the auth system you
installed, generated, and then removed in the next migration in favour of your own
`Session` table. Nobody who cloned a finished app has an abandoned architecture in
their migration folder.

## Do before showing anyone

```powershell
cd C:\Users\KELVIN\Desktop\hospital-management
Remove-Item -Recurse -Force .next-STALE-BACKUP
npm run dev
```

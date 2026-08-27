# HealthNet  
Live link: https://hospital-management-sigma-murex.vercel.app/



A hospital management app: patients book appointments and keep their medical
details in one place, and an admin runs the clinic — staff, appointments and
enquiries — from a dashboard.

Built with the Next.js App Router, Prisma against Neon Postgres, and
hand-rolled session authentication rather than an auth library. Every
non-obvious decision in the codebase is explained in a comment next to the code
that makes it, because this project doubles as something to learn from.

## What it does

### ✨ Features

- 🔐 Hand-rolled authentication — bcrypt passwords, SHA-256 hashed session tokens, no auth library
- 🛡️ Role-based access (`USER` / `ADMIN`) re-checked inside every Server Action, not just the layout
- 📅 Appointment booking — pick a doctor, date and time, then track the status the clinic sets
- 🩺 Patient medical profile — date of birth, emergency contact, blood group, allergies and notes
- 👨‍⚕️ Doctor management with photo upload, validated by MIME type and size
- 📊 Admin dashboard — user, doctor, appointment and enquiry counts in a single parallel query
- 📬 Contact form that saves to the database *first* and emails via Resend second, so no enquiry is lost
- 📥 Admin inbox with an unread count and a badge when an email fails to send
- ⚡ Server Components and Server Actions throughout — no `app/api` layer, and the footer ships zero JavaScript
- 📱 Responsive across breakpoints, with a mobile nav in the header
- 🎨 Tailwind v4 theming through `@theme` tokens, with no config file

**Anyone** can browse the marketing site, look through the doctors pulled from
the database, and send an enquiry through the contact form. The enquiry is saved
to the database first and emailed to the admin second, so a message is never
lost to a bad API key.

**A patient** signs up, is redirected to their dashboard, and fills in a profile
covering the basics (date of birth, gender, phone, address), an emergency
contact, and a few medical details (blood group, allergies, notes). Every field
is optional so the form can be saved a bit at a time. From there they pick a
doctor, choose a date and time, and see their appointments with the status the
clinic has given each one.

**The admin** gets a separate area: a count of registered users, every user's
personal information and exactly when they signed up, a form that adds doctors
to the database (with a photo upload), full control over every appointment's
status, and an inbox of contact-form enquiries with an unread count.

## Stack

| Piece | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 16 (App Router) | Server Components mean most pages query the database directly, with no API layer in between |
| Language | TypeScript | |
| Database | Neon Postgres | Serverless Postgres with a pooled connection, which suits a per-request runtime |
| ORM | Prisma 7 with `@prisma/adapter-neon` | Prisma 7 requires a driver adapter; Neon's speaks HTTP rather than raw TCP |
| Auth | bcryptjs + a `Session` table | See below — this is deliberately not an auth library |
| Styling | Tailwind CSS v4 | Theme tokens in `app/globals.css`, no separate config file |
| Email | Resend | One function call, no SMTP credentials to manage |

## 🚀 Getting started

You'll need Node 20 or newer and a Neon database (the free tier is plenty).

```bash
npm install          # runs `prisma generate` afterwards via postinstall
npm run db:migrate   # creates the tables
npm run db:seed      # creates the admin account and some starter doctors
npm run dev
```

Then open http://localhost:3000.

Create a `.env` file in the project root first:

```env
# Neon gives you both of these. The pooled one is used by the running app;
# the direct one is used by migrations, which need a real session.
DATABASE_URL="postgresql://...-pooler.../neondb?sslmode=require"
DIRECT_URL="postgresql://.../neondb?sslmode=require"

# The admin account created by the seed script.
ADMIN_EMAIL="you@example.com"
ADMIN_PASSWORD="pick-something-long"
ADMIN_NAME="Your Name"

# Contact form email. Without a key the message is still saved to the
# database — it's just flagged as "email not sent" in the admin inbox.
RESEND_API_KEY="re_..."
CONTACT_FROM_EMAIL="HealthNet <hello@yourdomain.com>"
```

`CONTACT_FROM_EMAIL` is optional but worth setting. Left blank, the app falls
back to Resend's sandbox sender `onboarding@resend.dev`, and the sandbox will
only deliver to the email address you signed up to Resend with — which is by far
the most common reason a send appears to fail silently.

`.env` is gitignored. Keep it that way; it holds a live database password.

Other scripts: `npm run db:studio` opens Prisma Studio to browse the data, and
`npm run lint` runs ESLint.

## How it's laid out

```
app/
  (auth)/        login, signup, and their server actions
  admin/         layout calls requireAdmin(); overview, users, doctors,
                 appointments, messages
  dashboard/     layout calls requireUser(); details, profile form, appointments
  contact/       public contact form
  doctors/       public doctor list and profile pages
  home/  services/
components/      Header, Footer, and the marketing sections
lib/
  prisma.ts      the Prisma client, wired to Neon through the adapter
  auth.ts        sessions, getCurrentUser, requireUser, requireAdmin
  format.ts      date, time, age and enum display helpers
  mail.ts        sendContactEmail — returns a boolean, never throws
  uploads.ts     saves doctor photos to public/uploads/doctors/
prisma/
  schema.prisma  User, UserProfile, Session, Doctor, Appointment, ContactMessage
  seed.mjs       admin account + starter doctors
```

The `(auth)` folder is in brackets because it's a route group: it shares a
layout between the login and signup pages without adding `/auth` to their URLs.

## Notes on the interesting parts

**Authentication is hand-rolled on purpose.** Signing up hashes the password
with bcrypt at cost 12. Logging in generates a random token, stores only its
SHA-256 hash in the `Session` table, and sends the raw token to the browser as
an httpOnly cookie with a seven-day expiry. Hashing the token means a leaked
database still doesn't hand anyone a working session, exactly as with passwords.
`getCurrentUser()` is wrapped in React's `cache()` so the header, the layout
guard and the page itself all resolve to one query per request.

**Every mutation is a Server Action.** There is no `app/api` folder. Forms post
directly to `async` functions marked `"use server"`, which means the admin's
status buttons and the profile form all work without shipping a client
component. Each of those actions calls `requireAdmin()` or `requireUser()`
itself rather than trusting the layout, because a server action is a real HTTP
endpoint that can be called directly.

**Ownership comes from the cookie, never the form.** Anything scoped to a user
queries with both ids — `where: { id, patientId: user.id }` — so editing a
hidden field in the browser can't reach someone else's record.

**Validation happens on the server.** `maxLength` and `required` on an input are
a courtesy to the person typing, not a defence; a scripted POST ignores both.
Each action checks the fields itself and redirects back with `?error=...`. Public
forms also carry a hidden honeypot field that real people never fill in.

**Doctors used to be a hard-coded array** in `data/doctors.ts`. They're now rows
in the database with the same shape, seeded by `prisma/seed.mjs` and added
through the admin form.



## Roadmap

Password reset by email, doctor availability so appointment slots can't
double-book, pagination on the admin lists (the inbox currently loads the most
recent hundred), and real content behind the footer's Blog, Careers and Privacy
Policy links, which are plain text until the pages exist.

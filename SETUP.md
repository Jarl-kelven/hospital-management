# HealthNet — setup and how the app works

This file covers two things: the commands you need to run to bring the app to
life, and a short tour of the code that was added so you can find your way
around it.

---

## 1. Commands to run, in this order

I could not run any of these for you — the sandbox VM on this machine won't
start because virtualization is disabled — so these are yours to run from the
project folder in a terminal.

```bash
npm install
npx prisma migrate dev --name profile_details_and_doctor_fields
npx prisma migrate dev --name contact_messages
npm run db:seed
npm run dev
```

**`npm install`** matters more than usual this time. Four packages the code
imports are missing from your `node_modules` (`@prisma/adapter-neon`,
`@neondatabase/serverless`, `dotenv`, and now `resend`), and `next-auth` was
removed. Installing also triggers the `postinstall: prisma generate` script,
which is required because Prisma 7 no longer generates the client automatically.

Until that runs, `lib/mail.ts` won't compile (no `resend` package) and every
`prisma.contactMessage.*` call is a type error, because the generated client
in `node_modules/.prisma/client` still describes the old schema.

**The two migrations.** The first adds the profile and doctor columns; the
second creates the `ContactMessage` table. You can also do it in one go with a
single `npx prisma migrate dev --name dashboards_and_contact` — Prisma compares
your schema against the database, not against your file history, so it will pick
up everything outstanding either way. Until they run, dashboard pages fail with
"column does not exist" and the contact form fails with "relation
ContactMessage does not exist", even though the code itself is correct.

One thing to watch on the first migration: the generated SQL will try to make
`Doctor.hospital` and `Doctor.photoUrl` `NOT NULL`. If your `Doctor` table
already has rows where either is empty, Postgres refuses and the migration
aborts. The table is almost certainly empty (the doctor data used to be
hard-coded in the app, not stored), but if it does fail you have two options:
open the generated file in `prisma/migrations/` and add
`UPDATE "Doctor" SET "photoUrl" = '/images/doc1.png' WHERE "photoUrl" IS NULL;`
above the `ALTER` statement, or — since this is development data — just run
`npx prisma migrate reset` to start clean.

**`npm run db:seed`** creates your admin account from `ADMIN_EMAIL` and
`ADMIN_PASSWORD` in `.env`, then inserts the three original doctors (John
Simmmons, Michael Mel-Smith, Joseph Samuels) with their existing photos and
ratings, so the site doesn't start out empty. It only adds doctors when the
table is empty, so running it again is safe and won't create duplicates.

Then log in. An `ADMIN` lands on `/admin`, a `USER` lands on `/dashboard` — the
login action reads the role and picks the destination.

### Environment variables for the contact form

Add one new line to `.env`:

```
RESEND_API_KEY=re_xxxxxxxxxxxx
```

Get the key from [resend.com/api-keys](https://resend.com/api-keys) — the free
tier is plenty for this. The enquiry is emailed to `ADMIN_EMAIL`, which you
already have set for the seed script.

**The one gotcha with Resend.** Out of the box the app sends *from*
`onboarding@resend.dev`, Resend's shared sandbox address. That address is only
allowed to deliver to the email you created your Resend account with. So if
`ADMIN_EMAIL` is a different address, the send will be rejected and the message
will show an amber "Email not sent" badge in the admin inbox — the code is
fine, the sender isn't allowed. Two ways out: point `ADMIN_EMAIL` at your Resend
signup address for now, or verify a domain in Resend and then add

```
CONTACT_FROM_EMAIL=HealthNet <noreply@yourdomain.com>
```

after which it can email anyone.

Worth knowing: **the form works without any of this.** Every enquiry is written
to the database first and emailed second, so a missing key costs you the
notification, never the message.

---

## 2. Files you should delete

Nothing imports these any more, and the first two actively break `next build`
because a page file with no default export fails Next's route check.

```
app/login/            (empty file — collides with app/(auth)/login)
app/register/         (empty file)
auth.ts               (old NextAuth config)
app/api/              (old NextAuth route handler)
types/next-auth.d.ts
data/doctors.ts       (the doctor list now lives in the database)
components/NavBar.tsx (replaced by components/Header.tsx)
```

`components/NavBar.tsx` used to be optional. It isn't any more: it was the only
thing still using the `.sticky-header`, `.navigation`, `.show` and `.hamburger`
CSS rules, and those have been deleted from `globals.css`. Nothing renders it,
so nothing breaks today — but it's now permanently broken code sitting in your
components folder, which is worse than no code at all.

---

## 3. What the new code does

### Route protection

`lib/auth.ts` has two guards. `requireUser()` returns the logged-in user or
redirects to `/login`; `requireAdmin()` additionally checks the role. Because
`redirect()` is typed as returning `never`, TypeScript knows the code after a
guard only runs for a valid user — which is why you don't need any `if (!user)`
checks in the pages themselves.

The guards are called in two places on purpose. `app/admin/layout.tsx` calls
`requireAdmin()` once, which protects every admin *page*. But every admin
*server action* calls it again, because a server action is a real HTTP endpoint
that someone could POST to directly without ever loading the page.

`getCurrentUser()` is wrapped in React's `cache()`. Three different things now
ask "who's logged in?" while building one page — the header, the dashboard
layout's guard, and often the page itself. `cache()` makes the first call do the
work and hands the same answer to the rest, so it's one database query per
request instead of three. The cache lives for a single request, so it can never
serve one visitor's session to another.

### The header (`components/Header.tsx`)

This replaces the old navbar completely. Four things were wrong with it, and
each fix is worth understanding:

**It grew on scroll.** The `.sticky-header` CSS class set `height: 80px` while
the div inside it was Tailwind's `h-16` (64px), and a `line-height: 82px` fought
both. Now the height is `h-16`, full stop, in one place. Scrolling only adds a
shadow and a border — never a size.

**The gradient didn't render.** It was written as `from-1% ... to-1%`, which
puts every colour stop at the same position, so there's nothing to blend
between. The stops are gone; the three colours now spread across the bar
normally.

**The mobile menu reopened by itself on resize.** The old version toggled a
`.show` class onto the DOM by hand, and nothing ever took it off, so the class
sat there waiting and the menu reappeared the moment the window narrowed. The
open/closed state is now a piece of React state (`menuOpen`), which is the real
fix — the panel can only be open if the variable says so. `lg:hidden` and a
media-query listener are belt and braces on top.

That listener watches `matchMedia("(min-width: 64rem)")` rather than the plain
`resize` event, and that's deliberate: on phones, `resize` fires when the
address bar collapses or the keyboard slides up, which would close the menu
under your thumb for no reason.

**The links wobbled on hover**, because hovering changed the font weight, and
bold text is wider than normal text, so every link beside it shifted. Hover now
only changes colour and background.

Two structural details in that file that look odd but aren't:

The header and the mobile menu are *siblings* inside a fragment, not nested. The
`backdrop-blur` on the header makes it a "containing block", which means a
`position: fixed` child is positioned against the header rather than the window
— a fixed overlay nested inside it collapses to 64px tall and stops working.

The closed menu gets `inert`. Invisible is not the same as gone: an `opacity-0`
button is still tabbable, so without `inert` a keyboard user on a phone could
tab into the hidden menu and press "Log out" without ever seeing it.

The logged-in state comes from `app/layout.tsx`, which is a Server Component and
can read the session cookie. It passes down only `name`, `email` and `role` —
not the whole user record, because anything handed to a Client Component gets
serialised and sent to the browser, and that record contains the password hash.

### Contact form (`app/contact/`, `lib/mail.ts`)

`page.tsx` is a Server Component with a plain `<form>` pointing at a server
action, so there's no client-side JavaScript on the page at all — the form
still submits if JS hasn't loaded.

`actions.ts` validates, saves, then emails, in that order. Saving first means an
enquiry is never lost to a bad API key. `sendContactEmail()` returns `true`/
`false` and never throws, so a Resend outage can't turn into an error page for
someone whose message is already safely stored — and the `emailSent` column
records which is which, so a broken key is visible in the inbox instead of
failing silently.

There's a honeypot: a field called `website`, hidden with `sr-only`, that real
visitors never see and bots fill in anyway. Anything arriving with it filled is
dropped — and the visitor is shown the *success* message rather than an error,
because a bot told it failed just tries again.

Every field also has a length cap checked on the server. The `maxLength`
attributes on the inputs are a courtesy to real people; they stop the typing,
they don't stop the request. Anyone can POST straight to a server action with no
browser involved, which is the general rule worth taking from this: a limit that
only exists in the browser is not a limit.

### Admin inbox (`app/admin/messages/`)

Every enquiry, newest first, with unread ones flagged by a coloured left edge.
Mark read/unread, delete, and a `mailto:` link that pre-fills the reply. The
unread count also appears as a card on the admin overview.

The read/unread and delete actions use `updateMany` and `deleteMany` rather than
`update` and `delete`. That's not a typo — the `many` versions quietly affect
zero rows when the id no longer exists, while the singular versions throw
`P2025` and produce a 500. Since two admins clicking Delete on the same message
is entirely plausible, quietly doing nothing is the better outcome.

### Admin side (`app/admin/`)

`page.tsx` is the overview: patient count, doctor count, pending and confirmed
appointment counts, unread messages, and the five newest signups. All the
queries run inside one `Promise.all` so they hit the database in parallel rather
than one after another.

`users/page.tsx` lists every account with its signup date and time, how many
appointments they've booked, and their full profile — age worked out from their
date of birth, gender, phone, blood group, allergies, emergency contact and
notes. Anything they haven't filled in shows as a dash.

`doctors/page.tsx` is the form that replaces the old hard-coded list. It uploads
a real image file. Note there's no `encType` on the form: when a form's `action`
is a server action, React sets the encoding itself.

`appointments/page.tsx` shows every appointment with buttons to confirm,
complete, cancel or reset it. Each button is its own tiny `<form>` carrying the
appointment id and the target status as hidden fields — that's the simplest way
to have several actions on one page without writing a client component.

### Patient side (`app/dashboard/`)

`profile/page.tsx` is the form for their own details, grouped into Basics,
Emergency contact and Medical details. It uses `defaultValue` rather than
`value` so the inputs stay editable without needing React state.

`profile/actions.ts` saves it with `upsert`, which updates the row if a profile
exists and creates it otherwise. The important line is `where: { userId: user.id }` —
that id comes from the session cookie, never from the form, so a patient can
only ever edit their own profile.

`page.tsx` displays those same details back, with a prompt card if they haven't
filled anything in yet, plus their next upcoming appointment.

`appointments/page.tsx` books appointments with a free date and time picker.
Cancelling uses `updateMany({ where: { id, patientId: user.id } })` — scoping by
`patientId` is what stops someone cancelling a stranger's appointment by
guessing an id.

### Photo uploads

`lib/uploads.ts` writes to `public/uploads/doctors/` and returns the URL path to
store in the database. It only accepts PNG, JPEG and WebP, caps files at 2MB,
and builds its own filename with `crypto.randomUUID()` instead of trusting the
uploaded one — a name like `../../evil.js` could otherwise escape the folder.
Deleting a doctor also deletes their photo file, so you don't accumulate
orphans.

**This will not work on Vercel.** Their filesystem is read-only and wiped
between requests. When you deploy, swap the `writeFile` call for Vercel Blob or
Cloudinary; the rest of the app only ever sees the returned string, so nothing
else has to change. `public/uploads` is in `.gitignore` so uploaded photos stay
out of your repo.

---

## 4. Known rough edges

**Every page is now rendered per-request.** The header shows who's logged in,
which means the root layout reads the session cookie, which means Next can't
prerender anything as static — including `/home` and `/doctors`. That's the
correct trade for a logged-in header and it's how most apps with accounts work,
but it is a change: those two pages used to be built once. If you ever want them
static again, the move is to drop the header out of the root layout and render
it per-route-group instead.

**Timezones on appointments.** A `datetime-local` input sends
`"2026-09-01T14:30"` with no timezone, so Node reads it as the *server's* local
time. Since times are also displayed with the server's clock, patients see back
exactly what they picked, so it's self-consistent — but the stored instant will
be off if the server runs in a different zone from your users. There's a comment
in `app/dashboard/appointments/actions.ts` explaining how to fix it properly if
you need to.

**The contact form has no rate limit.** It's a public endpoint that writes a
database row and sends an email on every hit. The honeypot stops lazy bots;
a determined one would still get through. If it becomes a problem, the usual fix
is a per-IP limit in middleware, or Cloudflare Turnstile in front of the form.

**`AUTH_SECRET` in `.env` is now unused** — it belonged to NextAuth. Safe to
remove.

**Your `.env` holds a live Neon password and a plaintext admin password.** It's
correctly covered by `.gitignore`, but it's worth confirming it was never
committed earlier with `git log --all --oneline -- .env`. If anything comes
back, rotate both.

---

## 5. Where to go next

The medical fields are deliberately minimal, since you mentioned wanting to
revisit them after user feedback. Adding one means three small edits: a field on
`UserProfile` in `prisma/schema.prisma`, an input in
`app/dashboard/profile/page.tsx`, and one line in
`app/dashboard/profile/actions.ts`. Then re-run the migration.

Other natural next steps: let patients leave the ratings that currently have to
be typed in by hand, stop double-booking the same doctor for the same slot,
give the admin a way to edit a doctor rather than only add and remove, and page
the admin inbox once it outgrows the 100-message ceiling it currently loads.

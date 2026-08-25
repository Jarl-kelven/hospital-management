# HealthNet — pitch, cheat sheet and defence notes

Everything here is true of the code in this repo. If you can explain the
contents of this file in your own words, and open the file each claim refers to,
you can defend the app.

Study order: the 60-second pitch (§1), then the request lifecycle (§3), then the
bug log (§6). The bug log is the part that proves authorship — anyone can memorise
an architecture diagram, but only the person who built something knows what broke
along the way. Then §11 for questions and answers, and §12 for the awkward
questions about the repo itself, which you want to disclose rather than be caught
by. `CHEATSHEET.md` is the condensed version to skim just before a call.

---

## 1. The pitch

### 30 seconds

> HealthNet is a hospital management app. Patients sign up, fill in a medical
> profile and book appointments with doctors; an admin manages the doctors,
> approves or cancels every appointment, and reads enquiries from the contact
> form in a built-in inbox. It's Next.js with the App Router, Prisma against
> Neon Postgres, and I wrote the authentication myself rather than using a
> library — bcrypt for passwords, hashed session tokens in a database table.

### 60 seconds (add this)

> There's no API layer. Pages are Server Components that query the database
> directly, and every write is a Server Action — a function that runs on the
> server and is posted to by a plain HTML form. That means the admin's
> "Confirm appointment" buttons and the whole profile form work with no client
> JavaScript at all.
>
> The two things I'd point at as the interesting engineering: first, security is
> enforced at the action, not the page — every server action re-checks the
> session itself, because a server action is a real HTTP endpoint someone can
> call directly, so a guard in the layout proves nothing. Second, ownership
> always comes from the session cookie and never from the form — cancelling an
> appointment queries `where: { id, patientId: user.id }`, so editing a hidden
> field in devtools can't touch someone else's record.

### If they ask "why not NextAuth / Clerk / Auth.js?"

> The project started with both my own auth and NextAuth half-wired in, and I
> had to pick one. I kept mine because I wanted to understand sessions rather
> than configure them — and because the app's needs are narrow: email and
> password, two roles, no OAuth. What I'd change for production is the parts a
> library gives you free: rate limiting on login, email verification, and
> password reset. I know exactly which of those are missing, which is the point.

---

## 2. The two-minute demo path

Rehearse this until it's muscle memory. Don't narrate the UI — narrate what's
happening on the server.

1. **Home page.** "Marketing page. The doctor cards further down are database
   rows, not a hard-coded array — they used to be an array in `data/doctors.ts`
   and I moved them."
2. **Sign up.** "This form posts to a Server Action. Password is bcrypt-hashed
   at cost 12. The role is hardcoded to `USER` in the action — the form can't
   send a role."
3. **Log in → lands on the patient dashboard.** "The action compares the hash,
   deletes any existing sessions for that user, creates a new one and sets an
   httpOnly cookie. Then it redirects by role: admin to `/admin`, everyone else
   to `/dashboard`."
4. **Fill in the profile → it appears back on the dashboard.** "One `upsert`, so
   the same form handles first save and every edit. Note I store date of birth,
   not age — an age saved as a number goes stale."
5. **Book an appointment.** "Server-side checks: real date, in the future, and
   the doctor still exists. Then `revalidatePath` on three pages so the patient
   dashboard, this list and the admin's list all show it."
6. **Log out, log in as admin → `/admin`.** "Same login form, different
   destination, decided by the role on the user row."
7. **Admin users page.** "Every account with signup date and time, and their
   profile if they've filled one in."
8. **Admin appointments → Confirm.** "That's a one-button form per row posting a
   status. The action checks the value against the four enum members before
   trusting it."
9. **Contact form → admin inbox.** "The message is written to the database
   first, then emailed via Resend. If the email fails the row is still there,
   flagged `emailSent: false`, and the inbox shows an amber badge. An enquiry is
   never lost to a bad API key."

---

## 3. Architecture, in the order a request happens

Know this cold. It's the single most common way an interviewer separates
builders from copiers: they ask what happens between the click and the screen.

**A patient clicks "Cancel" on an appointment.**

1. The browser posts a form. There's no `fetch`, no JSON, no route handler — the
   form's `action` is a reference to `cancelMyAppointmentAction`, and Next turns
   that into a POST to the current URL with an action id.
2. `"use server"` at the top of `app/dashboard/appointments/actions.ts` is what
   makes that function callable from the browser at all.
3. The action calls `requireUser()`. That reads the `healthnet_session` cookie,
   SHA-256s the token, looks up the `Session` row by that hash, checks the
   expiry, and returns the joined user — or redirects to `/login`.
4. It runs `updateMany({ where: { id, patientId: user.id } })`. Both conditions.
   The id came from the form and is untrusted; the patient id came from the
   cookie and is trusted.
5. `revalidatePath` throws away the cached render of the affected pages.
6. `redirect()` sends the browser to the same page with `?success=...`, which the
   page reads from `searchParams` and shows as a banner.

**A visitor loads any page.**

`app/layout.tsx` is an `async` Server Component. It awaits `getCurrentUser()` so
the header can show either "Log in / Sign up" or the person's name, avatar and a
"Log out" button. Reading a cookie in a layout that wraps everything makes every
route render per request — a real trade-off, and a deliberate one: the header
differs by viewer, so it can't be built once at deploy time.

---

## 4. Decisions, and what you rejected

Interviewers care less about what you chose than whether you know the
alternative. Each of these is "what I did / why / what I turned down".

**Auth: bcrypt + a `Session` table.** Random 32-byte token, SHA-256 of it stored
in the database, the raw token in an httpOnly cookie. *Why hash the token?* Same
reason as passwords: a leaked database then contains no usable sessions.
*Rejected:* JWTs in a cookie. They're stateless, which sounds better until you
need to log someone out — you can't revoke a JWT, only wait for it to expire. A
database session is one `DELETE` away from being gone.

**Cost factor 12 on bcrypt.** Deliberately slow — a couple of hundred
milliseconds — so brute-forcing a stolen hash is expensive. The number is an
exponent: each step up doubles the work.

**One active session per user.** Logging in deletes that user's other sessions.
*Why:* it's the simplest correct thing, and it means a password change story
later has one place to clean up. *Trade-off I know about:* logging in on your
phone signs you out on your laptop. For a clinic app that's arguably a feature;
for a consumer app it wouldn't be.

**Server Actions, no `app/api` folder.** *Why:* the app has no other consumers.
An API layer exists to be called by something that isn't your own page — a
mobile app, a third party. Adding one here would mean writing a fetch wrapper, a
serialisation format and error handling for no benefit. *What I'd change:* if a
React Native client ever needed the same data, route handlers become worth it.

**Guards live in the action, not just the layout.** `app/admin/layout.tsx` calls
`requireAdmin()`, but so does every single admin action. *Why:* the layout
protects the page render; it doesn't protect the endpoint. A logged-in
non-admin who knows the action id could post to it directly.

**`updateMany` / `deleteMany` where a row might be gone.** Prisma's `update` and
`delete` throw P2025 when nothing matches, and an uncaught throw in a server
action is a 500 page. The plural versions report a count instead, so a stale
button becomes a message.

**Date of birth, not age.** Age is computed on display with UTC getters. *Why
UTC:* `<input type="date">` sends `2000-05-10`, which JavaScript stores as
midnight UTC. Read that back with `getDate()` on a server in a timezone behind
UTC and you get the 9th — every age off by one for part of the year.

**Photos to disk, and I know it's wrong for production.** `lib/uploads.ts`
writes to `public/uploads/doctors/`. On Vercel the filesystem is read-only and
per-invocation, so this breaks the moment it's deployed. The fix is Vercel Blob,
S3 or Cloudinary; the function is small and returns a URL string, so swapping it
touches one file. Saying this before they find it is far stronger than being
caught by it.

**Validation by hand rather than Zod.** Zod is even still in `package.json`,
unused — worth deleting. *Why by hand:* the forms are small and the error
handling is a redirect with a query string, so a schema library would add a
concept without removing code. *When I'd add it:* the moment an action takes
nested or repeated data, where hand-written checks stop being readable.

---

## 5. The tricks index — things to point at in the code

Each line is something you can open and explain. This is your recall list.

**Auth and security**

- `crypto.randomBytes(32).toString("hex")` for tokens — 64 hex characters of
  cryptographically secure randomness, not `Math.random()`.
- SHA-256 for the token, bcrypt for the password. Different jobs: a token is
  already high-entropy so it needs speed, not slowness; a password is guessable
  so it needs to be slow on purpose.
- Cookie flags in `lib/auth.ts`: `httpOnly` (JavaScript can't read it, so an XSS
  bug can't steal the session), `sameSite: "lax"` (it isn't sent on cross-site
  POSTs, which is the CSRF defence — plus Next verifies the Origin header on
  Server Action requests), `secure` in production only so localhost still works,
  and an `expires` that matches the row in the database.
- Role is set server-side at signup (`role: "USER"`), never read from the form.
- Enum values from a form are checked against a `const` tuple before use —
  `VALID_STATUSES.includes(...)` — and the type comes from the same tuple via
  `(typeof VALID_STATUSES)[number]`, so the list and the type can't drift apart.
- Uploads: MIME allowlist, 2 MB cap, and the **extension is derived from the MIME
  type, never from the uploaded filename** — a filename is attacker-controlled
  and can contain `../` or `.php`. The stored name is a `crypto.randomUUID()`.
  Deleting runs the path through `path.basename` for the same reason.
- Email header injection: the contact subject has `\r\n` stripped before it goes
  into a mail header, because a newline in a header lets someone inject their own
  headers — extra recipients, for instance.
- `escapeHtml` in `lib/mail.ts` replaces `&` **first**. Do it last and you
  double-escape the ampersands you just introduced.
- A `sr-only` honeypot field named `website` on the public form: invisible to
  people, filled in by naive bots, and a filled one is silently accepted so the
  bot can't tell it failed.
- Server-side length caps **on the contact form** — `maxLength` on an input is a
  courtesy to the person typing, and a scripted POST ignores it entirely.
  Say this one precisely. The caps are real in `app/contact/actions.ts`, and
  that's the only action that has them. `dashboard/profile` and `admin/doctors`
  accept unbounded free text (`notes`, `allergies`, `address`, doctor `name`).
  If you claim it app-wide, one grep for `.length >` contradicts you. The honest
  line is: "I capped the public form because it's the unauthenticated attack
  surface; the authenticated forms still need it and that's a gap."

**Data**

- Prisma 7 requires a **driver adapter** — `new PrismaNeon({ connectionString })`
  — and the datasource URL moved out of `schema.prisma` into `prisma.config.ts`.
- Two connection strings: the **pooled** `DATABASE_URL` for the running app,
  because a serverless app opens and drops connections constantly, and the
  **direct** `DIRECT_URL` for migrations, which need one real session.
- Prisma 7 doesn't auto-generate the client, hence `"postinstall": "prisma
  generate"` in `package.json`.
- The client is a singleton stashed on `globalThis` in development, because
  hot reload re-runs the module and you'd otherwise collect a new connection
  pool on every save.
- `Promise.all` on the admin overview — **six queries**, five of them `count`s
  plus one `findMany` for the five newest users, resolved in the time of the
  slowest rather than the sum of all six. Count them before you quote a number;
  "five counts and a findMany" is the safe phrasing.
- `@@index` on `doctorId`, `patientId`, `scheduledAt` and `ContactMessage.
  createdAt`: the columns actually filtered and sorted on.
- `onDelete: Cascade` on the relations, so deleting a user takes their sessions,
  profile and appointments with them instead of leaving orphans.
- `take: 100` on the inbox query. An unbounded `findMany` is a page that gets
  slower every week until it falls over.
- `upsert` for the profile, so one form and one action cover create and update.

**Next.js and React**

- Server Components query the database; Client Components exist only where
  something needs state. The whole footer ships zero JavaScript.
- `getCurrentUser` is wrapped in React's `cache()`, so the layout, the guard and
  the page share one query per request instead of three.
- Only `{ name, email, role }` is passed to the header — anything handed to a
  Client Component is serialised into the HTML, and the user record contains the
  password hash.
- `redirect()` works by throwing, so it must never sit inside a `try` block —
  the `catch` would swallow the navigation. It also returns `never`, which is
  why TypeScript narrows out the null case after `if (!user) redirect(...)`.
- Cookies can't be written during a Server Component's render, only in an action
  or a route handler.
- `revalidatePath` after every mutation, listing each page whose data changed.
- `params` and `searchParams` are Promises in Next 15+ and have to be awaited.
- `(auth)` is a route group: shared layout, no `/auth` in the URL.

**CSS and UI**

- Tailwind v4 has no config file — theme tokens are declared in
  `@theme` in `app/globals.css`, and that's where `primaryColor` comes from.
- The utilities layer beats the components layer, so a utility class on an
  element wins over an `@layer components` rule regardless of specificity.
- next/font with `variable:` exposes the font as a CSS custom property rather than
  a class, and setting `--font-sans` in `@theme` is what hands it to Tailwind.
  Precise version, in case you're pushed: Tailwind's own `theme.css` already
  derives `--default-font-family` from `--font-sans`, so `--font-sans` alone is
  sufficient. The explicit `--default-font-family` line in `globals.css` is
  belt-and-braces, not a requirement — don't claim both lines are mandatory.
- `scroll-mt-20` on anchor targets, so a sticky header doesn't cover the heading
  you just jumped to.
- `next/image` `width`/`height` are the file's real pixels — used to reserve
  space and prevent layout shift — and `h-auto` keeps the aspect ratio when CSS
  changes only the width.
- Inline SVG with `fill="currentColor"` instead of an icon package: four icons
  aren't worth a dependency, and `currentColor` makes them inherit hover colours
  for free.
- `focus-visible` rather than `focus`, so the keyboard ring doesn't appear on
  mouse clicks.
- `prefers-reduced-motion` collapses every transition to near-zero.

---

## 6. The bug log — your strongest evidence

Nobody can borrow these. Learn two or three properly and lead with them when
asked "what was hard?"

**The header grew when you scrolled.** A leftover CSS rule set
`height: 80px; line-height: 82px` on a scrolled header that was otherwise 64px
tall, so the bar jumped and the text stretched. The rebuild fixes the height at
`h-16` and lets scroll change *only* the shadow and border colour.

**The mobile menu reopened by itself when the window resized.** The old menu was
shown by adding a `.show` class and never removing it. Rewritten as React
state, plus — and this is the better half of the answer — the "close on resize"
listener watches `window.matchMedia("(min-width: 64rem)")` and its `change`
event rather than the `resize` event, because on a phone `resize` fires when the
address bar collapses or the keyboard opens, which would close the menu for no
reason.

**A `box-shadow` the browser was silently ignoring.** `3px 3px -8px 3px #ddd` —
a blur radius can't be negative, so the whole declaration was thrown away. A
good reminder that CSS fails silently.

**The best one: `backdrop-blur` broke the mobile menu overlay.** The menu was a
child of the header. `backdrop-filter`, like `filter`, makes an element a
*containing block* for `position: fixed` descendants — so `fixed inset-x-0
top-16 bottom-0` inside a 64px-tall header resolved against the header, not the
window, and the overlay collapsed to zero height. The backdrop was there in the
DOM and un-clickable. Fix: make the header and the menu **siblings**, not parent
and child. Explaining that one convincingly is very hard to fake.

**The invisible menu was still keyboard-tabbable.** `opacity-0` and
`pointer-events-none` hide something from the mouse and the eye but leave it in
the tab order, so a keyboard user could tab into the closed menu and press
"Log out". Fixed with the `inert` attribute, which removes a subtree from both
the tab order and the accessibility tree. I didn't use `visibility: hidden`
because `visibility` doesn't transition smoothly and would have killed the fade.

**The hamburger bars jumped before rotating.** They animate `top` as well as
`rotate`, and `transition-transform` doesn't cover `top` — so that half snapped.
Changed to `transition-all`.

**`font-semibold` looked identical to `font-bold`.** This is the subtle one. The
font was PT Sans, loaded at weights 400 and 700. `font-semibold` is 600, and the
app used it in 27 places. A browser asked for a weight a family doesn't
have doesn't fail — it silently substitutes the nearest one, so every 600
rendered at 700 and the whole type hierarchy flattened into two levels instead of
three. I proved it by reading the generated `@font-face` blocks and finding only
400 and 700.

The interesting part is the second half. I first fixed it by moving to Source
Sans 3, a *variable* font — one file covering the whole 200–900 range, so 600 is
always really there. When I later switched the design to Poppins I hit the same
trap from the other direction: Poppins is **not** variable, it's nine separate
static files. So the fix there is to name the weights explicitly —
`weight: ["400", "600", "700"]`, exactly what the app uses. The general lesson is
that "the font supports 600" and "the browser was *sent* 600" are different
claims, and only the second one matters.

**Appointment times had no AM or PM.** `toLocaleTimeString("en-GB")` with `hour`
and `minute` gives a 24-hour clock, because that's what the locale specifies —
"14:30", never "2:30 PM". `hour12: true` has to be explicit. It lives in one
helper in `lib/format.ts`, so fixing it once fixed all **six** places that show a
time — the four admin pages (appointments, messages, overview, users) and the two
dashboard pages (overview, appointments). Quote the method name and the number
accurately; both are one grep away.

There's a tail to this one. The times still looked wrong after the fix, and the
instinct was to go on editing the formatter. The formatter was fine — I proved it
by importing the real module and printing its output (`24 Aug 2026, 2:30 PM`).
What was stale was Turbopack's persistent cache in `.next`, which still held
chunks compiled *before* the change; you could see it because the same cache
still contained references to PT Sans and to CSS classes I'd already deleted. The
lesson is to establish whether you're debugging your code or your build output
before changing a line — a `.next` older than the file you just edited is the
tell, and `rm -rf .next` is the whole fix.

**`??` where I needed `||`.** `process.env.CONTACT_FROM_EMAIL ?? fallback` only
falls back on `null`/`undefined` — an empty value in `.env` is an empty *string*,
which sails through and makes every email send fail with a blank sender. `||`
treats empty string as falsy, which is what's wanted here.

**Resend returns errors, it doesn't throw them.** `resend.emails.send()` resolves
to `{ data, error }`. Wrapping it in `try/catch` and assuming success in the happy
path silently swallows every failure. `sendContactEmail` checks `error` and
returns a boolean instead, and the caller records that as `emailSent`.

**And the reason "the email didn't arrive" usually isn't a bug.** Resend's
sandbox sender, `onboarding@resend.dev`, only delivers to the address you signed
up with. Setting `CONTACT_FROM_EMAIL` to an address on a verified domain is the
fix.

---

## 7. Weak spots — and the answer that makes each a strength

Volunteer these. "I know what's missing" reads as senior; being caught out reads
as borrowed.

| Gap | What to say |
| --- | --- |
| No rate limiting on login | "There's nothing stopping a password-guessing script. bcrypt at cost 12 makes each attempt slow, which helps, but the real fix is attempt counting per email and per IP — I'd use Upstash Redis rather than the database, so the counter isn't a write per attempt." |
| No email verification or password reset | "Both need transactional email, which the app now has via Resend, and a short-lived signed token. It's the next thing I'd build." |
| Passwords only need 8 characters | "Length is the only rule I enforce. I'd add a check against a breached-password list before adding complexity rules — those mostly produce `Password1!`." |
| Uploads go to local disk | "Breaks on Vercel; the filesystem is read-only and per-invocation. One function to swap." |
| No double-booking protection | "Two patients can request the same doctor at the same minute. Needs a doctor availability model and a unique constraint on doctor plus slot — the database has to enforce it, not the action, or two simultaneous requests both pass the check." |
| Admin lists don't paginate | "The inbox takes the newest 100; the others are unbounded. Fine at this size, and I know where it stops being fine." |
| Nothing is unit tested | "No tests, and I won't pretend otherwise. The first ones I'd write are the pure functions in `lib/format.ts` — age across a birthday boundary, times either side of noon — and then the auth guards, because they're the highest-consequence branch in the app." |
| Every page renders per request | "Because the root layout reads the session cookie for the header. The marketing pages could be static again if the header fetched its user client-side, but that trades a static page for a flash of the wrong state." |
| The footer has non-clickable labels | "Blog, Careers and Privacy Policy are plain text, not links, because those pages don't exist. Linking them would mean shipping 404s. They become links the moment the pages do." |

---

## 8. Fast-recall facts

| Question | Answer |
| --- | --- |
| Stack | Next.js 16 App Router, React 19, TypeScript, Prisma 7, Neon Postgres, Tailwind v4, Resend |
| Models | `User`, `UserProfile`, `Session`, `Doctor`, `Appointment`, `ContactMessage` |
| Enums | `Role`, `Gender`, `AppointmentStatus` |
| Password hashing | bcryptjs, cost factor 12 |
| Session token | 32 random bytes as hex; SHA-256 stored; raw value in the cookie |
| Cookie | `healthnet_session`, httpOnly, SameSite=Lax, Secure in production, 7 days |
| Ids | `cuid()` |
| Where writes live | Server Actions in `actions.ts` next to each page; no `app/api` |
| Guards | `requireUser()` / `requireAdmin()` from `lib/auth.ts`, in the layout *and* every action |
| Post-mutation | `revalidatePath(...)` then `redirect("...?success=...")` |
| Upload limits | PNG / JPEG / WebP, 2 MB, UUID filename, extension from MIME type |
| Theme colours | `primaryColor` `#c80040`, `primaryLight` `#ff85ab`, declared in `@theme` |
| Font | Poppins via next/font, static weights 400/600/700 only |

---

## 9. Proving it live

If someone hands you the keyboard, these are the things a builder can do and a
borrower can't. Practise each one once.

Add a field to the patient profile end to end: a line in `schema.prisma`,
`npm run db:migrate`, an input in the form, one line in the action's `data`
object, one line in the display. Four files, and you should know all four
without searching.

Explain a file you haven't opened in a while — `lib/auth.ts` is the one to know
by heart, and be ready for "why hash the token as well as the password?".

Trace an error backwards. If they break something on purpose, say out loud what
you're checking and why. Reasoning aloud is the tell; a memorised answer can't
adapt.

Point at a comment and explain the decision behind it. The comments in this
codebase explain *why*, not *what* — if you wrote them, you can expand any one of
them into a paragraph.

---

## 10. Words to use precisely

Getting vocabulary slightly wrong is what gives borrowed work away. These are
the ones this app makes you say.

A **Server Component** renders on the server and sends HTML; it can be `async`
and query the database. A **Client Component** is marked `"use client"` and
ships JavaScript so it can hold state. A **Server Action** is an `async` function
marked `"use server"` that a form can post to directly. **Hydration** is React
attaching event handlers to server-rendered HTML in the browser. A **driver
adapter** is the piece that lets Prisma talk over Neon's HTTP protocol instead
of a raw Postgres socket. A **migration** is a versioned SQL file describing a
schema change; `prisma generate` is the separate step that rebuilds the
TypeScript client. **Pooled versus direct** connections: pooled for the app,
direct for migrations. A **containing block** is the ancestor a positioned
element measures itself against — the thing `backdrop-filter` quietly changed.

---

## 11. Interview questions and answers

Every answer below is checked against the code. Where a number appears, it is the
real number. Read the answers, then close the file and say them in your own words
— an interviewer is listening for understanding, not recitation, and a
word-perfect answer delivered flatly is more suspicious than a rough one
delivered with reasons.

### Auth and sessions

**Walk me through what happens when someone logs in.**

The form posts to a Server Action. It looks the user up by email, and if there's
no row it still returns the same generic "Invalid email or password" — telling
someone which half was wrong is an account-enumeration oracle. Then
`bcrypt.compare` against the stored hash. On success it deletes that user's
existing sessions, generates 32 random bytes as hex, stores the SHA-256 of that
token in the `Session` table with an expiry seven days out, and sets the raw
token in an httpOnly cookie called `healthnet_session`. Then it redirects by
role: `ADMIN` to `/admin`, `USER` to `/dashboard`.

**Why hash the session token? It's random already — what does hashing add?**

This is the question they'll actually ask, so be precise. Hashing the token has
nothing to do with guessability; 32 random bytes are unguessable either way. It
protects against a *database* compromise. If someone reads the `Session` table —
a leaked backup, a SQL injection somewhere, an over-privileged support tool —
plaintext tokens would let them mint a valid cookie for every logged-in user
without touching a password. Storing only the SHA-256 means what they steal isn't
a credential: you can't reverse it to the cookie value. It's the same reasoning as
hashing passwords, applied to the other long-lived secret.

**Then why SHA-256 for the token but bcrypt for the password?**

Because the threat models differ. A password is low-entropy and human-chosen, so
it needs a *deliberately slow* hash — bcrypt at cost 12 makes brute force
expensive. A session token is 256 bits of randomness; there is no dictionary to
try, so slowness buys nothing and a fast hash matters because it runs on every
single request. Using bcrypt on session lookups would add real latency for no
security gain.

**Where does the cost factor 12 come from?**

It's the tuning knob for bcrypt's work factor, and it's logarithmic — 12 means
2^12 rounds. The trade-off is user-visible latency against offline cracking cost.
12 is the current common default; 10 is getting cheap for modern hardware, and 14
starts to be noticeable on login. It's a number to revisit as hardware improves,
not a constant.

**Your cookie is SameSite=Lax. Isn't that a CSRF hole?**

`Lax` withholds the cookie on cross-site *subrequests* but sends it on top-level
navigations, which is what keeps a normal inbound link from logging you out.
Cross-origin POSTs — the actual CSRF shape — don't get the cookie. On top of
that, Next verifies the Origin header on Server Action requests. So the defence
is two-layered, and neither layer is something I hand-wrote, which is worth
saying plainly.

**What does `React.cache()` around `getCurrentUser` actually do?**

Within a single request, the root layout, the route guard and the page all want
the current user. `cache()` memoises the call for the lifetime of that request,
so it's one database round trip instead of three. It is per-request, not a shared
cache across users — an important distinction, because a session lookup cached
across requests would be a security bug.

**What happens when a session expires?**

`getCurrentUser` compares the row's expiry to now; if it's past, it deletes the
row and returns null, so the user is treated as logged out. There's a wrinkle I
left in on purpose and documented: it does *not* clear the cookie, because you
can't mutate cookies during render in the App Router. The stale cookie is
harmless — its token no longer matches any row — but it does sit in the browser
until the next login or logout. If asked how I'd fix it: do the cleanup in
middleware or on the next action, where mutation is allowed.

**Logging in deletes all the user's other sessions. Why?**

Honest answer: simplicity, not security — and the comment in the code says
`// Optional`. It means one active session per user. The cost is real: signing in
on your phone silently signs you out on your laptop. I'd drop it for a
multi-device product, or keep it and add an explicit "sign out everywhere"
instead of doing it implicitly on every login.

**Your admin layout already calls `requireAdmin()`. Why call it again in every
action?**

Because a Server Action is a real HTTP endpoint, not a function that only exists
inside a page. Next gives it an ID and anyone can POST to it directly with curl.
The layout guard protects *rendering* the admin UI; it does nothing for a request
that skips the UI entirely. So authorisation belongs in the action. This is the
single most important security idea in the app and the one most likely to be
probed.

**How do you stop a patient cancelling someone else's appointment?**

The appointment id comes from the form, but the owner never does. The query is
`updateMany({ where: { id, patientId: user.id } })` where `user` comes from the
session cookie. If the id belongs to someone else, zero rows match and nothing
happens. Trusting a `patientId` from a hidden input would be the classic IDOR.
`updateMany` rather than `update` is deliberate too — the singular version throws
P2025 on no match, which surfaces as a 500 instead of a quiet no-op.

### Prisma, Neon, data

**Why does `schema.prisma` have no database URL in it?**

Prisma 7 moved it. The datasource block declares only `provider`, and the URL is
supplied from `prisma.config.ts`, which resolves `DIRECT_URL ?? DATABASE_URL` and
also points at the seed script. Related: Prisma 7 no longer auto-generates the
client on install, which is why there's an explicit
`"postinstall": "prisma generate"`.

**What's a driver adapter and why do you need one?**

In Prisma 7 it's mandatory rather than opt-in. Instead of Prisma opening its own
Postgres socket through its Rust engine, the adapter — `PrismaNeon` here — lets
it talk over Neon's serverless driver. That matters in a serverless environment
where you don't have a long-lived TCP connection to keep.

**You have two connection strings. Explain.**

`DATABASE_URL` is Neon's pooled endpoint, used by the running app, because a
serverless app creates and drops connections constantly and would exhaust
Postgres' connection limit without a pooler. `DIRECT_URL` is the unpooled one,
used for migrations, because a migration needs one real session — it takes
advisory locks and runs DDL, and a pooler can hand consecutive statements to
different backends.

**Why is the Prisma client stashed on `globalThis`?**

Hot reload re-executes the module on every save. Without the global, each save
constructs a new client and a new connection pool, and you run out of
connections within an afternoon of editing. The guard is
`NODE_ENV !== "production"` — so "outside production", which includes test, not
strictly "in development". Small distinction, but it's what the code says.

**Which columns did you index, and why those?**

`Appointment.doctorId`, `Appointment.patientId`, `Appointment.scheduledAt`, and
`ContactMessage.createdAt` — the columns actually filtered or sorted on. The
principle is that an index earns its keep on reads and costs you on writes, so
you index what queries use rather than everything. Be careful with the phrasing:
the admin inbox also runs a `count` filtered on `isRead`, which no index serves.
If they push, that's a fair "yes, that one's unindexed" rather than a claim to
defend.

**Why `cuid()` instead of an auto-increment integer?**

Sequential integers leak information and invite enumeration — `/users/4` tells you
there are probably users 1 through 3. They also need a database round trip to
learn the id. A cuid is collision-resistant, generated without coordination, and
roughly sortable. A UUIDv4 would work too; cuid is shorter in a URL.

**What does `onDelete: Cascade` buy you, and what's the risk?**

It's on the profile, session and appointment relations, so deleting a user takes
their dependent rows instead of leaving orphaned foreign keys. The risk is that a
single mistaken delete silently removes a lot, and that appointments arguably
shouldn't vanish for record-keeping reasons — a real clinic would soft-delete or
anonymise instead. Good thing to volunteer before they raise it.

**Why `upsert` for the profile?**

One form serves both the first-ever save and every later edit, keyed on `userId`.
Without it I'd need to check for an existing row and branch, which is two queries
and a race condition. The `userId` comes from the session, never from the form.

### Next.js and React

**Where's your API layer? I don't see an `app/api` folder.**

There isn't one, deliberately. Reads happen in Server Components that query
Prisma directly, and writes go through Server Actions colocated in `actions.ts`
next to the page that uses them. A REST endpoint here would be a layer whose only
job is to serialise data so my own frontend can deserialise it. I'd add
`app/api` the moment something *external* needs to call in — a mobile client, a
webhook — because that's when a stable public contract starts earning its cost.

**How do you decide Server Component versus Client Component?**

Default to server; reach for `"use client"` only where something genuinely needs
browser state or an event handler. The header is a client component because it
has a mobile menu toggle; the footer is a server component and ships zero
JavaScript. The status buttons in admin are each a small `<form>` posting to an
action precisely so they don't need to be client components.

**Why does the root layout being `async` matter?**

It reads the session, and reading a cookie opts the route out of static rendering
— it has to render per request. Because this is the *root* layout, that applies
to the whole site. That's the right trade here, since the header differs per
viewer, but it's a real cost and you should know you're paying it.

**Why pass only `{ name, email, role }` to the header instead of the user
object?**

Anything handed to a Client Component gets serialised into the HTML payload and
shipped to the browser. The user record includes the bcrypt hash. Passing the
whole object would publish it in the page source. So the layout narrows it to the
three fields the header renders.

**What does `revalidatePath` do, and why then redirect?**

An action mutates data, but cached route output doesn't know that.
`revalidatePath` marks the affected routes stale so the next render re-queries.
The redirect afterwards is the POST/redirect/GET pattern — it stops a refresh
from resubmitting the form, and it carries the `?success=` or `?error=` state in
the URL.

### Validation, security, email

**How do you validate form input? I notice `zod` is in your dependencies.**

It's in `package.json` and it is not used anywhere — that's a leftover I should
remove, and I'd rather say so than have you find it. Validation is hand-written
in each action: check required fields, coerce, and redirect back with
`?error=...`. I chose that to understand the failure paths myself rather than
delegate them to a schema library. The honest trade-off is that Zod would give me
one source of truth for the shape plus inferred types, and by hand I risk drift
between actions. At this size I preferred the explicitness; on a larger team I'd
take the library.

**Enum values arrive from a form as strings. How do you keep bad ones out of the
database?**

A `const` tuple of the valid values, an `includes` check, and the TypeScript type
derived from that same tuple via `(typeof VALID_STATUSES)[number]`. The point of
deriving the type from the array is that the runtime check and the compile-time
type can't drift apart — add a status in one place and both update. Same pattern
for `Gender` in the profile action.

**Talk me through the upload path.**

MIME allowlist of PNG, JPEG and WebP; a 2 MB cap; the stored filename is a
`crypto.randomUUID()`; and the extension is derived from the MIME type, never
from the uploaded filename, because a filename is attacker-controlled and can
carry `../` or a second extension. Deletes run the stored path through
`path.basename` and additionally check it starts with `/uploads/doctors/`.

And the caveat I'd raise unprompted: it writes to local disk, which works in
development and **breaks on Vercel**, where the filesystem is read-only and
ephemeral. It's commented as such in the file. Shipping it would mean Vercel Blob,
S3 or Cloudinary. Don't call this part production-ready.

**Why strip `\r\n` from the contact subject?**

Because it goes into an email header, and a newline inside a header value lets
someone terminate it and inject their own — extra recipients, a different
reply-to. It's the email equivalent of SQL injection: the fix is refusing to let
user data become structure.

**Your `escapeHtml` replaces `&` first. Does the order matter?**

Yes, and it's the kind of detail that proves you wrote it. Escaping `<` produces
`&lt;` — which contains an ampersand. If you escape `&` last, you escape the
ampersands your own replacements just introduced and get `&amp;lt;` rendered
literally on screen. Ampersand first, always.

**You have a honeypot field. Why accept a filled one instead of rejecting it?**

If you return an error, the bot learns the field is a trap and its next version
leaves it blank. Redirecting to the success page teaches it nothing — from
outside, a caught submission is indistinguishable from a real one. In the code
that check runs before validation and before any database write, so nothing is
stored.

**Why save the contact message before sending the email?**

Because the database is the thing I control and the email API is the thing that
fails. If Resend is down or the key is wrong, an enquiry that arrived should not
evaporate. So the row is written first, then the send is attempted, and
`emailSent` records the outcome — it defaults to `false` in the schema and is
updated to `true` only on success. That's one write when sending fails and two
when it succeeds. The admin inbox shows a badge for the failures, so a broken key
is visible instead of silent.

**Why does `sendContactEmail` return a boolean instead of throwing?**

Because a failed notification email is not a failed enquiry. The caller needs to
carry on and still show the user a success message. Also worth knowing: Resend
*resolves* with an `error` property rather than rejecting, so a bare `await`
inside a `try/catch` looks like it succeeded — you have to check the returned
`error`. There's a `catch` as well, so the function never throws.

**And the `??` versus `||` thing?**

`process.env.CONTACT_FROM_EMAIL ?? fallback` only falls back on `null` or
`undefined`. An empty variable in `.env` is an empty *string*, which passes `??`
untouched and produces a blank sender on every email. `||` treats empty string as
falsy, which is what's wanted for config. The general rule: `??` for values where
empty or zero is meaningful, `||` for config where empty means absent.

### CSS and the font

**Why did the type hierarchy look flat before?**

The app used PT Sans, which ships only 400 and 700. `font-semibold` (600) appears
27 times. When a browser is asked for a weight the family doesn't have, it does
not fail — it silently substitutes the nearest available one. So every 600
rendered identically to 700 and three levels of emphasis collapsed into two.

**And why does Poppins need its weights listed explicitly?**

Because Poppins is a *static* family, not a variable font — Google serves nine
separate files, one per weight. With a variable font you can omit `weight` and get
the whole range from one file. With a static family, any weight you don't name
simply isn't downloaded, which walks straight back into the PT Sans bug. So
`weight: ["400", "600", "700"]` is exactly what the app uses: body, semibold,
bold. Three files rather than nine.

**Tailwind v4 with no config file — where does the theme live?**

In `@theme` inside `app/globals.css`. Tokens declared there become utilities, so
`--color-primaryColor: #c80040` gives me `bg-primaryColor`. Custom component
classes sit in `@layer components`, and the utilities layer beats the components
layer — so a utility on the element wins over my component rule regardless of
specificity, which is what makes one-off overrides work.

---

## 12. Awkward questions about the repository itself

Sections 7 and 11 cover the code. These are about the *repo* — the things a
reviewer finds by poking around rather than by reading source. Every one of them
is real. Knowing them beforehand turns an ambush into a shrug.

**"Your git history is one commit."**

It is: a single `Initial commit from Create Next App`. This is the biggest
authorship-evidence gap in the project, because none of the story in section 6 can
be corroborated from history — an interviewer cannot see the PT Sans fix, the
NextAuth removal, or the formatter change as commits.

Don't invent a reason. Say that you built it working directly on the tree and
committed once, that you now understand history is part of the deliverable, and
that the fix going forward is small commits with real messages. Then redirect to
evidence that *does* exist: the migration trail, the comments that explain
rejected alternatives, and your ability to change the code live. **If you do one
thing to this repo before showing it, make it this** — start committing per change
from here. A month of honest history is worth more than any document.

**"Why are there two migrations called `_init`, and two called
`profile_details_and_doctor_fields`?"**

Because the schema was rebuilt partway through, and the second `_init` drops and
recreates what the first one made. Sloppy naming, and worth owning as such: a
migration name should describe the change, and the last one is a good example of
the failure — it's called `profile_details_and_doctor_fields` but what it actually
creates is the `ContactMessage` table.

Now the useful half. **Open the first migration in the interview.** It creates
`Account`, `VerificationToken`, `PatientProfile` and `DoctorProfile`, with a
`Role` enum of `PATIENT`, `DOCTOR`, `ADMIN`. Those are NextAuth's table names.
That file is a fossil of the auth system you evaluated and abandoned, and the
second `_init` is where you tore it out and replaced it with your own `Session`
table and a two-value `Role`. Someone who cloned a finished app does not have an
abandoned architecture sitting in their migration folder. This is the single best
piece of authorship evidence in the repository — better than anything in this
document, because you can't fake it after the fact.

It also sets up the strongest version of the NextAuth answer: you didn't reject it
from the outside, you had it installed, generated its schema, and chose to remove
it. That's a decision with a cost, which is what makes it credible.

**"Is there any rate limiting on login?"**

No. Unlimited attempts, each one paying full bcrypt cost — which is also a
cheap denial-of-service, since every guess burns server CPU by design. There's no
session rotation on privilege change and no password-reset flow either. Say all
three plainly. The fix is per-IP and per-account throttling, at the edge or with a
counter in the database, and lockout with backoff.

Do not describe this app's auth as "hardened" or "production-grade". Describe it
as "correct on the fundamentals — hashing, token storage, ownership checks,
authorisation in every action — with rate limiting and password reset as the next
two pieces." That framing survives scrutiny; the other one invites it.

**"What happens if the user and the server are in different time zones?"**

It breaks, and it's commented as such in the booking action. A
`datetime-local` input gives you a wall-clock string with no offset, and
`new Date(...)` on the server interprets it in the *server's* zone. Same machine,
consistent; different zones, an appointment lands at the wrong instant. The fix is
to capture the client's offset or send an ISO string with a zone, store UTC, and
format per viewer. Volunteer this — a reviewer who finds an undisclosed timezone
bug assumes you didn't know; one you raise yourself reads as judgment.

**"What's `.next-STALE-BACKUP` doing in your project root?"**

It's the stale Turbopack cache from the debugging story, moved aside rather than
deleted, and `.gitignore` only covers `/.next/` so the renamed copy isn't ignored.
It's 542 MB and 917 files. **Delete it before anyone sees the repo** — as it
stands it makes the "I found and cleared the stale cache" story look unfinished,
which is the opposite of the point:

```powershell
cd C:\Users\KELVIN\Desktop\hospital-management
Remove-Item -Recurse -Force .next-STALE-BACKUP
```

**"You have a dependency you don't use."**

`zod` is in `package.json` and imported nowhere. Also dead:
`components/NavBar.tsx` (the header's predecessor) and `data/doctors.ts` (the
hard-coded doctor list, now seeded into the database). Note that
`data/faqs.ts`, `data/features.ts` and `data/services.ts` *are* still imported —
don't over-correct and call the whole folder dead.

Best handled by deleting all three before the interview. If one survives and gets
noticed, the answer is that it's a leftover from a superseded approach, which is
true and is also more authorship evidence — but a clean tree is the better outcome.

**One comment overclaims.** `prisma/schema.prisma` says sorting by `createdAt` is
"the only query we run" on `ContactMessage`. The admin inbox also runs two
`count`s, one filtered on `isRead`. Minor, but you wrote the comment, so you own
it — and an interviewer who catches your own comment being wrong will press
harder on the rest.

**The general principle for this whole section.** Every item here is a thing you
can either disclose or be caught by. Disclosed, each one is evidence you
understand your own code's limits, which is exactly what senior reviewers look
for. Caught, each one suggests you don't know the codebase. The material is
identical; only the timing differs.



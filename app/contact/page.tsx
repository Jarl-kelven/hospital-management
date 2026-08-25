// app/contact/page.tsx
import type { ReactNode } from "react";
import { sendContactMessageAction } from "./actions";

/**
 * Contact page.
 *
 * A Server Component with a plain <form> pointing at a server action, so there
 * is no client-side JavaScript here at all — the form still works if JS hasn't
 * loaded yet.
 *
 * The old version had `rows='3'` on the textarea. React expects a number there,
 * so that string was a type error that would have failed `next build`.
 */
export default async function ContactPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="bg-gray-50">
      <div className="mx-auto w-11/12 max-w-5xl py-14">
        {/* ---------- Heading ---------- */}
        <div className="max-w-2xl">
          <p className="text-xs font-bold tracking-[0.2em] text-primaryColor uppercase">
            Get in touch
          </p>
          <h1 className="mt-3 text-3xl font-bold text-gray-800 sm:text-4xl">
            Talk to the HealthNet team
          </h1>
          <p className="mt-3 text-gray-600">
            Questions about an appointment, feedback on your care, or something
            you can&apos;t find on the site — send it over and a member of the
            team will reply by email.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* ---------- The form ---------- */}
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8 lg:col-span-3">
            {/*
              Feedback banners. The server action puts a message in the URL and
              redirects back here, which is why these read from searchParams.
            */}
            {params?.error && (
              <p
                role="alert"
                className="mb-6 rounded-lg border border-primaryColor/20 bg-primaryLight/15 px-4 py-3 text-sm font-semibold text-primaryColor"
              >
                {params.error}
              </p>
            )}

            {params?.success && (
              <p
                role="status"
                className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800"
              >
                {params.success}
              </p>
            )}

            <form action={sendContactMessageAction} className="space-y-5">
              {/*
                The honeypot. Hidden from real visitors, irresistible to spam
                bots — the server action throws away anything that arrives with
                this filled in.

                `sr-only` rather than `hidden` or display:none, because some
                bots are smart enough to skip fields that are display:none.
                `aria-hidden` and `tabIndex={-1}` keep screen readers and the
                Tab key away from it, and autoComplete="off" stops the browser
                helpfully filling it in for you.
              */}
              <div className="sr-only" aria-hidden="true">
                <label htmlFor="website">Leave this field empty</label>
                <input
                  id="website"
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field
                  label="Your name"
                  name="name"
                  placeholder="Ada Obi"
                  maxLength={100}
                  required
                />
                <Field
                  label="Email address"
                  name="email"
                  type="email"
                  placeholder="ada@example.com"
                  maxLength={200}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/*
                  type="tel", not type="number". A number input strips leading
                  zeros and plus signs, which mangles phone numbers like
                  +234 0801... — and it shows pointless up/down arrows.
                */}
                <Field
                  label="Phone number"
                  name="phone"
                  type="tel"
                  placeholder="+234 801 234 5678"
                  maxLength={40}
                  hint="Optional"
                />
                <Field
                  label="Subject"
                  name="subject"
                  placeholder="Rescheduling my appointment"
                  maxLength={150}
                  required
                />
              </div>

              <div>
                <label htmlFor="message" className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  required
                  minLength={10}
                  maxLength={2000}
                  placeholder="Tell us what you need help with…"
                  className="w-full resize-y rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-primaryColor focus:ring-2 focus:ring-primaryColor/20"
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  Please don&apos;t include medical record numbers or payment details.
                </p>
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-primaryColor px-6 py-3 font-bold text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primaryColor/40 focus-visible:ring-offset-2 focus-visible:outline-none sm:w-auto"
              >
                Send message
              </button>
            </form>
          </section>

          {/* ---------- Side panel ---------- */}
          <aside className="space-y-4 lg:col-span-2">
            <div className="rounded-2xl bg-gray-800 p-6 text-white">
              <h2 className="font-bold">Need help sooner?</h2>
              <p className="mt-2 text-sm text-gray-300">
                For anything urgent, don&apos;t wait on email. Call your nearest
                HealthNet reception, or your local emergency number if it&apos;s
                a medical emergency.
              </p>
            </div>

            <InfoCard title="Reply time">
              We answer most messages within one working day.
            </InfoCard>

            <InfoCard title="Booking an appointment">
              You don&apos;t need this form to book. Pick a doctor under Find a
              Doctor and choose a time from your dashboard.
            </InfoCard>

            <InfoCard title="Your details">
              We only use what you send here to reply to you.
            </InfoCard>
          </aside>
        </div>
      </div>
    </main>
  );
}

/**
 * One labelled text input.
 *
 * `htmlFor` on the label matched to `id` on the input is what makes clicking
 * the label focus the field, and what lets screen readers announce the two
 * together. It's easy to skip and worth never skipping.
 */
function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
  maxLength,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-semibold text-gray-700">
        {label}
        {hint && <span className="ml-2 font-normal text-gray-400">{hint}</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-primaryColor focus:ring-2 focus:ring-primaryColor/20"
      />
    </div>
  );
}

/** A small white card for the notes down the side. */
function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-bold text-gray-800">{title}</h2>
      <p className="mt-1.5 text-sm text-gray-600">{children}</p>
    </div>
  );
}

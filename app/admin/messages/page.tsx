// app/admin/messages/page.tsx
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { deleteMessageAction, setMessageReadAction } from "./actions";

/**
 * The admin inbox: every enquiry sent through the contact form, newest first.
 *
 * Messages are stored as well as emailed, so nothing is lost if the email
 * fails — and `emailSent` tells you when that has happened.
 */
export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;

  // All three queries run at once rather than one after the other.
  //
  // `take: 100` is a deliberate ceiling. Without it this page loads every
  // message ever sent, which is fine on day one and slow after a year.
  const [messages, unreadCount, totalCount] = await Promise.all([
    prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.contactMessage.count({ where: { isRead: false } }),
    prisma.contactMessage.count(),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold text-gray-800">Messages</h2>
        <p className="text-sm text-gray-600">
          {unreadCount === 0
            ? `Nothing unread · ${totalCount} total`
            : `${unreadCount} unread of ${totalCount}`}
        </p>
      </div>

      {params?.error && (
        <p className="mt-4 text-xs font-bold text-primaryColor">{params.error}</p>
      )}
      {params?.success && (
        <p className="mt-4 text-xs font-bold text-green-700">{params.success}</p>
      )}

      {messages.length === 0 ? (
        <p className="mt-6 rounded-xl border border-gray-100 bg-white p-6 text-sm text-gray-600">
          No enquiries yet. Anything sent through the contact form will land here.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {messages.map((message) => (
            <article
              key={message.id}
              /*
                Unread messages get a coloured left edge so they stand out at a
                glance without needing to read anything.
              */
              className={`rounded-xl border bg-white p-5 shadow-sm ${
                message.isRead
                  ? "border-gray-100"
                  : "border-gray-100 border-l-4 border-l-primaryColor"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-800">{message.subject}</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {message.name} ·{" "}
                    {/*
                      A mailto: link so you can reply straight from here.
                      encodeURIComponent goes around BOTH parts: a subject
                      containing & or ? would otherwise break the rest of the
                      link, and so would an odd character in the address.
                    */}
                    <a
                      href={`mailto:${encodeURIComponent(
                        message.email,
                      )}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`}
                      className="font-semibold text-primaryColor hover:underline"
                    >
                      {message.email}
                    </a>
                    {message.phone && ` · ${message.phone}`}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {formatDateTime(message.createdAt)}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {!message.isRead && (
                    <span className="rounded-full bg-primaryColor/10 px-3 py-1 text-xs font-bold text-primaryColor">
                      New
                    </span>
                  )}
                  {!message.emailSent && (
                    <span
                      title="Saved here, but the notification email did not go out. Check RESEND_API_KEY."
                      className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800"
                    >
                      Email not sent
                    </span>
                  )}
                </div>
              </div>

              {/*
                whitespace-pre-wrap keeps the line breaks the visitor typed.
                Without it the whole message collapses into one paragraph.
              */}
              <p className="mt-4 border-t border-gray-100 pt-4 text-sm whitespace-pre-wrap text-gray-800">
                {message.message}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {/* Each button is its own small form, so one page can run several actions. */}
                <form action={setMessageReadAction}>
                  <input type="hidden" name="id" value={message.id} />
                  <input type="hidden" name="isRead" value={message.isRead ? "false" : "true"} />
                  <button
                    type="submit"
                    className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 hover:border-primaryColor hover:text-primaryColor"
                  >
                    {message.isRead ? "Mark unread" : "Mark read"}
                  </button>
                </form>

                <form action={deleteMessageAction}>
                  <input type="hidden" name="id" value={message.id} />
                  <button
                    type="submit"
                    className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 hover:border-red-400 hover:text-red-600"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

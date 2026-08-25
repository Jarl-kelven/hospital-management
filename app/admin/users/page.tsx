// app/admin/users/page.tsx
import { prisma } from "@/lib/prisma";
import { calculateAge, formatDateTime, humanize } from "@/lib/format";

/**
 * Every registered user, with their signup date/time and the personal
 * information they filled in on their own dashboard.
 */
export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    // `include` pulls the related profile row in the same query, so we don't
    // have to loop and query once per user.
    include: { profile: true, _count: { select: { appointments: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-800">
          All users ({users.length})
        </h2>
        <p className="text-xs text-gray-600">
          Profile fields stay empty until the patient fills in their dashboard form.
        </p>
      </div>

      {users.length === 0 ? (
        <p className="rounded-xl border border-gray-100 bg-white p-5 text-sm text-gray-600">
          Nobody has signed up yet.
        </p>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <article
              key={user.id}
              className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              {/* Account details */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-gray-800">{user.name}</h3>
                  <p className="text-xs text-gray-600">{user.email}</p>
                </div>

                <div className="text-right text-xs">
                  {/* Admins get a badge so they're easy to spot in the list. */}
                  <span
                    className={
                      user.role === "ADMIN"
                        ? "rounded-full bg-primaryLight px-2 py-1 font-bold text-primaryColor"
                        : "rounded-full bg-gray-100 px-2 py-1 font-bold text-gray-700"
                    }
                  >
                    {user.role}
                  </span>
                  <p className="mt-2 text-gray-600">
                    Joined {formatDateTime(user.createdAt)}
                  </p>
                  <p className="text-gray-600">
                    {user._count.appointments} appointment(s)
                  </p>
                </div>
              </div>

              {/* Profile details */}
              <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 text-xs sm:grid-cols-4">
                <Detail
                  label="Age"
                  value={
                    user.profile?.dateOfBirth
                      ? `${calculateAge(user.profile.dateOfBirth)} years`
                      : null
                  }
                />
                <Detail
                  label="Gender"
                  value={user.profile?.gender ? humanize(user.profile.gender) : null}
                />
                <Detail label="Phone" value={user.profile?.phone} />
                <Detail label="Blood group" value={user.profile?.bloodGroup} />
                <Detail label="Address" value={user.profile?.address} />
                <Detail label="Allergies" value={user.profile?.allergies} />
                <Detail
                  label="Emergency contact"
                  value={
                    user.profile?.emergencyName
                      ? `${user.profile.emergencyName} — ${user.profile.emergencyPhone ?? "no number"}`
                      : null
                  }
                />
                <Detail label="Notes" value={user.profile?.notes} />
              </dl>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * One label + value pair. Shows a dash when the patient hasn't filled
 * that field in, which is clearer than an empty space.
 */
function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="font-bold text-gray-500">{label}</dt>
      <dd className="mt-1 text-gray-800">{value || "—"}</dd>
    </div>
  );
}

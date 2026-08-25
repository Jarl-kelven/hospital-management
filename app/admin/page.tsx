// app/admin/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";

/**
 * Admin overview — the numbers at a glance.
 *
 * This is a Server Component, so we can talk to the database directly here.
 * No API route and no useEffect needed.
 */
export default async function AdminOverviewPage() {
  // Promise.all runs these queries at the same time instead of one after
  // another, which makes the page load faster.
  const [
    totalUsers,
    totalDoctors,
    pendingCount,
    confirmedCount,
    unreadMessages,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }),
    prisma.doctor.count(),
    prisma.appointment.count({ where: { status: "PENDING" } }),
    prisma.appointment.count({ where: { status: "CONFIRMED" } }),
    prisma.contactMessage.count({ where: { isRead: false } }),
    prisma.user.findMany({
      where: { role: "USER" },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const stats = [
    { label: "Registered patients", value: totalUsers, href: "/admin/users" },
    { label: "Doctors", value: totalDoctors, href: "/admin/doctors" },
    { label: "Pending appointments", value: pendingCount, href: "/admin/appointments" },
    { label: "Confirmed appointments", value: confirmedCount, href: "/admin/appointments" },
    { label: "Unread messages", value: unreadMessages, href: "/admin/messages" },
  ];

  return (
    <div className="space-y-8">
      {/* Stat cards — five of them, so the grid goes 1 / 2 / 5 across. */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:border-primaryLight"
          >
            <p className="text-3xl font-bold text-primaryColor">{stat.value}</p>
            <p className="mt-1 text-xs font-semibold text-gray-700">{stat.label}</p>
          </Link>
        ))}
      </section>

      {/* Newest signups */}
      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-800">Newest signups</h2>
          <Link href="/admin/users" className="text-xs font-bold text-primaryColor">
            View all
          </Link>
        </div>

        {recentUsers.length === 0 ? (
          <p className="mt-4 text-sm text-gray-600">No patients have signed up yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-gray-100">
            {recentUsers.map((user) => (
              <li key={user.id} className="flex justify-between gap-4 py-3 text-sm">
                <span className="font-semibold text-gray-800">{user.name}</span>
                <span className="text-gray-600">{formatDateTime(user.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// app/dashboard/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { calculateAge, formatDate, formatDateOfBirth, formatDateTime, humanize } from "@/lib/format";

/**
 * The patient's home screen: their saved details plus their next appointment.
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const user = await requireUser();

  const [profile, nextAppointment] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId: user.id } }),
    // The soonest appointment that hasn't happened yet and isn't cancelled.
    prisma.appointment.findFirst({
      where: {
        patientId: user.id,
        scheduledAt: { gte: new Date() },
        status: { not: "CANCELLED" },
      },
      include: { doctor: true },
      orderBy: { scheduledAt: "asc" },
    }),
  ]);

  // An empty profile row still counts as "not filled in" for our purposes.
  const hasDetails = Boolean(profile?.dateOfBirth || profile?.phone || profile?.bloodGroup);

  return (
    <div className="space-y-6">
      {params?.success && (
        <p className="text-xs font-bold text-green-700">{params.success}</p>
      )}
      {params?.error && (
        <p className="text-xs font-bold text-primaryColor">{params.error}</p>
      )}

      {/* Nudge the user to fill in the form the first time they land here. */}
      {!hasDetails && (
        <section className="rounded-xl border border-primaryLight bg-primaryLight/20 p-5">
          <h2 className="font-bold text-gray-800">Finish setting up your profile</h2>
          <p className="mt-1 text-sm text-gray-700">
            Add your date of birth, contact details and any medical information
            so your doctor knows who they're seeing.
          </p>
          <Link href="/dashboard/profile" className="btn mt-3 inline-block">
            Fill in my details
          </Link>
        </section>
      )}

      {/* Next appointment */}
      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-800">Next appointment</h2>
          <Link
            href="/dashboard/appointments"
            className="text-xs font-bold text-primaryColor"
          >
            All appointments
          </Link>
        </div>

        {nextAppointment ? (
          <div className="mt-3">
            <p className="text-sm font-semibold text-gray-800">
              {nextAppointment.doctor.name} · {nextAppointment.doctor.specialization}
            </p>
            <p className="mt-1 text-sm text-gray-700">
              {formatDateTime(nextAppointment.scheduledAt)}
            </p>
            <p className="mt-2 text-xs font-bold text-gray-500">
              Status: {nextAppointment.status}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-gray-600">
            You have no upcoming appointments.{" "}
            <Link href="/dashboard/appointments" className="font-bold text-primaryColor">
              Book one
            </Link>
            .
          </p>
        )}
      </section>

      {/* Saved details */}
      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-800">My details</h2>
          <Link href="/dashboard/profile" className="text-xs font-bold text-primaryColor">
            Edit
          </Link>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <Detail label="Full name" value={user.name} />
          <Detail label="Email" value={user.email} />
          <Detail
            label="Age"
            value={
              profile?.dateOfBirth ? `${calculateAge(profile.dateOfBirth)} years` : null
            }
          />
          <Detail
            label="Date of birth"
            value={profile?.dateOfBirth ? formatDateOfBirth(profile.dateOfBirth) : null}
          />
          <Detail
            label="Gender"
            value={profile?.gender ? humanize(profile.gender) : null}
          />
          <Detail label="Phone" value={profile?.phone} />
          <Detail label="Address" value={profile?.address} />
          <Detail label="Blood group" value={profile?.bloodGroup} />
          <Detail label="Allergies" value={profile?.allergies} />
          <Detail
            label="Emergency contact"
            value={
              profile?.emergencyName
                ? `${profile.emergencyName} — ${profile.emergencyPhone ?? "no number"}`
                : null
            }
          />
          <Detail label="Member since" value={formatDate(user.createdAt)} />
        </dl>

        {profile?.notes && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="text-xs font-bold text-gray-500">Notes for my doctor</p>
            <p className="mt-1 text-sm text-gray-800">{profile.notes}</p>
          </div>
        )}
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-bold text-gray-500">{label}</dt>
      <dd className="mt-1 text-gray-800">{value || "—"}</dd>
    </div>
  );
}

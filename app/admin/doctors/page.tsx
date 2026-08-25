// app/admin/doctors/page.tsx
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { createDoctorAction, deleteDoctorAction } from "./actions";

/**
 * Doctor management: the form on this page writes straight to the database,
 * which is what replaces the old hard-coded data/doctors.ts list.
 */
export default async function AdminDoctorsPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;

  const doctors = await prisma.doctor.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* ---------- Add doctor form ---------- */}
      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-gray-800">Add a doctor</h2>

        {params?.error && (
          <p className="mt-3 text-xs font-bold text-primaryColor">{params.error}</p>
        )}
        {params?.success && (
          <p className="mt-3 text-xs font-bold text-green-700">{params.success}</p>
        )}

        {/*
          No encType is needed here. When a form's `action` is a server action,
          React handles the encoding itself and picks multipart automatically
          for file inputs — setting encType by hand just logs a warning.
        */}
        <form action={createDoctorAction} className="mt-5 space-y-4">
          <Field label="Full name" name="name" placeholder="Dr. John Simmons" required />
          <Field
            label="Specialization"
            name="specialization"
            placeholder="Surgeon"
            required
          />
          <Field
            label="Hospital"
            name="hospital"
            placeholder="Silicon Hospital, Opic."
            required
          />

          <div>
            <label className="mb-2 block text-xs font-bold text-gray-800" htmlFor="photo">
              Photo (PNG, JPEG or WebP — max 2MB)
            </label>
            <input
              id="photo"
              name="photo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              required
              className="w-full rounded-md border border-gray-300 p-2 text-xs text-gray-800"
            />
          </div>

          {/* These three are optional — they default to 0 in the database. */}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Rating" name="avgRating" type="number" step="0.1" placeholder="4.8" />
            <Field label="Reviews" name="totalRating" type="number" placeholder="272" />
            <Field label="Patients" name="totalPatients" type="number" placeholder="1100" />
          </div>

          <button type="submit" className="btn w-full">
            Save doctor
          </button>
        </form>
      </section>

      {/* ---------- Existing doctors ---------- */}
      <section className="space-y-4">
        <h2 className="font-bold text-gray-800">
          Doctors in the database ({doctors.length})
        </h2>

        {doctors.length === 0 ? (
          <p className="rounded-xl border border-gray-100 bg-white p-5 text-sm text-gray-600">
            No doctors yet. Add one with the form, or run{" "}
            <code className="rounded bg-gray-100 px-1">npm run db:seed</code> to load
            the original three.
          </p>
        ) : (
          doctors.map((doctor) => (
            <article
              key={doctor.id}
              className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <Image
                src={doctor.photoUrl}
                alt={doctor.name}
                width={64}
                height={64}
                className="h-16 w-16 rounded-md object-cover"
              />

              <div className="min-w-0 flex-1">
                <h3 className="truncate font-bold text-gray-800">{doctor.name}</h3>
                <p className="text-xs text-primaryColor">{doctor.specialization}</p>
                <p className="truncate text-xs text-gray-600">{doctor.hospital}</p>
                <p className="text-xs text-gray-600">
                  {doctor.avgRating} ★ ({doctor.totalRating}) · {doctor.totalPatients}{" "}
                  patients
                </p>
              </div>

              {/*
                A hidden input is how we pass the doctor's id to a server
                action from a plain form, with no client-side JavaScript.
              */}
              <form action={deleteDoctorAction}>
                <input type="hidden" name="id" value={doctor.id} />
                <button
                  type="submit"
                  className="text-xs font-bold text-primaryColor hover:underline"
                >
                  Remove
                </button>
              </form>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

/** A labelled text input, so the form above stays readable. */
function Field({
  label,
  name,
  type = "text",
  placeholder,
  required = false,
  step,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  step?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold text-gray-800" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        placeholder={placeholder}
        required={required}
        className="input-field"
      />
    </div>
  );
}

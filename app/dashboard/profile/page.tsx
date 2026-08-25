// app/dashboard/profile/page.tsx
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { toDateInputValue } from "@/lib/format";
import { saveProfileAction } from "./actions";

/**
 * The patient's profile form.
 *
 * Each input uses `defaultValue` so the form comes back pre-filled with
 * whatever is already saved. We use defaultValue (not value) because these
 * are plain HTML inputs — the browser tracks what's typed, not React.
 */
export default async function ProfileFormPage() {
  const user = await requireUser();

  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-lg font-bold text-gray-800">Your information</h2>
      <p className="mt-1 text-xs text-gray-600">
        This helps your doctor prepare for your appointment. You can leave
        anything blank and come back to it later.
      </p>

      <form action={saveProfileAction} className="mt-6 space-y-6">
        {/* ---------- Basics ---------- */}
        <fieldset className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <legend className="px-2 text-xs font-bold text-gray-800">Basics</legend>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="dateOfBirth">Date of birth</Label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                defaultValue={toDateInputValue(profile?.dateOfBirth)}
                className="input-field"
              />
              <p className="mt-1 text-[0.7rem] text-gray-500">
                We work out your age from this so it never goes out of date.
              </p>
            </div>

            <div>
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                name="gender"
                defaultValue={profile?.gender ?? ""}
                className="input-field"
              >
                <option value="">Prefer not to answer</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
              </select>
            </div>

            <TextField
              label="Phone number"
              name="phone"
              defaultValue={profile?.phone}
              placeholder="080..."
            />
            <TextField
              label="Address"
              name="address"
              defaultValue={profile?.address}
              placeholder="Street, city"
            />
          </div>
        </fieldset>

        {/* ---------- Emergency contact ---------- */}
        <fieldset className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <legend className="px-2 text-xs font-bold text-gray-800">
            Emergency contact
          </legend>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              label="Their name"
              name="emergencyName"
              defaultValue={profile?.emergencyName}
              placeholder="Jane Doe"
            />
            <TextField
              label="Their phone number"
              name="emergencyPhone"
              defaultValue={profile?.emergencyPhone}
              placeholder="080..."
            />
          </div>
        </fieldset>

        {/* ---------- Medical ---------- */}
        <fieldset className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <legend className="px-2 text-xs font-bold text-gray-800">Medical details</legend>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="bloodGroup">Blood group</Label>
              <select
                id="bloodGroup"
                name="bloodGroup"
                defaultValue={profile?.bloodGroup ?? ""}
                className="input-field"
              >
                <option value="">Not sure</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>

            <TextField
              label="Allergies"
              name="allergies"
              defaultValue={profile?.allergies}
              placeholder="Penicillin, peanuts..."
            />
          </div>

          <div className="mt-4">
            <Label htmlFor="notes">Anything else your doctor should know</Label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              defaultValue={profile?.notes ?? ""}
              placeholder="Ongoing conditions, current medication, past surgeries..."
              className="input-field"
            />
          </div>
        </fieldset>

        <button type="submit" className="btn w-full">
          Save my information
        </button>
      </form>
    </div>
  );
}

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-xs font-bold text-gray-800" htmlFor={htmlFor}>
      {children}
    </label>
  );
}

/** A labelled text input that pre-fills with the saved value. */
function TextField({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <input
        id={name}
        name={name}
        type="text"
        // ?? "" because React warns if defaultValue is null.
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="input-field"
      />
    </div>
  );
}

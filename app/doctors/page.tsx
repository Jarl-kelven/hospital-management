// app/doctors/page.tsx
import DoctorList from "../../components/Doctors/DoctorList";

/**
 * Doctors Page
 * - Server Component by default (good for SEO and performance)
 * - DoctorList reads every doctor from the database
 */
export default function DoctorsPage() {
  return (
    <div>
      <section className="container mt-20">
        <article className="container text-center">
          <h1 className="heading-1">Our Great Doctors</h1>
          <p className="mt-2 sm:text-base text-sm">
            World class care for everyone. Our health system offers unmatched, expert health care
          </p>
        </article>
      </section>

      <DoctorList />
    </div>
  );
}
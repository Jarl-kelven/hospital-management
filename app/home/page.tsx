import Image from "next/image";
import Link from "next/link";

// These paths assume you'll place components in: src/components/...
import About from "@/components/About/About";
import ServiceList from "@/components/Services/ServiceList";
import DoctorList from "@/components/Doctors/DoctorList";
import FaqList from "@/components/Faq/FaqList";
import Testimonial from "@/components/Testimonial/Testimonial";
import FeatureList from "@/components/Features/FeatureList";


export default function HomePage() {
  return (
    <main>
      {/* HERO SECTION */}
      <section className="container sm:w-[70%] xl:w-[90%] text-center flex flex-col lg:flex-row items-center justify-between gap-8">
        <article className="flex flex-col basis-3/6">
          <h1 className="text-3xl md:text-start sm:text-5xl font-bold text-gray-800">
            Elevating Wellness Together: Your Supportive Hospital Companion.
          </h1>

          <p className="text-sm md:text-start md:text-base text-gray-800 mt-4">
            Introducing HealthNet, where health and harmony unite. Join us, and discover a new era
            of healthcare efficiency and patient-centric care with our advanced platform
          </p>

          <div className="text-center md:text-start">
            {/* In Next.js, navigation should use <Link href="..."> */}
            <Link href="/doctors">
              <button className="btn md:text-base text-xs p-3" type="button">
                Book an appointment
              </button>
            </Link>
          </div>
        </article>

        {/* Right hero image */}
        <article className="flex hidden md:block gap-2 justify-center items-center flex-row basis-[40%]">
          <div className="basis-2/6">
            <Image
              className="rounded-lg"
              src="/images/hero-doc.png"
              alt="Doctor hero image"
              width={420}
              height={520}
              priority
            />
          </div>
        </article>
      </section>

      {/* Intro section */}
      <section className="mx-auto w-11/12 my-10">
        <article>
          <h1 className="text-3xl font-bold md:text-5xl lg:px-36 mt-32 text-center text-gray-800">
            We Provide the best medical services
          </h1>
          <p className="text-sm mt-4 text-center lg:px-60 text-gray-800 md:text-lg md:mt-6">
            world class for everyone. Our health system offers unmatched, expert health care. From
            the lab to the clinic.
          </p>
        </article>
      </section>

      <section className="container">
        <FeatureList />
      </section>

      {/*
        `id="about"` is what makes the footer's "About us" link work: a link to
        /home#about tells the browser to scroll to the element with this id.

        `scroll-mt-20` is the part people forget. The header is sticky, so
        without it the browser scrolls the section to the very top of the window
        and the header sits over the first few lines. This adds 5rem of breathing
        room above the scroll target — margin that only applies to scrolling.
      */}
      <div id="about" className="scroll-mt-20">
        <About />
      </div>

      {/* SERVICES SECTION */}
      <section>
        <article className="container text-center mt-10">
          <h1 className="heading-1">Our Medical Services</h1>
          <p className="mt-2 sm:text-base text-sm">
            World class care for everyone. Our health system offers unmatched, expert health care
          </p>
        </article>
      </section>

      <ServiceList />

      {/* VIRTUAL TREATMENTS */}
      <section className="container sm:items-center lg:flex lg:justify-center lg:items-center justify-between gap-2">
        <article className="lg:order-2 basis-[50%] sm:text-center lg:text-start">
          <h1 className="heading-1 mt-24 mb-3 lg:flex lg:order-1 lg:mt-3">
            Get virtual treatments anytime.
          </h1>

          <ol className="text-gray-800">
            <li className="list">1. Schedule appointment directly</li>
            <li className="list">2. Search for your physician here and contact their office</li>
            <li className="list">
              3. View our physicians who are accepting new patients, use the online scheduling tool
              to select an appointment time
            </li>
          </ol>

          {/* Your old code had <Link> with no "to". In Next we must provide href. */}
          <Link href="/services" className=" w-full flex lg:justify-start justify-center">
            <button className="btn" type="button">
              Learn More
            </button>
          </Link>
        </article>

        <div className="w-full flex justify-center lg:order-1 basis-[50%]">
          <Image
            className="rounded-lg hidden sm:block lg:w-[85%]"
            src="/images/virtual.png"
            alt="Virtual treatment illustration"
            width={420}
            height={320}
          />
        </div>
      </section>

      {/* DOCTORS SECTION (we will later make this database-driven) */}
      <section className="container mt-20">
        <article className="container text-center">
          <h1 className="heading-1">Our Great Doctors</h1>
          <p className="mt-2 sm:text-base text-sm">
            World class care for everyone. Our health system offers unmatched, expert health care
          </p>
        </article>
      </section>

      <DoctorList limit={3} />

      {/* FAQ SECTION — the footer's "FAQ" link points at /home#faq */}
      <section id="faq" className="container scroll-mt-20 text-center">
        <article className="xl:flex xl:items-center xl:justify-between">
          <div className="sm:w-[40%] mx-auto xl:basis-[40%]">
            <Image
              className="w-full rounded-lg"
              src="/images/doc-faq.png"
              alt="Doctor FAQ"
              width={520}
              height={520}
            />
          </div>

          <div className="xl:basis-[50%]">
            <h2 className="heading-1 my-7 xl:text-2xl xl:my-2">
              Most questions by our beloved patients
            </h2>

            <FaqList />
          </div>
        </article>
      </section>

      {/* TESTIMONIALS */}
      <section>
        <article className="container text-center mt-12">
          <h1 className="heading-1 mt-36">Response From Our Patients</h1>
          <p className="mt-2 sm:text-base text-sm">
            World class care for everyone. Our health system offers unmatched, expert health care
          </p>
        </article>
      </section>

      <section>
        <Testimonial />
      </section>
    </main>
  );
}
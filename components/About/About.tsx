import Image from "next/image";
import Link from "next/link";

/**
 * About section
 * - Server Component (no hooks)
 * - Uses next/image + next/link
 * - No nested <main> tag (your page already has <main>)
 */
export default function About() {
  return (
    <section className="container flex flex-col items-center justify-center gap-1 mt-40 xl:flex-row">
      <article className="xl:basis-[50%]">
        <Image
          className="rounded-md xl:w-[80%]"
          src="/images/doc-about.png"
          alt="About our hospital"
          width={900}
          height={700}
          sizes="(max-width: 1280px) 90vw, 40vw"
        />
      </article>

      <article className="text-center flex flex-col justify-center items-center xl:basis-[45%] xl:items-start xl:justify-start xl:text-start lg:px-4">
        <h1 className="text-gray-800 font-bold text-4xl mt-6 lg:text-[2.5rem] xl:mt-0">
          Proud to be one of the nations best
        </h1>

        <p className="mt-5 text-gray-800 text-sm">
          For over a decade, HealthNet has combined compassionate care with modern medicine. Our team of board-certified physicians and specialists work across more than a dozen departments, from emergency care to long-term treatment plans, all guided by one principle: every patient deserves care that&apos;s fast, thorough, and personal.
          <br />
          <br />
          We&apos;ve invested in the tools that make healthcare easier to access — online scheduling, virtual consultations, and digital records you can reach anytime. Whether you&apos;re coming in for a routine checkup or managing a complex condition, our staff is here to make the process as smooth as possible.
        </p>

        
        <Link href="/services">
          <button className="btn" type="button">
            Learn More
          </button>
        </Link>
      </article>
    </section>
  );
}
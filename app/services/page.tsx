import ServiceList from "@/components/Services/ServiceList";

export default function Services() {
  return (
    <main>
      <section>
        <article className="container text-center mt-10">
          <h1 className="heading-1">Our Medical Services</h1>
          <p className="mt-2 sm:text-base text-sm">
            World class care for everyone. Our health system offers unmatched,
            expert health care
          </p>
        </article>
      </section>

      <ServiceList />
    </main>
  );
}

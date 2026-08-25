// data/features.ts

/**
 * FeatureItem
 * - `image` is a public URL path (served from /public)
 * - This avoids bundler-specific "absolute import" issues.
 */
export type FeatureItem = {
  id: string;
  image: string; // e.g. "/images/building.png"
  head: string;
  para: string;
};

export const features: FeatureItem[] = [
  {
    id: "01",
    image: "/images/person.png",
    head: "Find a Doctor",
    para: "Explore a diverse roster of experienced doctors who specialize in various fields. Find the perfect match to address your health concerns with confidence and satisfaction.",
  },
  {
    id: "02",
    image: "/images/building.png",
    head: "Find a Location",
    para: "Convenient care near you. Locate our hospital branches and clinics effortlessly. Our strategically placed facilities ensure easy access to quality healthcare wherever you are and whenever you want.",
  },
  {
    id: "03",
    image: "/images/timetable.png",
    head: "Book Appointment",
    para: "Seamlessly schedule your visit. Say goodbye to waiting. Book appointments at your convenience, ensuring your time is valued as much as your health. Your journey to better health begins with a few taps.",
  },
];
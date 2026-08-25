// components/Features/FeatureList.tsx
import Features from "./Features";
import { features } from "../../data/features";

/**
 * FeatureList
 * - Server Component by default (no hooks here)
 * - Renders the list of features from your data file
 */
export default function FeatureList() {
  return (
    <section className="grid grid-cols-1 gap-3 items-start justify-center xl:grid-cols-3">
      {features.map((feature) => (
        <Features key={feature.id} feature={feature} />
      ))}
    </section>
  );
}
import Image from "next/image";
import type { FeatureItem } from "../../data/features";

type FeaturesProps = {
  feature: FeatureItem;
};



export default function Features({ feature }: FeaturesProps) {
  const { image, head, para } = feature;

  return (
    <section className="feature-container px-2 md:px-32 xl:px-3">
      <Image
        className="w-2/6 md:w-1/4"
        src={image}
        alt={head}
        width={220}
        height={220}
        sizes="(max-width: 768px) 33vw, 25vw"
      />

      <h2 className="mt-6 text-2xl font-bold sm:text-3xl text-gray-800">{head}</h2>

      <p className="text-gray-800 text-xs sm:text-sm mt-3">{para}</p>

      
    </section>
  );
}
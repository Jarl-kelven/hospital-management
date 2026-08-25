import Image from "next/image";
import type { FeatureItem } from "../../data/features";

type FeaturesProps = {
  feature: FeatureItem;
};

/**
 * Inline share icon (no extra libs).
 * Keeps your styling: `.share-icon`
 */
function ShareIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7a2.5 2.5 0 0 0 0-1.39l7.02-4.11A2.99 2.99 0 1 0 14 5a3 3 0 0 0 .05.52L7.03 9.63a3 3 0 1 0 0 4.74l7.02 4.11A3 3 0 1 0 18 16.08Z" />
    </svg>
  );
}

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

      <span className="share-icon">
        <ShareIcon />
      </span>
    </section>
  );
}
// components/Services/ServiceCard.tsx
import type { ServiceItem } from "../../data/services";

type ServiceCardProps = {
  item: ServiceItem;
  index: number;
};

/**
 * Inline share icon (no react-icons dependency).
 * Keeps the exact same styling you had.
 */
function ShareIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7a2.5 2.5 0 0 0 0-1.39l7.02-4.11A2.99 2.99 0 1 0 14 5a3 3 0 0 0 .05.52L7.03 9.63a3 3 0 1 0 0 4.74l7.02 4.11A3 3 0 1 0 18 16.08Z" />
    </svg>
  );
}

export default function ServiceCard({ item, index }: ServiceCardProps) {
  const { name, desc } = item;

  return (
    <section className="text-center gap-1 mt-10 px-14 sm:px-40 md:px-52 lg:px-14">
      <h2 className="text-xl font-bold text-gray-800">{name}</h2>
      <p className="text-xs mt-1">{desc}</p>

      {/* 
        Original code had a <Link> with no destination.
        I replaced it with a span to avoid an invalid href.
        If you later add a detail page, wrap this span with <Link href={`/services/${name}`}>.
      */}
      <span className="mt-4 w-[44px] h-[44px] mx-auto flex items-center justify-center">
        <span className="share-icon text-center">
          <ShareIcon />
        </span>
      </span>
    </section>
  );
}
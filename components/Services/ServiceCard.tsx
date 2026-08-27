// components/Services/ServiceCard.tsx
import type { ServiceItem } from "../../data/services";
import {
  Ribbon,
  Baby,
  Heart,
  HeartPulse,
  Brain,
  Activity,
  Shield,
  Flame,
  Stethoscope,
} from "lucide-react";

type ServiceCardProps = {
  item: ServiceItem;
  index: number;
};

type IconProps = {
  size?: number;
  className?: string;
};

function LaborDeliveryIcon({ size = 18, className }: IconProps) {
  return (
    <span className={`relative inline-block align-middle ${className ?? ""}`} style={{ width: size, height: size }}>
      <Baby aria-hidden="true" size={size} />
      <Heart
        aria-hidden="true"
        size={Math.round(size * 0.55)}
        className="absolute -right-1 -bottom-1"
        fill="currentColor"
      />
    </span>
  );
}

function NeurologyIcon({ size = 18, className }: IconProps) {
  return (
    <span className={`relative inline-block align-middle ${className ?? ""}`} style={{ width: size, height: size }}>
      <Brain aria-hidden="true" size={size} />
      <Activity aria-hidden="true" size={Math.round(size * 0.75)} className="absolute inset-0 m-auto" />
    </span>
  );
}

function BurnTreatmentIcon({ size = 18, className }: IconProps) {
  return (
    <span className={`relative inline-block align-middle ${className ?? ""}`} style={{ width: size, height: size }}>
      <Shield aria-hidden="true" size={size} />
      <Flame aria-hidden="true" size={Math.round(size * 0.7)} className="absolute inset-0 m-auto" />
    </span>
  );
}

const ICONS_BY_SERVICE: Record<string, React.ComponentType<IconProps>> = {
  "Cancer Care": (p) => <Ribbon aria-hidden="true" size={p.size ?? 18} className={p.className} />,
  "Labor & Delivery": LaborDeliveryIcon,
  "Heart & Vascular": (p) => <HeartPulse aria-hidden="true" size={p.size ?? 18} className={p.className} />,
  "Mental Health": (p) => <Brain aria-hidden="true" size={p.size ?? 18} className={p.className} />,
  Neurology: NeurologyIcon,
  "Burn Treatment": BurnTreatmentIcon,
};

export default function ServiceCard({ item, index: _index }: ServiceCardProps) {
  const { name, desc } = item;
  const Icon = ICONS_BY_SERVICE[name] ?? ((p: IconProps) => (
    <Stethoscope aria-hidden="true" size={p.size ?? 18} className={p.className} />
  ));

  return (
    <section className="text-center gap-1 mt-10 px-14 sm:px-40 md:px-52 lg:px-14">

      <span className="mt-4 w-[44px] h-[44px] mx-auto flex items-center justify-center">
        <span className="text-center">
          <Icon size={18} />
        </span>
      </span>
      <h2 className="text-xl font-bold text-gray-800">{name}</h2>
      <p className="text-xs mt-1">{desc}</p>

    </section>
  );
}
// components/Services/ServiceList.tsx
import ServiceCard from "./ServiceCard";
import { services } from "../../data/services";

/**
 * ServiceList
 * - Server Component (no hooks)
 * - Grid layout of service cards
 */
export default function ServiceList() {
  return (
    <div className="grid grid-cols-1 mb-10 lg:grid-cols-3">
      {services.map((item, index) => (
        <ServiceCard key={item.name} item={item} index={index} />
      ))}
    </div>
  );
}
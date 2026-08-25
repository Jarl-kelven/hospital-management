import FaqItem from "./FaqItem";
import { faqs } from "../../data/faqs";

/**
 * FaqList
 * - Server Component by default
 * - Renders multiple client FaqItem components
 */
export default function FaqList() {
  return (
    <ul>
      {faqs.map((item) => (
        <FaqItem key={item.id} item={item} />
      ))}
    </ul>
  );
}
"use client";

import { useState } from "react";
import type { Faq } from "../../data/faqs";

type FaqItemProps = {
  item: Faq;
};

/**
 * FaqItem
 * - Client Component because it uses useState.
 * - Acts like a small accordion item.
 * - Uses a <button> for accessibility (keyboard + screen readers).
 */
export default function FaqItem({ item }: FaqItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen((prev) => !prev);

  return (
    <li className="border lg:w-[60%] mx-auto border-gray-800 rounded-md my-2 py-2 px-4">
      <button
        type="button"
        onClick={toggleMenu}
        aria-expanded={isOpen}
        className="w-full"
      >
        <div className="flex justify-between items-center py-1 my-2">
          <h4 className="text-gray-800 font-bold text-sm sm:text-xl xl:text-sm cursor-pointer text-left">
            {item.question}
          </h4>

          {/* Icon container (fixed className logic) */}
          <div className={`cursor-pointer ${isOpen ? "text-gray-800 sm:text-lg border-none" : ""}`}>
            {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </div>
        </div>
      </button>

      {isOpen && (
        <div>
          <p className="text-start text-xs sm:text-base xl:text-xs">{item.content}</p>
        </div>
      )}
    </li>
  );
}

/** Inline icons (no react-icons dependency) */
function ChevronDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M7.41 8.58 12 13.17l4.59-4.59L18 10l-6 6-6-6z" />
    </svg>
  );
}

function ChevronUpIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
    </svg>
  );
}
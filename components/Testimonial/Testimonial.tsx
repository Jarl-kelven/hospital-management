"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";

/**
 * Testimonial is a Client Component because Swiper depends on the browser.
 * NOTE:
 * - Swiper CSS is imported globally in app/globals.css (not here).
 */

type TestimonialItem = {
  id: string;
  name: string;
  message: string;
  rating: number; // 1..5
  avatar: string; // public path e.g. "/images/hero-img02.png"
};

const testimonials: TestimonialItem[] = [
  {
    id: "t1",
    name: "Joshua Eze",
    message:
      "Their medical services are top notch. They are the best amongst the rest. They are dependable",
    rating: 5,
    avatar: "/images/hero-img02.png",
  },
  {
    id: "t2",
    name: "Joshua Eze",
    message:
      "Their medical services are top notch. They are the best amongst the rest. They are dependable",
    rating: 5,
    avatar: "/images/hero-img02.png",
  },
  {
    id: "t3",
    name: "Joshua Eze",
    message:
      "Their medical services are top notch. They are the best amongst the rest. They are dependable",
    rating: 5,
    avatar: "/images/hero-img02.png",
  },
];

export default function Testimonial() {
  return (
    <Swiper
      modules={[Pagination]}
      spaceBetween={30}
      slidesPerView={1}
      pagination={{ clickable: true }}
      breakpoints={{
        640: { slidesPerView: 1, spaceBetween: 0 },
        768: { slidesPerView: 2, spaceBetween: 20 },
        1024: { slidesPerView: 3, spaceBetween: 30 },
      }}
    >
      {testimonials.map((t) => (
        <SwiperSlide key={t.id}>
          <section className="container cursor-grab lg:cursor-default">
            <article className="flex gap-3 items-center">
              <Image
                src={t.avatar}
                alt={`${t.name} avatar`}
                width={45}
                height={45}
                className="w-[45px] rounded-full"
              />

              <div>
                <h2 className="text-gray-800 font-semibold">{t.name}</h2>

                <div className="flex">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <StarIcon key={i} className="text-yellow-400" />
                  ))}
                </div>
              </div>
            </article>

            <p className="text-sm mt-1">{t.message}</p>
          </section>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}

/** Inline star icon (replaces react-icons/hi) */
function StarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="18"
      height="18"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.12 3.44c.13.4.5.67.92.67h3.62c.97 0 1.37 1.24.58 1.81l-2.93 2.13c-.33.24-.47.67-.35 1.06l1.12 3.44c.3.92-.76 1.69-1.55 1.12l-2.93-2.13a1.02 1.02 0 0 0-1.2 0l-2.93 2.13c-.79.57-1.85-.2-1.55-1.12l1.12-3.44c.13-.4-.02-.82-.35-1.06L2.93 8.85c-.79-.57-.39-1.81.58-1.81h3.62c.42 0 .79-.27.92-.67l1.4-3.44Z" />
    </svg>
  );
}
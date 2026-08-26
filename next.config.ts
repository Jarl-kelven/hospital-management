import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /**
     * next/image refuses to load an external URL unless its hostname is listed
     * here — it optimises images on the server, so an unchecked hostname would
     * let anyone point our optimiser at any file on the internet.
     *
     * Doctor photos now live on Vercel Blob, which serves them from
     * <store-id>.public.blob.vercel-storage.com. The store id differs per
     * project, hence the wildcard on the subdomain.
     *
     * Seeded doctors still use "/images/doc1.png" — local paths need no entry.
     */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/doctors/**",
      },
    ],
  },
};

export default nextConfig;

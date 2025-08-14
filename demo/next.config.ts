import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow resolving linked/local packages outside the demo directory
  experimental: {
    externalDir: true,
  },
  // Ensure the linked package is transpiled by Next/Turbopack
  transpilePackages: ["@poserjs/react-table-csv"],
};

export default nextConfig;

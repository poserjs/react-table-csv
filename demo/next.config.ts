import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Allow importing component source from ../src
    externalDir: true,
  },
};

export default nextConfig;

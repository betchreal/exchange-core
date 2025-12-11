import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    middlewarePrefetch: "flexible",
  },
};

export default nextConfig;

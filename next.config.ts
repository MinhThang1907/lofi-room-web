import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {},
  },
  images: {
    domains: ['placeholder.svg'],
  },
};

export default nextConfig;

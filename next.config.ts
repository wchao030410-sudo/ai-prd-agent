import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverComponents: false, // Disable React Server Components for better compatibility
  },
  server: '0.0.0.0'
};

export default nextConfig;

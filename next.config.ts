import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow ngrok URL for development
  allowedDevOrigins: ["drove-carload-unlighted.ngrok-free.dev", "localhost"],
  serverExternalPackages: [],
  experimental: {
    serverActions: {
      allowedOrigins: ["drove-carload-unlighted.ngrok-free.dev", "localhost:3000"],
    },
  },
};

export default nextConfig;

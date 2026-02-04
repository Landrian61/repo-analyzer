import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization for GitHub avatars
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "github.com",
      },
    ],
  },
  // Ensure proper handling of client-side modules
  transpilePackages: ["recharts", "react-syntax-highlighter"],
  // Set turbopack root to this project directory
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;

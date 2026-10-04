import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Place images can come from any https host (user/admin supplied URLs).
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] }
};

export default nextConfig;

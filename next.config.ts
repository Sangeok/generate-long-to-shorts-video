import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@better-auth/prisma-adapter"],
};

export default nextConfig;

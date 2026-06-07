import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@better-auth/prisma-adapter",
    "@better-auth/kysely-adapter",
    "kysely",
  ],
};

export default nextConfig;

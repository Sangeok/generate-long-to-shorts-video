import "server-only";

import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";

import { prisma } from "@/lib/db";

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function normalizeOrigin(origin: string) {
  return origin.replace(/\/+$/, "");
}

function getTrustedOrigins() {
  const configuredOrigins = process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const vercelOrigin = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : undefined;
  const origins = [
    requireEnv("BETTER_AUTH_URL"),
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
    vercelOrigin,
    ...(configuredOrigins ?? []),
  ]
    .filter((origin): origin is string => Boolean(origin))
    .map(normalizeOrigin);

  return Array.from(new Set(origins));
}

export const auth = betterAuth({
  appName: "LongformShorts AI",
  baseURL: requireEnv("BETTER_AUTH_URL"),
  secret: requireEnv("BETTER_AUTH_SECRET"),
  database: prismaAdapter(prisma, {
    provider: "postgresql",
    transaction: true,
  }),
  socialProviders: {
    google: {
      clientId: requireEnv("GOOGLE_CLIENT_ID"),
      clientSecret: requireEnv("GOOGLE_CLIENT_SECRET"),
    },
  },
  trustedOrigins: getTrustedOrigins(),
});

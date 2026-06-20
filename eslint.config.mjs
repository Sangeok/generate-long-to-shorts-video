import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const appFiles = [
  "app/**/*.{ts,tsx}",
  "components/**/*.{ts,tsx}",
  "features/**/*.{ts,tsx}",
  "hooks/**/*.{ts,tsx}",
  "lib/**/*.{ts,tsx}",
  "store/**/*.{ts,tsx}",
  "types/**/*.{ts,tsx}",
  "constants/**/*.{ts,tsx}",
];

const publicBoundaryRestrictions = [
  {
    group: [
      "@/features/*/*",
      "@/features/*/**",
      "!@/features/*/server",
      "!@/features/*/actions",
    ],
    message:
      "feature 외부에서는 features/[feature], features/[feature]/server, features/[feature]/actions 공개 경계만 import합니다.",
  },
  {
    group: ["@/components/ui/*/**"],
    message:
      "UI 컴포넌트는 현재 프로젝트 규칙대로 @/components/ui/button 같은 단일 파일 공개 경계를 사용합니다.",
  },
];

const featureLayerRestrictions = [
  {
    group: ["@/features", "@/features/*", "@/features/**"],
    message:
      "feature 내부에서 다른 feature를 직접 import하지 않습니다. 같은 feature 내부는 상대 경로를 사용합니다.",
  },
  {
    group: ["@/components/layout", "@/components/layout/**"],
    message:
      "layout은 route layer에서만 적용합니다. feature에는 props 또는 children으로 주입합니다.",
  },
  {
    group: [
      "@/components/landing",
      "@/components/landing/**",
      "@/app/**/_components/**",
      "@/app/**/_lib/**",
    ],
    message:
      "route-specific 컴포넌트와 유틸은 feature 내부에서 import하지 않습니다.",
  },
];

const uiLayerRestrictions = [
  {
    group: [
      "@/features",
      "@/features/**",
      "@/store",
      "@/store/**",
      "@/app",
      "@/app/**",
      "@/components/layout",
      "@/components/layout/**",
      "@/components/landing",
      "@/components/landing/**",
    ],
    message:
      "components/ui는 도메인, 전역 store, route layer, route-specific 컴포넌트에 의존하지 않습니다.",
  },
];

const sharedLayerRestrictions = [
  {
    group: [
      "@/features",
      "@/features/**",
      "@/app",
      "@/app/**",
      "@/components/layout",
      "@/components/layout/**",
      "@/components/landing",
      "@/components/landing/**",
    ],
    message:
      "shared layer는 features, app, route-specific 컴포넌트에 의존하지 않습니다.",
  },
];

const routeComponentRestrictions = [
  {
    group: ["@/features", "@/features/**", "@/app", "@/app/**"],
    message:
      "components/layout과 components/landing은 feature 또는 app route 구현을 직접 import하지 않습니다. route layer에서 조립하고 props 또는 children으로 주입합니다.",
  },
];

const restrictedImports = (patterns) => [
  "warn",
  {
    patterns,
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: appFiles,
    rules: {
      "no-restricted-imports": restrictedImports(publicBoundaryRestrictions),
    },
  },
  {
    files: [
      "hooks/**/*.{ts,tsx}",
      "lib/**/*.{ts,tsx}",
      "constants/**/*.{ts,tsx}",
      "store/**/*.{ts,tsx}",
      "types/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": restrictedImports([
        ...publicBoundaryRestrictions,
        ...sharedLayerRestrictions,
      ]),
    },
  },
  {
    files: [
      "components/layout/**/*.{ts,tsx}",
      "components/landing/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": restrictedImports([
        ...publicBoundaryRestrictions,
        ...routeComponentRestrictions,
      ]),
    },
  },
  {
    files: ["features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": restrictedImports([
        ...publicBoundaryRestrictions,
        ...featureLayerRestrictions,
      ]),
    },
  },
  {
    files: ["components/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": restrictedImports([
        ...publicBoundaryRestrictions,
        ...uiLayerRestrictions,
      ]),
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "generated/prisma/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

# Better Auth Google 소셜 로그인 구현 계획

> **에이전트 작업자용:** REQUIRED SUB-SKILL: 이 계획을 작업 단위로 구현할 때는 `superpowers:subagent-driven-development` 사용을 권장하며, 대안으로 `superpowers:executing-plans`를 사용할 수 있다. 진행 상황 추적을 위해 각 단계는 체크박스(`- [ ]`) 형식을 사용한다.

> **보관 규칙:** 이 계획의 모든 작업을 완료하고 검증까지 끝내면, 최종 응답을 보내기 전에 이 파일을 `docs/plans/archive/`로 이동한다.

> **커밋 규칙:** 아래 커밋 단계는 사용자가 명시적으로 커밋을 요청한 경우에만 실행하는 선택 단계다. 커밋 요청이 없으면 구현과 검증만 수행하고 커밋 체크박스는 건너뛴다.

**목표:** 현재 Next.js 16 App Router 프로젝트에 Better Auth를 사용한 Google 소셜 로그인을 추가하고, 인증 데이터는 Neon Postgres + Prisma로 영속화한다.

**아키텍처:** Better Auth는 `app/api/auth/[...all]/route.ts`에 마운트한다. 서버 측 인증 설정은 `lib/auth.ts`에 두고, Prisma Client와 Neon adapter 초기화는 `lib/db.ts`에 둔다. 두 서버 전용 모듈은 `import "server-only";`로 클라이언트 번들 오염을 막는다. Prisma schema와 migration은 `prisma/schema.prisma` 및 `prisma/migrations/`가 소유하며, 브라우저에서 사용할 Better Auth React 클라이언트는 `lib/auth-client.ts`로 노출한다. 로그인 페이지와 헤더 인증 UI는 `features/auth` 경계 안에 둔다. `components/landing`은 feature를 직접 import하지 않고, route layer인 `app/page.tsx`가 `AuthHeaderActions`를 `SiteHeader`에 주입한다.

**기술 스택:** Next.js 16.2.7 App Router, React 19.2.4, Better Auth, `@better-auth/prisma-adapter`, Google OAuth, Neon Postgres, Prisma ORM, `@prisma/adapter-neon`, `server-only`, npm, TypeScript, Node.js `>=20.19.0`.

---

## 현재 파악한 사항

- 기존 인증 구현이 없고, `better-auth`, Prisma, Neon 관련 의존성이 없다.
- 현재 앱은 `app/page.tsx`와 `components/landing/*`로 구성된 랜딩 페이지다.
- `components/landing/site-header.tsx`의 `Sign in`, `Start free` 링크는 실제 인증 플로우로 연결되지 않는다.
- `docs/plans/archive/2026-06-07-longformshorts-landing-design.md`에는 실제 인증 기능이 랜딩 페이지 작업 범위 밖이라고 명시되어 있다. 이 계획은 그 범위를 확장하는 후속 계획이다.
- 설치된 Next.js 16 문서 기준으로 App Router API 엔드포인트는 `app/**/route.ts` Route Handler로 작성해야 한다. Better Auth의 Next 통합도 `app/api/auth/[...all]/route.ts`를 사용한다.
- Better Auth의 Prisma adapter는 `better-auth/adapters/prisma`의 `prismaAdapter(prisma, { provider: "postgresql" })` 형태로 연결한다.
- Better Auth Prisma adapter 문서는 `@better-auth/prisma-adapter` 패키지 설치를 요구하며, import 경로는 `better-auth/adapters/prisma`를 사용한다.
- Prisma 7 기준으로 generated client는 명시적 output을 사용하고, Neon 런타임 연결은 driver adapter를 통해 Prisma Client 생성자에 전달한다.
- Prisma 7 upgrade guide 기준 최소 Node.js 버전은 `20.19.0`이다. 현재 로컬 `node -v`는 `v22.13.1`로 이 전제를 충족한다.
- 이 계획은 Prisma 7 전제를 구현 source of truth로 사용하므로 `@prisma/client`, `@prisma/adapter-neon`, `prisma`는 설치 명령에서 `@7` major를 명시한다.
- Prisma 7의 ESM 전제에 맞춰 `package.json`에 `"type": "module"`을 추가하고, `tsconfig.json`의 `compilerOptions.target`을 `"ES2023"`으로 올린다. 현재 프로젝트에는 CommonJS 전용 설정 파일이 없으므로 `next.config.ts`와 `eslint.config.mjs`는 이 변경과 호환된다.
- 현재 `tsconfig.json`은 `module: "esnext"`와 `moduleResolution: "bundler"`를 이미 사용하지만 `target`이 `"ES2017"`이다. Prisma 7 upgrade guide의 TypeScript 설정 예시와 맞추기 위해 `target`만 `"ES2023"`으로 변경한다.
- 현재 `eslint.config.mjs`의 `globalIgnores`에는 generated Prisma client 경로가 없다. `generated/prisma`는 git뿐 아니라 ESLint 대상에서도 제외해야 `npm run lint`가 생성 산출물을 스캔하지 않는다.
- `server-only`는 현재 직접 의존성에 없다. Next.js가 내부 처리하더라도 이 계획에서는 서버 전용 모듈에서 명시적으로 import하므로 dependency tree에 추가해 import 의도를 분명히 한다.
- Google OAuth 로컬 redirect URI는 `http://localhost:3000/api/auth/callback/google`와 일치해야 한다.
- 이 계획의 로컬 URL은 개발 서버가 `http://localhost:3000`에서 실행된다는 전제다. 3000 포트를 사용할 수 없어 다른 포트로 실행하면 `BETTER_AUTH_URL`, Google authorized redirect URI, 브라우저 검증 URL을 모두 같은 origin으로 함께 바꾼다. Better Auth가 해당 origin의 인증 요청을 허용하도록 `trustedOrigins`도 `BETTER_AUTH_URL` 기준으로 설정한다.
- 2026-06-08 reconciliation 기준으로 현재 baseline `npm run lint`는 기존 코드에서 실패한다. 확인된 실패는 `components/ui/carousel.tsx:98`의 `onSelect(api)` effect 내 동기 state update와 `hooks/use-mobile.ts:14`의 `setIsMobile(...)` effect 내 동기 state update다. auth 구현 완료를 주장하기 전에는 이 기존 lint 실패를 별도 수정하거나 auth 작업 범위에 포함해 최종 `npm run lint`를 exit code 0으로 다시 통과시킨다.

## 확인한 참고 자료

- Better Auth Next.js 통합 문서: https://better-auth.com/docs/integrations/next
- Better Auth Basic Usage / Social Sign-On 문서: https://better-auth.com/docs/basic-usage
- Better Auth Google provider 문서: https://better-auth.com/docs/authentication/google
- Better Auth Prisma adapter 문서: https://better-auth.com/docs/adapters/prisma
- Better Auth Database/CLI 문서: https://better-auth.com/docs/concepts/database, https://better-auth.com/docs/concepts/cli
- Prisma + Better Auth Next.js 가이드: https://www.prisma.io/docs/guides/authentication/better-auth/nextjs
- Prisma Neon adapter 문서: https://www.prisma.io/docs/orm/overview/databases/neon
- Prisma 7 upgrade guide: https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7
- 로컬 Next.js 16 문서: `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
- 로컬 Next.js 16 문서: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`
- 로컬 Next.js 16 문서: `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`

## 구현 결정 사항

- SQLite는 사용하지 않는다. 인증 데이터는 Neon Postgres에 저장한다.
- 런타임 연결은 Neon의 pooled connection string을 `DATABASE_URL`로 사용한다.
- Prisma migration은 Neon의 direct connection string을 `DIRECT_URL`로 사용한다.
- Prisma schema에는 Better Auth의 core 모델인 `User`, `Session`, `Account`, `Verification`을 직접 정의한다.
- `npx auth migrate`는 Prisma adapter 흐름에 사용하지 않는다. Prisma가 schema와 migration의 source of truth이므로 `npx prisma migrate dev` 및 `npx prisma migrate deploy`를 사용한다.
- `.env.example`은 추가하되, 실제 `.env` 값은 로컬에만 두고 git에 포함하지 않는다.
- OAuth 설정 오류가 조용히 지나가지 않도록 `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `DATABASE_URL`은 런타임에서 필수로 검사한다.
- `BETTER_AUTH_URL`은 실제로 OAuth flow를 시작하는 로컬/배포 origin과 일치시킨다. dev server 포트가 바뀌면 Google callback URL도 같은 포트로 바꾼다.
- Better Auth config에는 `trustedOrigins: [requireEnv("BETTER_AUTH_URL")]`를 포함한다. 이 값은 기본 3000번 외 포트에서 발생할 수 있는 인증 요청 origin 검증 오류를 막는 데 필요하다.
- 로그인 이후 callback 대상이 될 간단한 보호 페이지 `/dashboard`를 추가한다.
- 첫 구현에서는 `proxy.ts`를 추가하지 않는다. 보안상 중요한 세션 검증은 보호된 서버 페이지에서 `auth.api.getSession({ headers: await headers() })`로 수행한다. pre-render 단계의 redirect 편의성이 필요해지면 별도 인증 보호 작업에서 `proxy.ts`를 추가한다.
- generated Prisma client는 `generated/prisma/`에 생성하고 git에는 포함하지 않는다. 빌드와 검증 전에 `npm run db:generate`를 실행한다.
- generated Prisma client는 `eslint.config.mjs`의 `globalIgnores`에도 추가해 lint 대상에서 제외한다. 이 디렉터리는 재생성 산출물이므로 직접 수정하거나 lint 수정을 적용하지 않는다.
- 서버 전용 모듈의 `import "server-only";`와 package 상태가 어긋나지 않도록 `server-only`를 런타임 의존성으로 설치한다.
- Better Auth core schema는 adapter 호환성을 위해 Better Auth 기본 field name(`emailVerified`, `createdAt`, `userId` 등)을 유지한다. 프로젝트의 일반 DB snake_case 규칙은 이 외부 인증 adapter schema에는 적용하지 않는다. snake_case로 바꾸려면 Better Auth config의 `fields` mapping까지 함께 설계하는 별도 작업으로 다룬다.
- `components/landing`은 landing route 전용 UI로 유지한다. 인증 feature와의 조합은 `app/page.tsx`에서 수행하고, `components/landing/site-header.tsx`에는 slot prop만 추가한다.

---

## 생성 또는 수정할 파일

- 수정: `package.json` - Better Auth, Prisma, Neon adapter 의존성, Prisma 7 Node/ESM 설정, DB 스크립트 추가.
- 수정: `package-lock.json` - npm install로 생성되는 lockfile 변경.
- 수정: `tsconfig.json` - Prisma 7 ESM TypeScript target에 맞춰 `compilerOptions.target`을 `"ES2023"`으로 변경.
- 수정: `.gitignore` - `.env.example`은 허용하고 generated Prisma client는 무시.
- 수정: `eslint.config.mjs` - generated Prisma client를 lint 대상에서 제외.
- 생성: `.env.example` - 인증 및 Neon 연결 환경 변수 문서화.
- 생성: `prisma.config.ts` - Prisma CLI가 사용할 schema, migration, direct connection 설정.
- 생성: `prisma/schema.prisma` - Better Auth core 모델과 PostgreSQL datasource 정의.
- 생성: `lib/db.ts` - Prisma Client + Neon adapter singleton.
- 생성: `lib/auth.ts` - Better Auth 서버 인스턴스와 Prisma adapter 연결.
- 생성: `lib/auth-client.ts` - Better Auth React 클라이언트.
- 생성: `app/api/auth/[...all]/route.ts` - Better Auth Route Handler.
- 생성: `features/auth/components/google-sign-in-card.tsx` - 로그인 페이지 UI.
- 생성: `features/auth/components/auth-header-actions.tsx` - 헤더 CTA 및 세션 UI.
- 생성: `features/auth/index.ts` - auth feature 공개 API.
- 생성: `app/sign-in/page.tsx` - 로그인 페이지.
- 생성: `app/dashboard/page.tsx` - 보호된 callback 대상 페이지.
- 수정: `components/landing/site-header.tsx` - auth action slot prop을 추가하고 기본 시각 CTA를 fallback으로 유지.
- 수정: `app/page.tsx` - route layer에서 `AuthHeaderActions`를 `SiteHeader`에 주입.

---

### 사전 작업: 현재 검증 baseline 확인

**파일:**
- 수정 파일 없음.

- [ ] **1단계: 현재 lint baseline 확인**

실행:

```powershell
npm run lint
```

기대 결과:

- baseline이 이미 통과하면 그대로 auth 작업을 진행한다.
- baseline이 `components/ui/carousel.tsx:98` 또는 `hooks/use-mobile.ts:14`에서 실패하면, 이는 기존 코드의 lint 실패다. auth 구현 완료를 주장하기 전까지 별도 수정 또는 auth 작업 내 선행 수정으로 해소하고 `npm run lint`를 다시 실행해 exit code 0을 확인한다.

---

### 작업 1: Better Auth, Prisma, Neon 의존성 설치

**파일:**
- 수정: `package.json`
- 수정: `package-lock.json`
- 수정: `tsconfig.json`

- [ ] **1단계: Node.js 버전 확인**

실행:

```powershell
node -v
```

기대 결과: `v20.19.0` 이상이다. Prisma 7은 Node.js `20.19.0` 이상을 전제로 하므로, 더 낮은 버전이면 Node.js를 먼저 업그레이드한 뒤 의존성을 설치한다.

- [ ] **2단계: 런타임 의존성 설치**

실행:

```powershell
npm install better-auth @better-auth/prisma-adapter @prisma/client@7 @prisma/adapter-neon@7 dotenv server-only
```

기대 결과: `package.json`의 `dependencies`에 `better-auth`, `@better-auth/prisma-adapter`, `@prisma/client` 7.x, `@prisma/adapter-neon` 7.x, `dotenv`, `server-only`가 추가된다.

- [ ] **3단계: Prisma CLI 설치**

실행:

```powershell
npm install -D prisma@7
```

기대 결과: `package.json`의 `devDependencies`에 `prisma` 7.x가 추가된다.

- [ ] **4단계: Prisma 7 Node/ESM/TypeScript 설정과 DB 관련 npm scripts 추가**

`package.json`의 top-level에 `"type": "module"`과 Node.js engine 조건을 추가하고, `scripts`를 아래 형태로 확장한다. 기존 `dev`, `start`, `lint`는 유지하고, `build`는 Prisma Client 생성 후 Next build를 실행하도록 바꾼다.

```json
{
  "type": "module",
  "engines": {
    "node": ">=20.19.0"
  },
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "eslint",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:validate": "prisma validate",
    "db:studio": "prisma studio"
  }
}
```

`tsconfig.json`의 `compilerOptions.target`은 Prisma 7 ESM 설정에 맞춰 `"ES2023"`으로 변경한다. 현재 `module: "esnext"`와 `moduleResolution: "bundler"`는 그대로 유지한다.

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "esnext",
    "moduleResolution": "bundler"
  }
}
```

주의: 이후 CommonJS 전용 Node 설정 파일을 추가해야 한다면 `.cjs` 또는 `.cts` 확장자를 사용한다.

- [ ] **5단계: 의존성 트리 확인**

실행:

```powershell
npm ls --depth=0 better-auth
npm ls --depth=0 @better-auth/prisma-adapter
npm ls --depth=0 @prisma/client
npm ls --depth=0 @prisma/adapter-neon
npm ls --depth=0 dotenv
npm ls --depth=0 server-only
npm ls --depth=0 prisma
```

기대 결과: 각 명령이 exit code 0으로 끝나고 해당 패키지가 project root의 direct dependency 또는 devDependency로 출력된다. `@prisma/client`, `@prisma/adapter-neon`, `prisma`는 7.x로 출력된다. `(empty)`이거나 transitive dependency로만 보이면 설치가 끝난 것으로 보지 않는다.

- [ ] **6단계: 의존성 변경 커밋**

```powershell
git add package.json package-lock.json tsconfig.json
git commit -m "chore: install better auth prisma neon dependencies"
```

---

### 작업 2: Neon 환경 변수와 ignore 규칙 추가

**파일:**
- 수정: `.gitignore`
- 수정: `eslint.config.mjs`
- 생성: `.env.example`

- [ ] **1단계: `.gitignore` 수정**

기존 `.env*` 규칙 아래에 다음 내용을 추가한다.

```gitignore
!.env.example

# generated prisma client
/generated/prisma
```

이 설정은 실제 비밀 값은 git에서 제외하면서, 공유 가능한 `.env.example`은 커밋할 수 있게 한다. `generated/prisma`는 `npm run db:generate`로 재생성한다.

- [ ] **2단계: `eslint.config.mjs` 수정**

`globalIgnores` 목록에 generated Prisma client 경로를 추가한다.

```js
globalIgnores([
  // Default ignores of eslint-config-next:
  ".next/**",
  "out/**",
  "build/**",
  "next-env.d.ts",
  "generated/prisma/**",
]),
```

이 설정은 `npm run lint`가 Prisma generated client를 검사하지 않게 한다. generated client는 직접 수정하지 않고 `npm run db:generate`로 재생성한다.

- [ ] **3단계: `.env.example` 생성**

아래 내용을 그대로 파일에 작성한다.

```dotenv
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Neon pooled connection string. Used at runtime by @prisma/adapter-neon.
DATABASE_URL=

# Neon direct connection string. Used by Prisma Migrate.
DIRECT_URL=
```

- [ ] **4단계: Neon 프로젝트 생성 및 연결 문자열 준비**

Neon Console에서 프로젝트와 database를 생성한다.

`DATABASE_URL`에는 pooled connection string을 넣는다. Neon connection details에서 pooling이 켜진 URL을 사용하며, 일반적으로 host에 `-pooler`가 포함된다.

`DIRECT_URL`에는 direct connection string을 넣는다. Prisma Migrate가 DDL을 실행할 때 사용하는 URL이므로 pooled URL을 넣지 않는다.

- [ ] **5단계: 예시 파일에서 로컬 `.env` 생성**

실행:

```powershell
Copy-Item -Path .env.example -Destination .env
```

그다음 Better Auth secret을 생성한다.

```powershell
npx auth@latest secret
```

생성된 값을 `.env`의 `BETTER_AUTH_SECRET`에 붙여 넣고, Neon의 `DATABASE_URL`, `DIRECT_URL`도 채운다.

- [ ] **6단계: Google OAuth 설정**

Google Cloud Console에서 Web application OAuth client를 생성하고, 로컬 개발용 authorized redirect URI에 아래 값을 추가한다.

```text
http://localhost:3000/api/auth/callback/google
```

OAuth client ID와 secret을 `.env`의 `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`에 입력한다.

만약 로컬 개발 서버가 `http://localhost:3000`이 아닌 다른 origin에서 실행된다면, `.env`의 `BETTER_AUTH_URL`과 Google authorized redirect URI를 그 origin 기준으로 함께 변경한다.
`lib/auth.ts`의 `trustedOrigins`는 `BETTER_AUTH_URL`을 사용하므로, 별도 코드 수정 없이 같은 origin을 허용한다.

- [ ] **7단계: ignore 및 공유 환경 문서 커밋**

```powershell
git add .gitignore eslint.config.mjs .env.example
git commit -m "chore: document auth env and generated outputs"
```

---

### 작업 3: Prisma 설정과 Better Auth schema 생성

**파일:**
- 생성: `prisma.config.ts`
- 생성: `prisma/schema.prisma`

- [ ] **1단계: Prisma 디렉터리 생성**

실행:

```powershell
New-Item -ItemType Directory -Force -Path prisma
```

- [ ] **2단계: `prisma.config.ts` 생성**

```ts
import "dotenv/config";

import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
```

이 설정은 Prisma CLI와 migration이 `DIRECT_URL`을 사용하게 한다. 앱 런타임은 `lib/db.ts`에서 `DATABASE_URL`을 사용한다.

- [ ] **3단계: `prisma/schema.prisma` 생성**

Better Auth adapter 호환성을 위해 Better Auth core field name은 camelCase 그대로 둔다. `@@map`으로 table name만 Better Auth 기본 table name에 맞추고, field-level `@map`은 이 작업에서 추가하지 않는다.

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model User {
  id            String    @id
  name          String
  email         String
  emailVerified Boolean   @default(false)
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  sessions      Session[]
  accounts      Account[]

  @@unique([email])
  @@map("user")
}

model Session {
  id        String   @id
  expiresAt DateTime
  token     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  ipAddress String?
  userAgent String?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([token])
  @@index([userId])
  @@map("session")
}

model Account {
  id                    String    @id
  accountId             String
  providerId            String
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@index([userId])
  @@map("account")
}

model Verification {
  id         String   @id
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([identifier])
  @@map("verification")
}
```

- [ ] **4단계: Prisma schema 검증**

실행:

```powershell
npm run db:validate
```

기대 결과: Prisma schema가 유효하다는 메시지가 출력된다.

- [ ] **5단계: Prisma Client 생성**

실행:

```powershell
npm run db:generate
```

기대 결과: `generated/prisma`에 Prisma Client가 생성된다. 이 디렉터리는 git에 포함하지 않는다.

- [ ] **6단계: Prisma 설정 커밋**

```powershell
git add prisma.config.ts prisma/schema.prisma
git commit -m "feat: add prisma schema for better auth"
```

---

### 작업 4: Neon에 Prisma migration 적용

**파일:**
- 생성: `prisma/migrations/**`

- [ ] **1단계: Better Auth schema migration 생성 및 적용**

실행:

```powershell
npm run db:migrate -- --name add_better_auth_google_login
```

기대 결과: Prisma가 `prisma/migrations/`에 migration SQL을 생성하고 Neon database에 `user`, `session`, `account`, `verification` 테이블을 생성한다.

- [ ] **2단계: migration 상태 확인**

실행:

```powershell
npx prisma migrate status
```

기대 결과: database schema가 migration history와 동기화되어 있다는 메시지가 출력된다.

- [ ] **3단계: migration 커밋**

```powershell
git add prisma/migrations
git commit -m "feat: migrate better auth tables"
```

---

### 작업 5: Prisma Client와 Neon adapter singleton 생성

**파일:**
- 생성: `lib/db.ts`

- [ ] **1단계: `lib/db.ts` 생성**

```ts
import "server-only";

import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "@/generated/prisma/client";

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const adapter = new PrismaNeon({
  connectionString: requireEnv("DATABASE_URL"),
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
```

이 파일은 DB connection string과 Prisma Client를 소유하므로 Client Component에서 직접 import하지 않는다.

- [ ] **2단계: generated client가 있는 상태에서 lint 실행**

실행:

```powershell
npm run db:generate
npm run lint
```

기대 결과: `@/generated/prisma/client` import 오류가 없다. 사전 작업에서 확인한 기존 lint 실패가 아직 남아 있으면 `lib/db.ts` 또는 generated client import 때문에 새 오류가 추가되지 않았는지 확인하고, auth 구현 완료 전 기존 실패를 해결한다.

- [ ] **3단계: DB singleton 커밋**

```powershell
git add lib/db.ts
git commit -m "feat: add prisma neon client"
```

---

### 작업 6: Better Auth 서버 인스턴스 생성

**파일:**
- 생성: `lib/auth.ts`

- [ ] **1단계: `lib/auth.ts` 생성**

```ts
import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { prisma } from "@/lib/db";

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const auth = betterAuth({
  appName: "LongformShorts AI",
  baseURL: requireEnv("BETTER_AUTH_URL"),
  secret: requireEnv("BETTER_AUTH_SECRET"),
  trustedOrigins: [requireEnv("BETTER_AUTH_URL")],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    google: {
      clientId: requireEnv("GOOGLE_CLIENT_ID"),
      clientSecret: requireEnv("GOOGLE_CLIENT_SECRET"),
      prompt: "select_account",
    },
  },
  plugins: [nextCookies()],
});
```

`nextCookies()`는 Better Auth plugin 배열의 마지막 항목으로 유지한다. 이 작업에서는 plugin이 하나뿐이므로 별도 정렬이 필요 없다.
`trustedOrigins`는 `BETTER_AUTH_URL`과 같은 origin을 사용해 로컬 포트 변경이나 배포 origin 변경 시 인증 요청 origin 검증이 설정과 어긋나지 않게 한다.

- [ ] **2단계: TypeScript import resolve 확인**

실행:

```powershell
npm run db:generate
npm run lint
rg -n "trustedOrigins" lib/auth.ts
```

기대 결과:

- `lib/auth.ts`에서 새 lint 오류가 발생하지 않는다. `.env` 값이 비어 있어서 실패하면 작업 2의 모든 값을 먼저 채운다. 사전 작업에서 확인한 기존 lint 실패가 아직 남아 있으면 auth 구현 완료 전 기존 실패를 해결한다.
- `rg -n "trustedOrigins" lib/auth.ts`는 `trustedOrigins: [requireEnv("BETTER_AUTH_URL")]` 설정을 찾는다.

- [ ] **3단계: 서버 auth 설정 커밋**

```powershell
git add lib/auth.ts
git commit -m "feat: configure better auth with prisma"
```

---

### 작업 7: Next.js Route Handler에 Better Auth 마운트

**파일:**
- 생성: `app/api/auth/[...all]/route.ts`

- [ ] **1단계: route handler 디렉터리 생성**

실행:

```powershell
New-Item -ItemType Directory -Force -LiteralPath 'app\api\auth\[...all]'
```

- [ ] **2단계: `app/api/auth/[...all]/route.ts` 생성**

```ts
import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";

export const runtime = "nodejs";

export const { GET, POST } = toNextJsHandler(auth);
```

- [ ] **3단계: 개발 서버 시작**

실행:

```powershell
npm run dev
```

기대 결과: Next.js가 `http://localhost:3000`에서 시작된다.

- [ ] **4단계: session endpoint 확인**

두 번째 터미널에서 실행:

```powershell
curl.exe -i http://localhost:3000/api/auth/get-session
```

기대 결과: 404가 아니라 HTTP 200과 미인증 session 응답이 반환된다.

- [ ] **5단계: route handler 커밋**

```powershell
git add app/api/auth
git commit -m "feat: mount better auth route handler"
```

---

### 작업 8: Better Auth React 클라이언트 생성

**파일:**
- 생성: `lib/auth-client.ts`

- [ ] **1단계: `lib/auth-client.ts` 생성**

```ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();
```

- [ ] **2단계: import 호환성 확인**

실행:

```powershell
npm run lint
```

기대 결과: `better-auth/react`에서 lint 또는 type-aware import 오류가 발생하지 않는다. 사전 작업에서 확인한 기존 lint 실패가 아직 남아 있으면 auth 구현 완료 전 기존 실패를 해결한다.

- [ ] **3단계: auth client 커밋**

```powershell
git add lib/auth-client.ts
git commit -m "feat: add better auth react client"
```

---

### 작업 9: Google 로그인 UI 추가

**파일:**
- 생성: `features/auth/components/google-sign-in-card.tsx`
- 생성: `features/auth/index.ts`
- 생성: `app/sign-in/page.tsx`

- [ ] **1단계: feature 디렉터리 생성**

실행:

```powershell
New-Item -ItemType Directory -Force -Path features\auth\components
```

- [ ] **2단계: `features/auth/components/google-sign-in-card.tsx` 생성**

```tsx
"use client";

import { Loader2, LogIn } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function GoogleSignInCard() {
  const [isPending, startTransition] = React.useTransition();

  const handleGoogleSignIn = () => {
    startTransition(async () => {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
        errorCallbackURL: "/sign-in",
      });
    });
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center px-5 py-16">
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="eyebrow">Google OAuth</p>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground">
          Sign in to LongformShorts AI
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Continue with Google to create clips, save projects, and access your
          dashboard.
        </p>
        <Button
          className="mt-6 h-11 w-full"
          disabled={isPending}
          onClick={handleGoogleSignIn}
        >
          {isPending ? <Loader2 className="animate-spin" /> : <LogIn />}
          Continue with Google
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **3단계: `features/auth/index.ts` 생성**

```ts
export { GoogleSignInCard } from "./components/google-sign-in-card";
```

- [ ] **4단계: `app/sign-in/page.tsx` 생성**

```tsx
import { GoogleSignInCard } from "@/features/auth";

export default function SignInPage() {
  return <GoogleSignInCard />;
}
```

- [ ] **5단계: `/sign-in` 렌더링 확인**

개발 서버를 실행한 뒤 아래 주소를 연다.

```text
http://localhost:3000/sign-in
```

기대 결과: `Continue with Google` 버튼이 있는 로그인 카드가 렌더링된다.

- [ ] **6단계: 로그인 UI 커밋**

```powershell
git add features/auth app/sign-in
git commit -m "feat: add google sign in page"
```

---

### 작업 10: 보호된 dashboard callback 대상 추가

**파일:**
- 생성: `app/dashboard/page.tsx`

- [ ] **1단계: `app/dashboard/page.tsx` 생성**

```tsx
import { Play } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export const runtime = "nodejs";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col px-5 py-16 sm:px-6">
      <div className="flex flex-1 flex-col justify-center">
        <div className="max-w-2xl">
          <p className="eyebrow">Dashboard</p>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Welcome, {session.user.name}
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Google login is active. The next product task can attach upload and
            clip-generation workflows to this authenticated user.
          </p>
        </div>
        <div className="mt-10 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-md bg-primary text-primary-foreground">
              <Play className="size-4 fill-current" />
            </span>
            <div>
              <h2 className="font-medium text-foreground">No projects yet</h2>
              <p className="text-sm text-muted-foreground">
                Your first upload flow can start here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **2단계: 미인증 redirect 확인**

새 private browser session에서 아래 주소를 연다.

```text
http://localhost:3000/dashboard
```

기대 결과: `/sign-in`으로 redirect된다.

- [ ] **3단계: dashboard 페이지 커밋**

```powershell
git add app/dashboard/page.tsx
git commit -m "feat: add protected dashboard"
```

---

### 작업 11: 랜딩 헤더에 인증 액션 연결

**파일:**
- 생성: `features/auth/components/auth-header-actions.tsx`
- 수정: `features/auth/index.ts`
- 수정: `components/landing/site-header.tsx`
- 수정: `app/page.tsx`

- [ ] **1단계: `features/auth/components/auth-header-actions.tsx` 생성**

```tsx
"use client";

import { Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";

interface AuthHeaderActionsProps {
  orientation?: "row" | "column";
}

export function AuthHeaderActions({
  orientation = "row",
}: AuthHeaderActionsProps) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [isSigningOut, startSignOutTransition] = React.useTransition();
  const isColumn = orientation === "column";

  if (isPending) {
    return (
      <div className={cn("flex gap-2", isColumn && "flex-col")}>
        <Button variant="outline" size={isColumn ? "default" : "sm"} disabled>
          <Loader2 className="animate-spin" />
          Loading
        </Button>
      </div>
    );
  }

  if (session?.user) {
    return (
      <div className={cn("flex gap-2", isColumn && "flex-col")}>
        <Button
          variant="ghost"
          size={isColumn ? "default" : "sm"}
          render={<a href="/dashboard" />}
        >
          Dashboard
        </Button>
        <Button
          variant="outline"
          size={isColumn ? "default" : "sm"}
          disabled={isSigningOut}
          onClick={() => {
            startSignOutTransition(async () => {
              await authClient.signOut({
                fetchOptions: {
                  onSuccess: () => router.refresh(),
                },
              });
            });
          }}
        >
          {isSigningOut ? <Loader2 className="animate-spin" /> : <LogOut />}
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-2", isColumn && "flex-col")}>
      <Button
        variant={isColumn ? "outline" : "ghost"}
        size={isColumn ? "default" : "sm"}
        render={<a href="/sign-in" />}
      >
        Sign in
      </Button>
      <Button size={isColumn ? "default" : "sm"} render={<a href="/sign-in" />}>
        Start free
      </Button>
    </div>
  );
}
```

- [ ] **2단계: `features/auth/index.ts`에서 header actions export**

파일을 아래 내용으로 교체한다.

```ts
export { AuthHeaderActions } from "./components/auth-header-actions";
export { GoogleSignInCard } from "./components/google-sign-in-card";
```

- [ ] **3단계: `components/landing/site-header.tsx`에 auth action slot prop 추가**

`features/auth` import를 `components/landing/site-header.tsx`에 추가하지 않는다. 대신 `SiteHeader`가 route layer에서 받은 React node를 렌더링할 수 있도록 prop을 추가한다.

기존 `SiteHeader` 함수 body는 유지하고, 함수 위에 props interface를 추가한 뒤 함수 signature만 아래처럼 바꾼다.

```tsx
interface SiteHeaderProps {
  desktopAuthActions?: React.ReactNode;
  mobileAuthActions?: React.ReactNode;
}

export function SiteHeader({
  desktopAuthActions,
  mobileAuthActions,
}: SiteHeaderProps) {
```

- [ ] **4단계: `components/landing/site-header.tsx`의 desktop auth 영역을 slot 기반으로 변경**

아래 코드를 찾는다.

```tsx
<div className="hidden items-center gap-2 md:flex">
  <Button variant="ghost" size="sm" render={<a href="#" />}>
    Sign in
  </Button>
  <Button size="sm" render={<a href="#pricing" />}>
    Start free
  </Button>
</div>
```

다음 코드로 교체한다.

```tsx
<div className="hidden items-center gap-2 md:flex">
  {desktopAuthActions ?? (
    <>
      <Button variant="ghost" size="sm" render={<a href="#" />}>
        Sign in
      </Button>
      <Button size="sm" render={<a href="#pricing" />}>
        Start free
      </Button>
    </>
  )}
</div>
```

- [ ] **5단계: `components/landing/site-header.tsx`의 mobile auth 영역을 slot 기반으로 변경**

아래 코드를 찾는다.

```tsx
<div className="mt-auto flex flex-col gap-2 border-t border-border p-5">
  <Button variant="outline" render={<a href="#" />}>
    Sign in
  </Button>
  <Button render={<a href="#pricing" />}>Start free</Button>
</div>
```

다음 코드로 교체한다.

```tsx
<div className="mt-auto border-t border-border p-5">
  {mobileAuthActions ?? (
    <div className="flex flex-col gap-2">
      <Button variant="outline" render={<a href="#" />}>
        Sign in
      </Button>
      <Button render={<a href="#pricing" />}>Start free</Button>
    </div>
  )}
</div>
```

- [ ] **6단계: `app/page.tsx`에서 auth feature를 주입**

`app/page.tsx`에 아래 import를 추가한다.

```tsx
import { AuthHeaderActions } from "@/features/auth";
```

아래 코드를 찾는다.

```tsx
<SiteHeader />
```

다음 코드로 교체한다.

```tsx
<SiteHeader
  desktopAuthActions={<AuthHeaderActions />}
  mobileAuthActions={<AuthHeaderActions orientation="column" />}
/>
```

이렇게 해야 `app/page.tsx` route layer가 feature 조합을 담당하고, `components/landing`은 route-specific UI 경계로 남는다.

- [ ] **7단계: 헤더 동작과 import 경계 검증**

실행:

```powershell
npm run db:generate
npm run lint
rg -n "@/features/auth" components/landing
```

그다음 브라우저에서 확인한다.

```text
http://localhost:3000/
```

기대 결과:

- `rg -n "@/features/auth" components/landing`은 출력이 없고 exit code 1로 종료된다.
- `npm run lint`에서 사전 작업의 기존 실패가 아직 남아 있으면 `features/auth`, `components/landing/site-header.tsx`, `app/page.tsx`에서 새 오류가 추가되지 않았는지 확인하고, auth 구현 완료 전 기존 실패를 해결한다.
- 로그아웃 상태에서는 헤더에 `Sign in`, `Start free`가 표시되고 둘 다 `/sign-in`으로 이동한다.
- 로그인 상태에서는 헤더에 `Dashboard`, `Sign out`이 표시된다.

- [ ] **8단계: 헤더 통합 커밋**

```powershell
git add features/auth/components/auth-header-actions.tsx features/auth/index.ts components/landing/site-header.tsx app/page.tsx
git commit -m "feat: wire auth actions into landing header"
```

---

### 작업 12: End-to-end 검증 실행

**파일:**
- 새 파일 없음.

- [ ] **1단계: Prisma schema와 migration 상태 검증**

```powershell
npm run db:validate
npx prisma migrate status
```

기대 결과: Prisma schema가 유효하고 Neon database가 migration history와 동기화되어 있다.

- [ ] **2단계: Prisma Client 생성**

```powershell
npm run db:generate
```

기대 결과: `generated/prisma`가 생성되고 `@/generated/prisma/client` import가 resolve된다.

- [ ] **3단계: 의존성 트리 확인**

```powershell
npm ls --depth=0 better-auth
npm ls --depth=0 @better-auth/prisma-adapter
npm ls --depth=0 @prisma/client
npm ls --depth=0 @prisma/adapter-neon
npm ls --depth=0 dotenv
npm ls --depth=0 server-only
npm ls --depth=0 prisma
```

기대 결과: 각 명령이 exit code 0으로 끝나고 인증/Prisma 관련 패키지가 project root의 direct dependency 또는 devDependency로 출력된다. `@prisma/client`, `@prisma/adapter-neon`, `prisma`는 7.x로 출력된다. `(empty)`이거나 transitive dependency로만 보이면 설치가 끝난 것으로 보지 않는다.

- [ ] **4단계: lint와 import 경계 확인**

```powershell
node -v
npm run lint
rg -n "@/features/auth" components/landing
rg -n "generated/prisma" .gitignore eslint.config.mjs
rg -n "trustedOrigins" lib/auth.ts
rg -n '"target": "ES2023"' tsconfig.json
rg -n '"node": ">=20.19.0"' package.json
```

기대 결과:

- `node -v`는 `v20.19.0` 이상을 출력한다.
- `npm run lint`는 exit code 0으로 종료된다.
- 사전 작업에서 확인한 기존 lint 실패가 남아 있으면 auth 구현 완료로 간주하지 않는다. 기존 실패를 먼저 해소한 뒤 이 단계를 다시 실행한다.
- `rg -n "@/features/auth" components/landing`은 출력이 없고 exit code 1로 종료된다. 이는 `components/landing`이 feature를 직접 import하지 않는다는 기대 결과다.
- `rg -n "generated/prisma" .gitignore eslint.config.mjs`는 두 파일에서 모두 generated Prisma client 제외 규칙을 찾는다.
- `rg -n "trustedOrigins" lib/auth.ts`는 `trustedOrigins: [requireEnv("BETTER_AUTH_URL")]` 설정을 찾는다.
- `rg -n '"target": "ES2023"' tsconfig.json`는 Prisma 7 ESM TypeScript target 설정을 찾는다.
- `rg -n '"node": ">=20.19.0"' package.json`는 Prisma 7 최소 Node.js 버전 조건을 찾는다.

- [ ] **5단계: production build 실행**

```powershell
npm run build
```

기대 결과: `prisma generate` 후 `next build`가 실행되고 exit code 0으로 종료된다. auth 코드 실행 전 기존 랜딩 페이지 JSX/문자열 문제 때문에 실패하면, auth 작업을 병합하기 전에 해당 문제를 별도로 고치고 build를 다시 실행한다.

- [ ] **6단계: 로컬 OAuth flow 실행**

개발 서버를 시작한다.

```powershell
npm run dev
```

아래 주소를 연다.

```text
http://localhost:3000/sign-in
```

`Continue with Google`을 클릭한다.

기대 결과:

- Google consent page가 열린다.
- 승인 후 Google이 `http://localhost:3000/api/auth/callback/google`로 돌아온다.
- Better Auth가 Neon Postgres의 `user`, `account`, `session` 테이블에 레코드를 생성한다.
- 브라우저가 `/dashboard`로 redirect된다.
- `/dashboard`에 로그인한 Google 사용자의 display name이 표시된다.

- [ ] **7단계: Neon 데이터 확인**

실행:

```powershell
npx prisma studio
```

기대 결과: Prisma Studio에서 `User`, `Account`, `Session` 레코드를 확인할 수 있다.

- [ ] **8단계: sign-out 검증**

`/dashboard`는 첫 구현의 보호된 callback 대상이며 전역 앱 셸을 포함하지 않는다. 아래 주소로 이동해 랜딩 헤더의 로그인 상태를 확인한 뒤 `Sign out`을 클릭한다.

```text
http://localhost:3000/
```

기대 결과:

- session cookie가 제거된다.
- 헤더가 로그아웃 상태로 돌아간다.
- `/dashboard`에 방문하면 `/sign-in`으로 redirect된다.

- [ ] **9단계: 실수로 로컬 산출물이 staging되지 않았는지 확인**

```powershell
git status --short
```

기대 결과: `.env`, `.next`, `generated/prisma`가 staged changes에 포함되어 있지 않다.

---

## 프로덕션 참고 사항

- 프로덕션에서는 `BETTER_AUTH_URL`을 실제 배포 origin으로 설정한다. 예: `https://app.example.com`.
- Google authorized redirect URI에도 같은 origin의 callback URL을 추가한다. 예: `https://app.example.com/api/auth/callback/google`.
- 배포 런타임은 Node.js `20.19.0` 이상으로 설정한다. Prisma 7은 이 최소 버전을 전제로 한다.
- 프로덕션 배포에서는 `DATABASE_URL`과 `DIRECT_URL`을 모두 배포 환경 변수에 설정한다.
- 배포 전 migration은 `npm run db:deploy`로 적용한다. `db:migrate`는 로컬 개발용이다.
- `BETTER_AUTH_SECRET`은 배포 간 안정적으로 유지한다. Secret rotation을 별도로 설정하지 않고 값을 바꾸면 기존 signed cookie가 무효화된다.
- Neon pooled connection은 런타임에 적합하고, direct connection은 migration에 적합하다. 두 URL을 혼동하지 않는다.

## 자체 검토

- SQLite 관련 의존성, 파일, migration, ignore 규칙을 제거하고 Neon Postgres + Prisma 흐름으로 대체했다.
- 필요한 인증 경로를 모두 다룬다: Prisma schema, Neon migration, Prisma Client singleton, Better Auth Prisma adapter, API route, 클라이언트, 로그인 UI, callback 대상, 헤더 통합, 검증.
- Better Auth Prisma adapter 패키지 설치, Prisma 관련 패키지 `@7` major 고정, Prisma 7의 Node.js `>=20.19.0`, `"type": "module"` 및 `tsconfig.json` `target: "ES2023"` 전제, generated client import 경로, Neon `DATABASE_URL`/`DIRECT_URL` 분리, `server-only` 의존성과 서버 전용 경계를 계획에 반영했다.
- `BETTER_AUTH_URL`, Google callback URL, `trustedOrigins`가 같은 origin을 기준으로 맞물리도록 계획에 반영했다.
- Prisma가 schema와 migration의 source of truth가 되도록 Better Auth CLI migration 대신 Prisma Migrate를 사용한다.
- 계획은 Next.js 16 Route Handler를 사용하고 deprecated middleware 명명 방식을 피한다.
- landing route와 auth feature 조합은 `app/page.tsx`에서 수행하며, `components/landing`이 `features/auth`를 직접 import하지 않도록 검증한다.
- generated Prisma client는 로컬/CI에서 재생성하는 산출물로 취급하고 git에 포함하지 않는다.
- generated Prisma client는 lint 대상에서도 제외해, 검증이 산출물 내부 코드가 아니라 auth 구현 코드와 import 경계를 검사하도록 한다.

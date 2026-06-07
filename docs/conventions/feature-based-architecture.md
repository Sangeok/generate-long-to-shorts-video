# Architecture Guide

이 문서는 프로젝트의 폴더 구조와 코드 작성 규칙을 정의합니다. 모든 코드는 이 규칙을 준수해야 하며, 새로운 기능을 추가하거나 기존 코드를 수정할 때 반드시 이 가이드를 참조합니다.

> 기준일: 2026-06-07. 현재 프로젝트는 Next.js `16.2.7` App Router를 사용하며, `src/` 없이 루트의 `app/`, `components/`, `hooks/`, `lib/`를 애플리케이션 코드 위치로 사용합니다.

---

## 1. 핵심 원칙

### 1.1 기능 응집 (Feature Cohesion)

하나의 기능에 관련된 코드는 한 곳에 모읍니다. 기능 단위로 응집도를 높이고, 기능 간 결합도는 낮춥니다.

### 1.2 단방향 의존성 (Unidirectional Dependency)

상위 레이어는 하위 레이어를 참조할 수 있지만, 하위 레이어는 상위 레이어를 참조할 수 없습니다.

```
route layer(pages/app) → features → shared layer(components/ui, hooks, lib, store, types, constants)
route layer(pages/app) → components/layout, components/landing, app/**/_components
```

- `pages`/`app` 같은 라우트 레이어는 화면 조립을 위해 모든 것을 참조 가능
- `features`는 다른 `features`를 참조 불가 (필요 시 라우트 레이어에서 조립)
- `features`는 `components/layout`, `components/landing`, `app/**/_components`를 참조하지 않음. 레이아웃과 route-specific 섹션은 라우트 레이어에서 적용
- `components/ui`는 어떤 도메인 로직도 알아서는 안 됨
- shared layer는 `features`, `pages`, `app`을 참조하지 않음

### 1.3 명시적 공개 인터페이스 (Public API)

외부 소비 경계가 있는 폴더는 `index.ts`를 통해 외부로 노출할 항목을 명시합니다. 내부 구현은 외부에서 직접 import하지 않습니다.

단, Public API는 외부 소비 경계에만 둡니다. `features/[feature]/index.ts`는 필수로 두고, feature 내부 하위 폴더의 `index.ts`는 import 편의가 명확할 때만 둡니다. 모든 폴더에 barrel을 만드는 것은 지양합니다.

---

## 2. 폴더 구조

```
app/                    # Next.js App Router 라우트 레이어
├── layout.tsx          # 루트 레이아웃. Next 규칙상 default export 사용
├── page.tsx            # 라우트 페이지. Next 규칙상 default export 사용
└── ...                 # route group, nested route, route handler, metadata 파일
components/             # 도메인 로직이 없거나 route 조립을 돕는 컴포넌트
├── ui/                 # shadcn/Base UI 기반 순수 UI 단일 파일 (button.tsx 등)
├── layout/             # 여러 라우트에서 공유하는 앱 셸/레이아웃 컴포넌트
└── landing/            # 현재 랜딩 페이지 섹션 컴포넌트
features/               # 비즈니스 기능 단위 묶음 (필요해질 때 생성)
└── [feature]/          # 예: auth, video, clip, billing
    ├── components/     # 해당 기능 전용 컴포넌트
    ├── hooks/          # 해당 기능 전용 훅
    ├── api/            # 브라우저에서 호출 가능한 API client/fetch wrapper
    ├── server/         # server-only 데이터 접근, 서버 유틸, Route Handler 보조 로직
    ├── actions/        # "use server" Server Function 공개 경계 (필요 시)
    ├── store/          # 해당 기능 내부에서만 쓰는 상태 (선택)
    ├── __tests__/      # 해당 기능 테스트 (선택)
    ├── mocks/          # 해당 기능 mock/fixture (선택)
    ├── types.ts        # 해당 기능의 타입 정의
    └── index.ts        # Public API
hooks/                  # 전역 공통 훅 (useDebounce, useMediaQuery 등)
lib/                    # 외부 라이브러리 설정 및 범용 유틸
store/                  # 전역 상태 관리 (필요 시)
types/                  # 전역 공통 타입 (필요 시)
constants/              # 전역 상수 (필요 시)
```

`src/`는 Next.js가 지원하는 선택 구조입니다. 이 프로젝트에서 `src/`로 이전하려면 `app/` 또는 `pages/`를 `src/app` 또는 `src/pages`로 함께 옮기고, `tsconfig.json`의 `@/*` alias를 `./src/*` 기준으로 바꿉니다. 루트 `app/` 또는 `pages/`가 존재하면 같은 라우터의 `src/app` 또는 `src/pages`는 무시될 수 있으므로 혼용하지 않습니다.

`pages/`는 Pages Router를 실제로 도입할 때만 생성합니다. 현재 프로젝트의 기본 라우터는 `app/`입니다.

---

## 3. 각 폴더 상세 규칙

### 3.1 `components/ui`

**목적:** 어디서든 재사용 가능한 순수 UI 컴포넌트

**규칙:**
- 도메인 지식이 없어야 합니다 (예: `UserCard` X, `Card` O)
- 비즈니스 API 호출, 도메인 store 접근, 앱 전역 상태 접근 금지
- 예외적으로 theme, direction, toast, overlay portal처럼 UI 인프라를 연결하는 context adapter는 허용합니다. 이 경우에도 도메인 데이터와 비즈니스 흐름을 알면 안 됩니다.
- props로만 동작하는 stateless 또는 self-contained 컴포넌트
- 디자인 시스템의 원자(atom) 단위 컴포넌트

**예시:**
```
components/ui/
├── button.tsx
├── input.tsx
├── dialog.tsx
└── spinner.tsx
```

**Public API 경계:**
- 현재 프로젝트의 shadcn/Base UI 컴포넌트는 `components/ui/button.tsx`처럼 단일 파일을 공개 경계로 사용합니다.
- `@/components/ui/button`처럼 파일 단위로 import합니다.
- `@/components/ui/Button/Button`처럼 별도 폴더와 barrel을 전제로 한 import 규칙을 이 프로젝트에 강제하지 않습니다.
- 복잡한 커스텀 UI 컴포넌트가 여러 파일로 커지면 그때만 `components/ui/[component]/index.ts` 공개 경계를 둘 수 있습니다.
- 프로젝트가 `@/components/ui` 루트 barrel을 명시적으로 채택했다면 모든 UI import를 그 방식으로 통일합니다. 현재 기본값은 단일 파일 import입니다.

**올바른 예:**
```tsx
// components/ui/button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  children: React.ReactNode;
}

export const Button = ({ variant = 'primary', onClick, children }: ButtonProps) => {
  return <button className={styles[variant]} onClick={onClick}>{children}</button>;
};
```

**잘못된 예:**
```tsx
// ❌ 도메인 로직이 포함됨
export const Button = () => {
  const user = useAuthStore(); // 전역 상태 접근 X
  return <button>{user.name}</button>;
};
```

### 3.2 `components/layout`

**목적:** 페이지 전반에서 사용되는 레이아웃 구조

**규칙:**
- Header, Footer, Sidebar, Layout wrapper 등
- 앱 셸과 레이아웃 구조만 담당
- 인증 세션, 테마처럼 앱 전역 상태는 참조할 수 있음
- `features`의 컴포넌트, 훅, API를 직접 import하지 않음
- feature별 메뉴나 액션이 필요하면 라우트 레이어에서 props 또는 children으로 주입
- 비즈니스 로직은 최소화

### 3.2.1 `components/landing` 및 route-specific 컴포넌트

**목적:** 현재 랜딩 페이지처럼 특정 라우트의 섹션을 구성하는 컴포넌트

**규칙:**
- `components/landing`은 `app/page.tsx`에서 조립되는 랜딩 섹션 컴포넌트를 둡니다.
- 한 라우트에서만 쓰이는 구현 세부 컴포넌트는 App Router의 private folder를 사용해 `app/_components` 또는 `app/(group)/_components`에 둘 수 있습니다.
- 여러 라우트에서 재사용되는 앱 셸은 `components/layout`으로 이동합니다.
- 명확한 비즈니스 기능으로 성장하면 `features/[feature]`로 승격합니다.
- `components/landing`에서 `features`를 직접 import해야 할 정도로 도메인 로직이 커지면 라우트 레이어에서 조립하거나 feature로 분리합니다.

### 3.3 `features/[feature]`

**목적:** 비즈니스 기능 단위로 응집된 코드 묶음

**규칙:**
- 하나의 feature는 하나의 비즈니스 도메인을 담당 (auth, todo, profile 등)
- **다른 feature를 직접 import하지 않습니다**
- feature 간 조합이 필요하면 라우트 레이어에서 조립
- 외부에 노출할 것만 `index.ts`에 export
- feature 내부 구조는 자유롭게 가져가되, 일관성 유지
- 해당 feature 내부에서만 쓰는 상태는 `store/` 또는 `hooks/`에 둘 수 있음
- 테스트, 스토리, mock/fixture는 해당 feature 가까이에 둠

**표준 구조:**
```
features/auth/
├── components/         # LoginForm, SignupForm 등
│   ├── LoginForm.tsx
│   └── SignupForm.tsx
├── hooks/              # useLogin, useSignup 등
│   ├── useLogin.ts
│   └── useSignup.ts
├── api/                # 클라이언트 API 호출 함수
│   ├── login.ts
│   └── signup.ts
├── server/             # server-only 데이터 접근/서버 유틸 (필요한 경우)
├── actions/            # "use server" Server Function 공개 경계 (필요한 경우)
├── store/              # feature 내부 상태 (필요한 경우)
├── __tests__/          # feature 테스트 (필요한 경우)
├── mocks/              # mock/fixture (필요한 경우)
├── types.ts            # 해당 feature의 타입
└── index.ts            # Public API
```

**컴포넌트 하위 폴더 분류:**

`features/[feature]/components`에 파일이 많아져 한 화면에서 역할이 잘 구분되지 않으면, 파일을 합쳐 줄이기보다 **함께 바뀌는 UI 흐름 단위**로 하위 폴더를 나눕니다. 특히 React Server Components와 Client Components가 섞인 feature에서는 파일 수보다 `"use client"` 경계를 낮게 유지하는 것이 우선입니다.

분류 기준:
- `components/` 안의 컴포넌트가 10개 안팎을 넘거나, 같은 접두사 파일이 4개 이상 반복되면 하위 폴더 분류를 검토합니다.
- 폴더명은 `layout`, `feed`, `detail`, `form`, `list`, `editor`처럼 화면 역할이 바로 드러나는 이름을 사용합니다. `shell`, `common`, `misc`처럼 의미가 넓은 이름은 피합니다.
- 하위 폴더는 파일 종류가 아니라 사용자 흐름이나 UI 영역 기준으로 나눕니다. 예: `detail/`에는 상세 view, 상세 skeleton, 상세 error/retry UI를 함께 둡니다.
- Server Component와 Client Component는 필요하면 같은 하위 폴더에 두되, `"use client"` 파일을 상위 wrapper로 끌어올려 서버 렌더링 가능한 view까지 client bundle에 묶지 않습니다.
- 하위 폴더마다 `index.ts` barrel을 만들지 않습니다. import 편의가 명확할 때만 한 단계 barrel을 허용하고, 기본은 직접 경로 import입니다.

예시:

```text
features/news/
├── components/
│   ├── layout/
│   │   ├── masthead.tsx
│   │   ├── news-footer.tsx
│   │   └── news-page-shell.tsx
│   ├── feed/
│   │   ├── news-feed.tsx
│   │   ├── news-feed-tabs.tsx
│   │   ├── news-item-card.tsx
│   │   ├── news-item-card-view.tsx
│   │   ├── news-item-card-link.tsx
│   │   └── news-item-card-skeleton.tsx
│   └── detail/
│       ├── news-item-detail-view.tsx
│       ├── news-item-detail-skeleton.tsx
│       ├── news-item-load-error.tsx
│       └── news-item-retry-actions.tsx
├── hooks/
├── api/
├── actions/
├── types.ts
├── client.ts
├── server.ts
└── index.ts
```

이 경우 외부 route는 `features/news/server`, `features/news/actions`, `features/news/client` 같은 공개 경계를 사용하고, feature 내부 컴포넌트끼리는 같은 하위 폴더 또는 feature 내부 상대 경로로 import합니다.

**Public API 예시:**
```ts
// features/auth/index.ts
export { LoginForm } from './components/LoginForm';
export { SignupForm } from './components/SignupForm';
export { useLogin } from './hooks/useLogin';
export type { User, LoginPayload } from './types';
// ⚠️ api 함수는 보통 외부에 노출하지 않음 (hooks를 통해서만 사용)
// ⚠️ server/ 내부 모듈은 server-only로 보고 클라이언트 컴포넌트에서 import하지 않음
```

라우트 레이어에서 feature의 server-only 로직이 필요하면 `features/[feature]/server/index.ts`를 별도 공개 경계로 둘 수 있습니다. 이 경로는 서버 컴포넌트, Route Handler, 서버 유틸에서만 import합니다.

`features/[feature]/server` 내부에서 DB, 비공개 환경 변수, 파일 시스템, 외부 secret을 다루는 모듈은 파일 상단에 `import 'server-only'`를 추가해 Client Component import를 빌드 시점에 막습니다.

Client Component에서 직접 실행할 수 있는 Server Function이 필요하면 `features/[feature]/actions/index.ts`처럼 파일 상단에 `"use server"`가 있는 전용 공개 경계를 둡니다. 이 action 파일은 입력 검증, 인증/인가, 직렬화 가능한 반환값을 책임집니다.

**사용 예시:**
```tsx
// app/login/page.tsx
import { LoginForm } from '@/features/auth'; // ✅ index.ts를 통한 import

// ❌ 내부 경로 직접 접근 금지
import { LoginForm } from '@/features/auth/components/LoginForm';
```

### 3.4 `hooks`

**목적:** 어떤 도메인에도 속하지 않는 범용 훅

**규칙:**
- 특정 feature에서만 쓰이는 훅은 해당 feature/hooks에 위치
- 2개 이상의 feature에서 공통으로 쓰일 때만 이곳에 위치
- 예: `useDebounce`, `useMediaQuery`, `useLocalStorage`, `useIntersectionObserver`

### 3.5 `lib`

**목적:** 외부 라이브러리 설정 및 인스턴스

**예시:**
```
lib/
├── axios.ts            # axios 인스턴스 + 인터셉터
├── queryClient.ts      # TanStack Query 클라이언트 설정
├── dayjs.ts            # dayjs 플러그인 설정
└── utils.ts            # 범용 유틸 함수 (cn, formatDate 등)
```

### 3.6 `pages` / `app`

**목적:** 라우트 단위로 화면을 구성

**규칙:**
- `features`에서 가져온 컴포넌트들을 조립
- 페이지 자체에는 비즈니스 로직을 최소화
- 현재 프로젝트는 Next.js App Router이므로 `app/` 디렉토리를 기본 라우트 레이어로 사용
- App Router의 `layout.tsx`, `page.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `route.ts`는 라우트 레이어로 간주
- route group `(group)`은 URL에 영향을 주지 않는 라우트 조직화에 사용
- private folder `_components`, `_lib`는 특정 route segment에 강하게 결합된 구현 세부 파일을 둘 때 사용 가능
- Server Component와 Client Component 경계를 명확히 하며, 클라이언트 전용 hook/store는 `'use client'` 컴포넌트 아래에서만 사용
- App Router의 page/layout은 기본적으로 Server Component입니다. `"use client"`는 상태, event handler, effect, 브라우저 API, custom hook이 필요한 진입점에만 둡니다.
- `"use client"` 파일이 import하거나 직접 렌더링하는 모듈은 client bundle에 포함되므로, 큰 server-renderable view를 불필요하게 client boundary 아래로 끌어올리지 않습니다.
- Server Action이나 Route Handler가 라우트에 강하게 결합되면 `app/`에 둠
- 여러 route에서 공유되는 feature 소유 Server Function은 `features/[feature]/actions`에 둠
- 특정 비즈니스 기능에 속한 server-only 데이터 접근/서버 유틸은 `features/[feature]/server`에 둠
- `features/[feature]/api`는 브라우저에서 호출 가능한 API client 또는 fetch wrapper를 기본 의미로 사용
- 서버 전용 모듈은 `server-only`를 사용하거나 파일명/폴더명으로 서버 전용임을 명확히 표시
- Client Component로 전달되는 props와 Server Function 반환값은 React가 직렬화할 수 있는 형태여야 함

**예시:**
```tsx
// app/todos/page.tsx
import { TodoList, TodoForm } from '@/features/todo';
import { Layout } from '@/components/layout';

export default function TodoPage() {
  return (
    <Layout>
      <TodoForm />
      <TodoList />
    </Layout>
  );
}
```

### 3.7 `store`

**목적:** 전역 상태 관리

**규칙:**
- 여러 feature에서 공유하는 앱 전역 상태만 이곳에 위치 (예: 로그인 세션, 테마)
- 특정 feature 내부에서만 쓰이는 상태는 해당 feature/hooks 또는 feature/store에 위치
- store는 책임 단위로 분리 (`sessionStore.ts`, `themeStore.ts`)
- 전역 store를 feature 간 의존성을 우회하는 통로로 사용하지 않음
- 인증 기능 자체의 API, 폼, mutation hook은 `features/auth`에 두고, 현재 로그인 세션처럼 앱 전체가 알아야 하는 상태만 `store/sessionStore.ts`에 둠

### 3.8 `types`

**목적:** 전역 공통 타입

**규칙:**
- API 공통 응답 타입, 공통 도메인 타입 등
- feature 내부에서만 쓰이는 타입은 해당 feature/types.ts에 위치
- 소유 feature가 명확한 타입은 전역 `types/`로 올리지 않음
- 2개 이상의 feature에서 실제로 공유될 때만 전역 타입으로 승격
- 전역 타입은 `types/api.ts`, `types/pagination.ts`처럼 책임이 드러나게 파일을 분리

### 3.9 `constants`

**목적:** 전역 상수

**예시:** API 엔드포인트, 라우트 경로, 매직 넘버

**규칙:**
- feature 내부에서만 쓰이는 상수는 해당 feature 내부에 둠
- 2개 이상의 feature 또는 라우트 레이어에서 공유할 때만 전역 `constants/`로 이동
- `constants/misc.ts`처럼 의미가 넓은 파일명은 지양

---

## 4. 의존성 규칙 (중요)

### 4.1 허용되는 import 방향

```
route layer(pages/app)
  ↓ import 가능
features (각 feature는 서로 독립)
  ↓ import 가능
components/ui, hooks, lib, store, types, constants

route layer(pages/app)
  ↓ import 가능
components/layout, components/landing, app/**/_components
```

`components/layout`은 라우트 레이어에서 사용하는 앱 셸입니다. `components/landing`과 `app/**/_components`는 특정 라우트 또는 섹션을 조립하는 컴포넌트입니다. `features` 내부에서 이들을 import하지 않습니다.

### 4.2 금지되는 import

| From → To                    | 금지 사유                          |
|------------------------------|------------------------------------|
| `features/A` → `features/B`  | feature 간 결합도 증가             |
| `components/ui` → `features` | UI는 도메인을 알면 안 됨           |
| `components/ui` → `store`    | UI는 전역 상태에 의존하면 안 됨    |
| `features/*` → `components/layout` | feature가 라우트 레이아웃에 결합됨 |
| `features/*` → `components/landing` | feature가 특정 라우트 섹션에 결합됨 |
| `features/*` → `app/**/_components` | feature가 라우트 구현 세부에 결합됨 |
| `lib` → `features`           | 라이브러리 설정에 도메인 침투 금지 |
| `hooks` → `features`         | 공통 훅에 특정 도메인 침투 금지    |

### 4.3 feature 간 통신이 필요한 경우

**상황:** `todo` feature에서 현재 로그인한 사용자 정보가 필요

**해결책 1 - props로 주입 (권장):**
```tsx
// app/todos/page.tsx
import { useUser } from '@/features/auth';
import { TodoList } from '@/features/todo';

export default function TodoPage() {
  const user = useUser();
  return <TodoList userId={user.id} />;
}
```

**해결책 2 - 앱 전역 store 활용 (앱 전역 상태일 때만 허용):**
```tsx
// features/todo/components/TodoList.tsx
import { useSessionStore } from '@/store/sessionStore'; // ✅ 앱 전역 세션 상태 사용
```

**금지:**
```tsx
// ❌ features/todo가 features/auth를 직접 참조
import { useUser } from '@/features/auth';
```

---

## 5. 네이밍 규칙

### 5.1 파일명

| 종류              | 규칙                  | 예시                  |
|-------------------|-----------------------|-----------------------|
| feature/app 컴포넌트 | PascalCase         | `LoginForm.tsx`       |
| shadcn/Base UI primitive | registry 생성 규칙 유지, 보통 lowercase 또는 kebab-case | `button.tsx`, `input-otp.tsx` |
| 훅                | camelCase, `use` prefix | `useLogin.ts`       |
| API 함수          | camelCase             | `login.ts`            |
| 타입 정의 파일    | camelCase             | `types.ts`            |
| 유틸 함수         | camelCase             | `formatDate.ts`       |
| 상수              | camelCase 파일명, UPPER_SNAKE 내용 | `routes.ts` |

### 5.2 폴더명

- `components/`, `hooks/`, `api/` 등 표준 폴더명은 복수형 사용
- feature 폴더명은 단수형 사용 (`auth`, `todo`, `profile`)

### 5.3 export 규칙

- **Named export 우선 사용** (default export 지양)
- 이유: 자동 완성 정확도, 리팩토링 용이성
- 예외: Next.js App Router의 `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx` 등 file convention 컴포넌트는 framework 규칙에 맞춰 default export를 사용합니다.

```ts
// ✅ Named export
export const Button = () => { ... };

// ❌ 일반 컴포넌트의 Default export (지양)
export default Button;
```

```tsx
// ✅ Next.js route file convention
// app/page.tsx
export default function Page() {
  return <main />;
}
```

---

## 6. import 경로 규칙

### 6.1 절대 경로 사용

`@/` alias를 사용하여 절대 경로로 import합니다.

```tsx
// ✅ 권장
import { Button } from '@/components/ui/button';
import { useLogin } from '@/features/auth';

// ❌ 지양 (상대 경로 깊어짐)
import { Button } from '../../../components/ui/button';
```

**허용되는 공개 경로 예시:**
```tsx
// ✅ feature는 feature 루트 Public API를 사용
import { LoginForm } from '@/features/auth';

// ✅ 현재 프로젝트의 UI는 shadcn/Base UI 단일 파일 Public API를 사용
import { Button } from '@/components/ui/button';

// ✅ layout은 라우트 레이어에서만 사용
// app/todos/page.tsx
import { Layout } from '@/components/layout';

// ✅ 서버 파일에서는 feature server Public API 사용 가능
// app/api/users/route.ts 또는 app/users/actions.ts
import { createUserOnServer } from '@/features/auth/server';

// ✅ Client Component에서 호출할 Server Function은 "use server" 전용 공개 경계 사용 가능
import { createUserAction } from '@/features/auth/actions';
```

**금지되는 deep import 예시:**
```tsx
// ❌ feature 내부 구현 직접 접근
import { LoginForm } from '@/features/auth/components/LoginForm';

// ❌ UI 구현 파일 직접 접근
import { Button } from '@/components/ui/Button/Button';

// ❌ feature 내부에서 layout 사용
// features/todo/components/TodoList.tsx
import { Layout } from '@/components/layout';

// ❌ server 내부 구현 직접 접근
import { createUserOnServer } from '@/features/auth/server/createUserOnServer';

// ❌ action 내부 구현 직접 접근
import { createUserAction } from '@/features/auth/actions/createUserAction';

// ❌ Client Component에서 server-only 모듈 import
import { getUserFromDb } from '@/features/auth/server';
```

**예외:** 같은 폴더 내 또는 1단계 하위 import는 상대 경로 허용

```tsx
// features/auth/components/LoginForm.tsx
import { useLogin } from '../hooks/useLogin'; // ✅ 같은 feature 내부
```

### 6.2 import 순서

```tsx
// 1. 외부 라이브러리
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. 내부 절대 경로 (alias)
import { Button } from '@/components/ui/button';
import { useSessionStore } from '@/store/sessionStore';

// 3. 같은 feature 내부 (상대 경로)
import { useLogin } from '../hooks/useLogin';

// 4. 스타일, 타입
import type { LoginPayload } from './types';
import styles from './LoginForm.module.css';
```

---

## 7. 새로운 기능을 추가할 때 의사결정 흐름

```
새 기능을 어디에 둘 것인가?

│
├─ 비즈니스 도메인이 있는가? (예: 로그인, 게시글, 프로필)
│  └─ YES → features/[domain]에 추가
│
├─ 특정 route segment에서만 쓰는 UI/유틸인가?
│  └─ YES → app/**/_components 또는 app/**/_lib에 추가
│
├─ 현재 랜딩 페이지 섹션인가?
│  └─ YES → components/landing에 추가
│
├─ 어떤 도메인에도 속하지 않는 순수 UI인가?
│  └─ YES → components/ui에 추가
│
├─ 라이브러리 설정인가? (axios 인터셉터 등)
│  └─ YES → lib에 추가
│
├─ 2개 이상 feature에서 쓰는 공통 훅인가?
│  └─ YES → hooks에 추가
│
└─ 전역 상태인가? (테마, 로그인 세션, 앱 설정 등)
   └─ YES → store에 추가
```

---

## 8. 안티패턴 (피해야 할 패턴)

### 8.1 God Component

한 컴포넌트가 너무 많은 책임을 가지는 경우. 200줄은 참고 기준이며, 아래 상황이면 줄 수와 관계없이 분리를 검토합니다.

- API 호출, 상태 관리, 복잡한 조건부 렌더링, UI 표현이 한 파일에 과도하게 섞임
- 한 컴포넌트가 여러 독립적인 사용자 흐름을 동시에 처리함
- 테스트하기 위해 너무 많은 mock이나 provider가 필요함

### 8.2 Feature 간 직접 의존

```tsx
// ❌ features/todo가 features/auth 내부를 직접 참조
import { loginApi } from '@/features/auth/api/login';
```

### 8.3 컴포넌트 내부 직접 import

```tsx
// ❌ index.ts를 우회한 깊은 경로 import
import { LoginForm } from '@/features/auth/components/LoginForm/LoginForm';

// ✅ Public API 사용
import { LoginForm } from '@/features/auth';
```

### 8.4 UI 컴포넌트의 도메인 의존

```tsx
// ❌ UI 컴포넌트가 store에 직접 접근
// components/ui/button.tsx
import { useAuthStore } from '@/store/authStore'; // 금지
```

### 8.5 API 호출 위치 혼란

비즈니스 기능에 속한 API 호출은 `features/[feature]/api`에 위치합니다. 컴포넌트 내부에서 직접 fetch/axios를 호출하지 않습니다.

```tsx
// ❌ 컴포넌트에서 직접 호출
const LoginForm = () => {
  const handleSubmit = async () => {
    await axios.post('/api/login', ...); // 금지
  };
};

// ✅ api 함수로 추상화 후 hook으로 감싸기
const LoginForm = () => {
  const { mutate } = useLogin(); // hook 사용
};
```

### 8.6 Client/Server 경계 혼합

server-only 데이터 접근 로직을 클라이언트 컴포넌트나 클라이언트 hook에서 직접 import하지 않습니다.

```tsx
// ❌ 클라이언트 컴포넌트에서 server-only 모듈 직접 import
'use client';

import { getUserFromDb } from '@/features/auth/server';

// ✅ browser API client 또는 hook을 통해 호출
import { useSignup } from '@/features/auth';
```

Next.js Server Function은 예외입니다. Client Component에서 호출해야 하는 서버 작업은 파일 상단에 `"use server"`가 있는 전용 action 공개 경계를 통해 import합니다.

```tsx
// features/auth/actions/index.ts
'use server';

export async function signupAction(formData: FormData) {
  // 입력 검증, 인증/인가, 직렬화 가능한 반환값을 보장
}

// components 또는 feature client component
'use client';

import { signupAction } from '@/features/auth/actions';
```

### 8.7 전역 store를 통한 feature 결합 숨기기

feature 간 직접 import를 피하기 위해 전역 store에 feature 전용 데이터를 올리는 것은 금지합니다. 전역 store는 로그인 세션, 테마, 앱 설정처럼 앱 전체가 공유하는 상태만 다룹니다.

```tsx
// ❌ todo 전용 필터 상태를 전역 store에 올림
import { useTodoFilterStore } from '@/store/todoFilterStore';

// ✅ todo feature 내부에 둠
import { useTodoFilterStore } from '@/features/todo/store/todoFilterStore';
```

---

## 9. 테스트, 스토리, mock 위치

**규칙:**
- feature 동작을 검증하는 테스트는 해당 feature 내부에 둠
- 공통 UI 컴포넌트의 Storybook 파일은 해당 UI 컴포넌트 옆에 둠
- 여러 feature에서 재사용하는 test utility만 전역 테스트 유틸 폴더에 둠
- mock/fixture는 기본적으로 사용하는 feature 가까이에 두고, 여러 feature가 공유할 때만 공통 위치로 이동

**예시:**
```
features/todo/
├── components/
│   ├── TodoList.tsx
│   └── TodoList.test.tsx
├── hooks/
│   └── useTodos.test.ts
├── mocks/
│   └── todoFixtures.ts
└── index.ts

components/ui/
├── button.tsx
└── button.stories.tsx
```

---

## 10. 규칙 강제

문서 규칙은 가능한 한 도구로 강제합니다.

- ESLint `no-restricted-imports`로 feature 간 직접 import와 deep import를 금지
- `eslint-plugin-boundaries` 또는 `dependency-cruiser`로 레이어 의존성 검증
- TypeScript path alias(`@/`)를 `tsconfig.json`과 bundler 설정에 함께 정의
- PR 체크 또는 CI에서 lint/test를 실행하여 규칙 위반을 조기에 발견

**ESLint 예시:**
```js
// eslint.config.js 예시. 실제 glob은 프로젝트 구조에 맞게 조정합니다.
const appFiles = [
  'app/**/*.{ts,tsx}',
  'components/**/*.{ts,tsx}',
  'features/**/*.{ts,tsx}',
  'hooks/**/*.{ts,tsx}',
  'lib/**/*.{ts,tsx}',
  'store/**/*.{ts,tsx}',
  'types/**/*.{ts,tsx}',
  'constants/**/*.{ts,tsx}',
];

export default [
  {
    files: appFiles,
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/features/*/components/*',
                '@/features/*/components',
                '@/features/*/hooks/*',
                '@/features/*/hooks',
                '@/features/*/api/*',
                '@/features/*/api',
                '@/features/*/store/*',
                '@/features/*/store',
                '@/features/*/server/*',
                '@/features/*/actions/*',
              ],
              message: 'feature 외부에서는 features/[feature], 서버 파일의 features/[feature]/server, 또는 "use server" 전용 features/[feature]/actions Public API만 import합니다.',
            },
            {
              group: ['@/components/ui/*/*'],
              message: '현재 UI 컴포넌트는 @/components/ui/button처럼 단일 파일 Public API를 통해 import합니다. 다중 파일 UI만 별도 index.ts 경계를 둡니다.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*', '@/features/*/*'],
              message: 'feature 내부에서 다른 feature를 직접 import하지 않습니다.',
            },
            {
              group: ['@/components/ui/*/*'],
              message: '현재 UI 컴포넌트는 @/components/ui/button처럼 단일 파일 Public API를 통해 import합니다.',
            },
            {
              group: ['@/components/layout', '@/components/layout/*'],
              message: 'layout은 라우트 레이어에서만 적용합니다.',
            },
            {
              group: [
                '@/components/landing',
                '@/components/landing/*',
                '@/app/**/_components/**',
                '@/app/**/_lib/**',
              ],
              message: 'route-specific 컴포넌트와 유틸은 feature 내부에서 import하지 않습니다. 라우트 레이어에서 조립합니다.',
            },
          ],
        },
      ],
    },
  },
];
```

---

## 11. 체크리스트

새로운 PR을 올리기 전 다음을 확인합니다.

- [ ] 새로 만든 코드가 올바른 폴더에 위치하는가?
- [ ] feature 간 직접 import가 없는가?
- [ ] feature 내부에서 `components/layout`을 import하지 않았는가?
- [ ] feature 내부에서 `components/landing` 또는 `app/**/_components`를 import하지 않았는가?
- [ ] `components/ui`에 도메인 로직이 들어가지 않았는가?
- [ ] 외부 노출이 필요한 항목이 `index.ts`에 정리되었는가?
- [ ] 불필요한 barrel 파일을 만들지 않았는가?
- [ ] shadcn/Base UI 컴포넌트는 현재 프로젝트 규칙대로 `@/components/ui/button` 같은 단일 파일 공개 경계를 사용하는가?
- [ ] feature 컴포넌트가 많아졌다면 파일 병합이 아니라 역할별 하위 폴더 분류를 먼저 검토했는가?
- [ ] 절대 경로(`@/`)를 사용했는가?
- [ ] 일반 컴포넌트는 Named export를 사용하고, Next route file convention은 default export 예외를 따르는가?
- [ ] 비즈니스 기능 API 호출은 `features/[feature]/api`에 위치하는가?
- [ ] server-only 로직이 클라이언트 컴포넌트나 hook에 직접 import되지 않았는가?
- [ ] secret, DB, 파일 시스템을 다루는 server-only 모듈에 `import 'server-only'`가 있는가?
- [ ] Client Component에서 호출하는 Server Function은 `"use server"` 전용 `actions` 공개 경계를 사용하는가?
- [ ] 전역 store가 feature 간 의존성 우회 수단으로 쓰이지 않았는가?
- [ ] 전역 `types/`, `constants/`에 feature 전용 타입이나 상수가 들어가지 않았는가?
- [ ] 테스트, 스토리, mock/fixture가 사용하는 코드 가까이에 위치하는가?
- [ ] 200줄 넘는 컴포넌트는 분리 검토했는가?

---

## 12. 예시: 전체 구조 한눈에 보기

```
.
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── clips/
│   │   │   └── page.tsx
│   │   └── _components/
│   │       └── DashboardShell.tsx
│   └── api/
│       └── clips/
│           └── route.ts
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   └── spinner.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Layout.tsx
│   └── landing/
│       ├── hero.tsx
│       ├── features.tsx
│       └── pricing.tsx
├── features/
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   └── SignupForm.tsx
│   │   ├── hooks/
│   │   │   ├── useLogin.ts
│   │   │   └── useSignup.ts
│   │   ├── api/
│   │   │   ├── login.ts
│   │   │   └── signup.ts
│   │   ├── server/
│   │   │   └── createUserOnServer.ts
│   │   ├── actions/
│   │   │   └── signupAction.ts
│   │   ├── __tests__/
│   │   │   └── LoginForm.test.tsx
│   │   ├── types.ts
│   │   └── index.ts
│   └── todo/
│       ├── components/
│       │   ├── TodoList.tsx
│       │   └── TodoForm.tsx
│       ├── hooks/
│       │   ├── useTodos.ts
│       │   └── useCreateTodo.ts
│       ├── api/
│       │   ├── getTodos.ts
│       │   └── createTodo.ts
│       ├── store/
│       │   └── todoFilterStore.ts
│       ├── mocks/
│       │   └── todoFixtures.ts
│       ├── types.ts
│       └── index.ts
├── hooks/
│   ├── useDebounce.ts
│   └── useMediaQuery.ts
├── lib/
│   ├── api-client.ts
│   ├── env.ts
│   └── utils.ts
├── store/
│   ├── sessionStore.ts
│   └── themeStore.ts
├── types/
│   └── api.ts
└── constants/
    └── routes.ts
```

---

이 문서는 프로젝트의 일관성과 유지보수성을 위한 약속입니다. 규칙을 변경해야 할 합리적인 이유가 있다면 팀과 논의 후 이 문서를 먼저 업데이트한 뒤 코드에 반영합니다.

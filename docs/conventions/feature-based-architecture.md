# Architecture Guide

이 문서는 프로젝트의 폴더 구조와 코드 작성 규칙을 정의합니다. 모든 코드는 이 규칙을 준수해야 하며, 새로운 기능을 추가하거나 기존 코드를 수정할 때 반드시 이 가이드를 참조합니다.

> 기준일: 2026-06-15. 현재 프로젝트는 Next.js `16.2.7` App Router를 사용하며, `src/` 없이 루트의 `app/`, `components/`, `hooks/`, `lib/`를 애플리케이션 코드 위치로 사용합니다.

> 관련 문서: 추가 레이어가 필요한 대규모 아키텍처는 `fsd-architecture-guidelines.md`를 참조합니다. 이 문서의 "feature 간 직접 import 금지"는 규모와 무관하게 적용됩니다.

> 적용 범위: 이 문서의 폴더·경로 규칙은 현재 프로젝트(루트 `app/`, shadcn 단일 파일 UI 등) 기준입니다. 다른 프로젝트에는 §1 핵심 원칙(기능 응집·단방향 의존·Public API)만 이식하고 구체 경로는 각 프로젝트에 맞게 재정의합니다. 현재 프로젝트 안에서는 모든 규칙을 그대로 준수합니다.

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
- `components/layout`과 `components/landing`은 `features` 또는 `app` route 구현을 직접 참조하지 않음. feature 조합은 라우트 레이어에서 수행하고 props 또는 children으로 주입
- `components/ui`는 어떤 도메인 로직도 알아서는 안 됨
- shared layer는 `features`, `pages`, `app`을 참조하지 않음

위는 원칙과 허용 방향이 우선 이해 대상입니다. 구체적 **금지 방향 목록은 §4.2 표**를 기준으로 합니다.

### 1.3 명시적 공개 인터페이스 (Public API)

외부 소비 경계가 있는 폴더는 `index.ts`를 통해 외부로 노출할 항목을 명시합니다. 내부 구현은 외부에서 직접 import하지 않습니다.

단, Public API는 외부 소비 경계에만 둡니다. `features/[feature]/index.ts`는 필수로 두고, feature 내부 하위 폴더의 `index.ts`는 import 편의가 명확할 때만 둡니다. 모든 폴더에 barrel을 만드는 것은 지양합니다.

이 Public API 규칙은 **deep import 금지의 핵심 기준**입니다. §6.1의 deep import 예시, §8.3, §10 `publicBoundaryRestrictions`, §11의 `index.ts`·barrel 항목이 이를 구체화하며, 경계 규칙을 바꿀 때는 §1.3을 먼저 고치고 나머지를 맞춥니다.

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
- `app/**` route 구현 세부를 직접 import하지 않음
- feature별 메뉴나 액션이 필요하면 라우트 레이어에서 props 또는 children으로 주입
- 비즈니스 로직은 최소화

### 3.2.1 `components/landing` 및 route-specific 컴포넌트

**목적:** 현재 랜딩 페이지처럼 특정 라우트의 섹션을 구성하는 컴포넌트

**규칙:**
- `components/landing`은 `app/page.tsx`에서 조립되는 랜딩 섹션 컴포넌트를 둡니다.
- 한 라우트에서만 쓰이는 구현 세부 컴포넌트는 App Router의 private folder를 사용해 `app/_components` 또는 `app/(group)/_components`에 둘 수 있습니다.
- 여러 라우트에서 재사용되는 앱 셸은 `components/layout`으로 이동합니다.
- 명확한 비즈니스 기능으로 성장하면 `features/[feature]`로 승격합니다.
- `features`의 컴포넌트, 훅, API를 직접 import하지 않습니다.
- `app/**` route 구현 세부를 직접 import하지 않습니다.
- feature CTA, 폼, 상태가 필요하면 라우트 레이어에서 props 또는 children으로 주입합니다.
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
│   ├── login-form.tsx
│   └── signup-form.tsx
├── hooks/              # useLogin, useSignup 등
│   ├── use-login.ts
│   └── use-signup.ts
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
- Server Component와 Client Component는 필요하면 같은 하위 폴더에 둡니다. 단, `"use client"`는 상호작용(상태, 이벤트, effect)이 필요한 최소 단위 컴포넌트에만 선언하고, 서버 렌더링 가능한 큰 view는 그 client 컴포넌트가 직접 import하지 않도록 상위 서버 컴포넌트에서 `children`/props로 주입해 client bundle에 포함되지 않게 합니다.
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
├── types.ts
├── server/
│   └── index.ts
├── actions/
│   └── index.ts
└── index.ts
```

이 경우 외부 route는 client-safe 항목은 `features/news`, 서버 전용 항목은 `features/news/server`, Server Function은 `features/news/actions` 공개 경계를 사용합니다. feature 내부 컴포넌트끼리는 같은 하위 폴더 또는 feature 내부 상대 경로로 import합니다.

**Public API 예시:**
```ts
// features/auth/index.ts
export { LoginForm } from './components/login-form';
export { SignupForm } from './components/signup-form';
export { useLogin } from './hooks/use-login';
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
import { LoginForm } from '@/features/auth/components/login-form';
```

### 3.4 `hooks`

**목적:** 어떤 도메인에도 속하지 않는 범용 훅

**규칙:**
- 특정 feature에서만 쓰이는 훅은 해당 feature/hooks에 위치
- 소유 feature가 없고 앱 전체가 공유해야 하는 훅만 이곳에 위치
- 예: `useDebounce`, `useMediaQuery`, `useLocalStorage`, `useIntersectionObserver`

### 3.5 `lib`

**목적:** 외부 라이브러리 설정 및 인스턴스

**규칙:**
- 도메인 지식이 없는 외부 라이브러리 설정과 순수 유틸만 둠
- 특정 비즈니스 의미가 들어간 유틸은 `features/[feature]` 내부에 둠
- `features`, `app`, `components/layout`, `components/landing`을 import하지 않음

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
- store는 책임 단위로 분리 (`session-store.ts`, `theme-store.ts`)
- 전역 store를 feature 간 의존성을 우회하는 통로로 사용하지 않음
- 인증 기능 자체의 API, 폼, mutation hook은 `features/auth`에 두고, 현재 로그인 세션처럼 앱 전체가 알아야 하는 상태만 `store/session-store.ts`에 둠

### 3.8 `types`

**목적:** 전역 공통 타입

**규칙:**
- API 공통 응답, pagination, locale처럼 소유 feature가 없는 타입만 둠
- feature 내부에서만 쓰이는 타입은 해당 feature/types.ts에 위치
- 소유 feature가 명확한 타입은 전역 `types/`로 올리지 않음
- 여러 feature가 실제로 공유하지만 소유 feature가 불분명한 핵심 계약만 전역 타입으로 승격
- 소유 feature가 명확해지는 순간 해당 타입은 `features/[feature]/types.ts`로 이동
- 전역 타입은 `types/api.ts`, `types/pagination.ts`처럼 책임이 드러나게 파일을 분리

### 3.9 `constants`

**목적:** 전역 상수

**예시:** API 엔드포인트, 라우트 경로, 매직 넘버

**규칙:**
- feature 내부에서만 쓰이는 상수는 해당 feature 내부에 둠
- 소유 feature가 없고 여러 feature 또는 라우트 레이어에서 함께 쓰는 상수만 전역 `constants/`로 이동
- `constants/misc.ts`처럼 의미가 넓은 파일명은 지양

### 3.10 Shared layer 승격 기준

shared layer로 올리는 기준은 "여러 파일에서 사용한다"가 아니라 "소유 feature가 없고 앱 전체가 공유해야 한다"입니다.

- `lib/`에는 도메인 지식이 없는 외부 라이브러리 설정과 순수 유틸만 둡니다.
- 특정 비즈니스 의미가 들어간 유틸은 `features/[feature]` 내부에 둡니다.
- `types/`에는 API 공통 응답, pagination, locale처럼 소유 feature가 없는 타입만 둡니다.
- 소유 feature가 명확한 타입은 전역 `types/`로 올리지 않습니다.
- 여러 feature가 실제로 공유하지만 소유 feature가 불분명한 핵심 계약은 `types/[domain].ts`처럼 책임이 드러나는 파일에 둡니다.
- 소유 feature가 명확해지는 순간 해당 타입은 `features/[feature]/types.ts`로 이동합니다.
- `constants/`에는 여러 feature와 route layer가 함께 쓰는 전역 상수만 둡니다.
- `store/`는 로그인 세션, 테마, 앱 설정처럼 앱 전체 상태만 허용합니다.
- 전역 store는 feature 간 의존성을 우회하는 통로로 사용할 수 없습니다.

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

`components/layout`은 라우트 레이어에서 사용하는 앱 셸입니다. `components/landing`과 `app/**/_components`는 특정 라우트 또는 섹션을 구성하는 컴포넌트입니다. feature 조합은 route layer에서 수행하고, `features`와 `components/layout`/`components/landing`이 서로 직접 결합하지 않도록 props 또는 children으로 필요한 요소를 주입합니다.

### 4.2 금지되는 import

이 표는 **레이어 금지 방향의 핵심 기준**(사람이 읽는 기준)입니다. §10 ESLint는 이를 코드로 인코딩하며, 도구 특성상 표에 없는 세부 글롭(예: `ui → app`, `shared → layout`)을 더 가질 수 있습니다 — **§10을 이 표 크기로 줄이지 않습니다.** 레이어 방향을 새로 정하거나 바꿀 때는 이 표를 먼저 고치고 §10·§11에 반영합니다. (허용 방향은 §4.1, Public API 경계는 §1.3을 기준으로 함)

| From → To                    | 금지 사유                          |
|------------------------------|------------------------------------|
| `features/A` → `features/B`  | feature 간 결합도 증가             |
| `components/ui` → `features` | UI는 도메인을 알면 안 됨           |
| `components/ui` → `store`    | UI는 전역 상태에 의존하면 안 됨    |
| `features/*` → `components/layout` | feature가 라우트 레이아웃에 결합됨 |
| `features/*` → `components/landing` | feature가 특정 라우트 섹션에 결합됨 |
| `features/*` → `app/**/_components` | feature가 라우트 구현 세부에 결합됨 |
| `components/layout` → `features` | 앱 셸이 특정 비즈니스 기능에 결합됨 |
| `components/layout` → `app` | 공통 레이아웃이 route 구현 세부에 결합됨 |
| `components/landing` → `features` | 랜딩 섹션이 기능 조합 책임을 가짐 |
| `components/landing` → `app` | 랜딩 컴포넌트가 route 구현 세부에 결합됨 |
| `lib` → `features`           | 라이브러리 설정에 도메인 침투 금지 |
| `hooks` → `features`         | 공통 훅에 특정 도메인 침투 금지    |
| `store` / `types` / `constants` → `features` | shared layer가 feature에 역방향 의존 |

### 4.3 feature 간 통신이 필요한 경우

**상황:** `todo` feature에서 현재 로그인한 사용자 정보가 필요

**해결책 1 - props로 주입 (권장):**
```tsx
// app/todos/page.tsx (Server Component)
import { getCurrentUser } from '@/features/auth/server';
import { TodoList } from '@/features/todo';

export default async function TodoPage() {
  const user = await getCurrentUser();
  return <TodoList userId={user.id} />;
}
```

**해결책 2 - 앱 전역 store 활용 (앱 전역 상태일 때만 허용):**
```tsx
// features/todo/components/todo-list.tsx
'use client'; // 전역 store 훅을 쓰므로 Client Component
import { useSessionStore } from '@/store/session-store'; // ✅ 앱 전역 세션 상태 사용
```

**해결책 3 - route-specific 조립 컴포넌트 사용:**
```tsx
// app/todos/_components/todo-page-content.tsx
import { TodoList } from '@/features/todo';
import { UserSummary } from '@/features/auth';

export function TodoPageContent() {
  return (
    <>
      <UserSummary />
      <TodoList />
    </>
  );
}
```

**금지:**
```tsx
// ❌ features/todo가 features/auth를 직접 참조
import { useUser } from '@/features/auth';
```

### 4.4 feature 조합 판단 기준

- 단순 데이터 전달이면 route layer에서 props로 주입합니다.
- 앱 전체가 공유해야 하는 상태이면 전역 `store/`에 둡니다.
- 특정 화면에서만 반복되는 조합이면 `app/**/_components`에 route-specific 조립 컴포넌트를 둡니다.
- 서버에서 여러 feature의 데이터를 조합해야 하면 Server Component, Route Handler, Server Function 같은 route layer/server 경계에서 조합합니다.
- 두 feature가 항상 함께 바뀌고 독립적으로 배포/테스트하기 어렵다면 하나의 feature로 합칠지 검토합니다.
- 조합 코드가 여러 route에서 반복되고 명확한 비즈니스 흐름을 형성하면 새 feature로 승격합니다.

---

## 5. 네이밍 규칙

상세 네이밍 규칙의 기준은 `docs/conventions/naming-conventions.md`입니다. 이 문서에서는 아키텍처 판단에 필요한 요약만 다루며, 두 문서가 충돌하면 `naming-conventions.md`를 우선합니다.

### 5.1 파일명

| 종류              | 규칙                  | 예시                  |
|-------------------|-----------------------|-----------------------|
| feature/app 컴포넌트 파일 | kebab-case | `login-form.tsx` |
| shadcn/Base UI primitive | registry 생성 규칙 유지, 보통 lowercase 또는 kebab-case | `button.tsx`, `input-otp.tsx` |
| 훅 파일 | kebab-case, export 함수는 `use` prefix | `use-login.ts` |
| API 함수 파일 | kebab-case | `get-project-status.ts` |
| 타입 정의 파일 | lowercase 또는 kebab-case | `types.ts`, `caption-segment.ts` |
| 유틸 함수 파일 | kebab-case | `format-date.ts` |
| 상수 파일 | kebab-case, 원시값 상수는 UPPER_SNAKE_CASE | `routes.ts`, `project-limits.ts` |
| 컴포넌트/타입 식별자 | PascalCase | `LoginForm`, `ProjectStatus` |

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
import { LoginForm } from '@/features/auth/components/login-form';

// ❌ UI 구현 파일 직접 접근
import { Button } from '@/components/ui/Button/Button';

// ❌ feature 내부에서 layout 사용
// features/todo/components/todo-list.tsx
import { Layout } from '@/components/layout';

// ❌ server 내부 구현 직접 접근
import { createUserOnServer } from '@/features/auth/server/create-user-on-server';

// ❌ action 내부 구현 직접 접근
import { createUserAction } from '@/features/auth/actions/create-user-action';

// ❌ Client Component에서 server-only 모듈 import
import { getUserFromDb } from '@/features/auth/server';
```

**예외:** 같은 폴더 내 또는 1단계 하위 import는 상대 경로 허용

```tsx
// features/auth/components/login-form.tsx
import { useLogin } from '../hooks/use-login'; // ✅ 같은 feature 내부
```

### 6.2 import 순서

```tsx
// 1. 외부 라이브러리
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. 내부 절대 경로 (alias)
import { Button } from '@/components/ui/button';
import { useSessionStore } from '@/store/session-store';

// 3. 같은 feature 내부 (상대 경로)
import { useLogin } from '../hooks/use-login';

// 4. 스타일, 타입
import type { LoginPayload } from './types';
import styles from './login-form.module.css';
```

---

## 7. 새로운 기능을 추가할 때 의사결정 흐름

```
새 기능을 어디에 둘 것인가?

│
├─ 비즈니스 도메인이 있는가? (예: 로그인, 게시글, 프로필)
│  └─ YES → features/[domain]에 추가
│        (그 안에서: client API=api/, server-only 데이터 접근=server/,
│         client가 호출하는 Server Function=actions/)
│
├─ 현재 랜딩 페이지 섹션인가?
│  └─ YES → components/landing에 추가
│
├─ 특정 route segment에서만 쓰는 UI/유틸인가? (랜딩 외)
│  └─ YES → app/**/_components 또는 app/**/_lib에 추가
│
├─ 여러 라우트가 공유하는 앱 셸/레이아웃인가? (Header, Footer, Sidebar)
│  └─ YES → components/layout에 추가
│
├─ 어떤 도메인에도 속하지 않는 순수 UI인가?
│  └─ YES → components/ui에 추가
│
├─ 라이브러리 설정인가? (axios 인터셉터, i18n 설정, analytics 초기화 등)
│  └─ YES → lib에 추가
│
├─ 2개 이상 feature에서 쓰는 공통 훅인가?
│  └─ YES → hooks에 추가
│
├─ 소유 feature가 없고 여러 feature가 공유하는 전역 타입인가?
│  └─ YES → types에 추가
│
├─ 소유 feature가 없고 여러 feature/라우트가 공유하는 전역 상수인가?
│  └─ YES → constants에 추가
│
└─ 전역 상태인가? (테마, 로그인 세션, 앱 설정 등)
   └─ YES → store에 추가
```

횡단 관심사(i18n, analytics, error tracking, feature flag)는 도메인이 없으면 위 `lib`/`hooks` 분기를, 특정 기능 전용이면 첫 분기(`features/[domain]`)를 따릅니다.

### 7.1 feature 승격 기준

- `app/**/_components`의 코드가 여러 route에서 재사용되면 `features/[feature]` 또는 `components/layout` 승격을 검토합니다.
- `components/landing`에 API 호출, mutation, 도메인 상태, 인증/인가 판단이 들어가면 feature로 이동합니다.
- 같은 비즈니스 용어가 컴포넌트, hook, API, type 파일에 반복되면 feature 후보로 봅니다.
- 특정 기능에 `components/`, `hooks/`, `api/`, `types.ts`가 함께 필요해지면 feature로 묶습니다.
- 순수 UI는 `components/ui`에 남기고, 비즈니스 의미가 붙은 UI는 feature 내부로 둡니다.

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
import { LoginForm } from '@/features/auth/components/login-form/login-form';

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

#### server/client 경계 검증 기준

- DB, secret, 파일 시스템, 비공개 외부 API를 다루는 모듈은 `features/[feature]/server`에 둡니다.
- `features/[feature]/server/**` 모듈은 파일 상단에 `import 'server-only'`를 둡니다.
- Client Component와 client hook은 `features/[feature]/server`를 import하지 않습니다.
- Client Component에서 호출할 서버 작업은 `"use server"`가 있는 `features/[feature]/actions` 공개 경계를 사용합니다.
- Server Function의 인자와 반환값은 React가 직렬화할 수 있는 형태로 제한합니다.
- Route Handler에 강하게 결합된 서버 로직은 `app/**/route.ts` 근처에 둘 수 있으나, 여러 route에서 공유되면 feature의 `server/` 또는 `actions/`로 이동합니다.

### 8.7 전역 store를 통한 feature 결합 숨기기

feature 간 직접 import를 피하기 위해 전역 store에 feature 전용 데이터를 올리는 것은 금지합니다. 전역 store는 로그인 세션, 테마, 앱 설정처럼 앱 전체가 공유하는 상태만 다룹니다.

```tsx
// ❌ todo 전용 필터 상태를 전역 store에 올림
import { useTodoFilterStore } from '@/store/todo-filter-store';

// ✅ todo feature 내부에 둠
import { useTodoFilterStore } from '@/features/todo/store/todo-filter-store';
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
│   ├── todo-list.tsx
│   └── todo-list.test.tsx
├── hooks/
│   └── use-todos.test.ts
├── mocks/
│   └── todo-fixtures.ts
└── index.ts

components/ui/
├── button.tsx
└── button.stories.tsx
```

---

## 10. 규칙 강제

문서 규칙은 가능한 한 도구로 강제하는 것을 목표로 합니다. 현재 `eslint.config.mjs`에는 `no-restricted-imports` 기반 import 경계 규칙이 `"warn"` 수준으로 적용되어 있습니다. 실제 도입은 §10.1의 단계적 도입 원칙에 따라 진행하며, `"error"` 승격이나 `dependency-cruiser` 도입은 별도 변경으로 다룹니다.

아래 규칙은 두 기준 — Public API/deep import(§1.3), 레이어 방향(§4.2) — 을 도구로 인코딩한 것입니다. 글롭은 기준 절보다 세분될 수 있으니, 방향 규칙 자체를 바꿀 때는 해당 기준 절을 먼저 고치고 이 설정을 반영합니다(이 설정을 기준 절로 환원하지 않음).

- 현재 적용: TypeScript path alias(`@/`)는 `tsconfig.json`에 `./*` 기준으로 정의
- 현재 적용: 린트는 `eslint.config.mjs`를 기준으로 실행합니다. Next 16에서 `next lint`는 제거되었으므로 현재 `package.json`의 `"lint": "eslint"` 스크립트 또는 `npx eslint`로 실행합니다.
- 현재 적용: ESLint `no-restricted-imports`로 feature 공개 경계와 주요 레이어 금지 방향을 `"warn"` 수준으로 검증
- 적용 후보: `dependency-cruiser`로 전체 의존성 그래프와 기존 위반 baseline 검증

**ESLint 적용 예시:**
```js
// eslint.config.mjs 적용 예시. 실제 glob은 프로젝트 구조에 맞게 조정합니다.
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
```

주의:
- `features/**/*`와 `components/ui/**/*`는 `appFiles`에도 매칭됩니다. ESLint flat config에서 같은 rule은 뒤쪽 설정이 덮어쓸 수 있으므로, 좁은 block에는 공통 제한 패턴을 다시 포함합니다.
- `no-restricted-imports`만으로 `"use client"` 파일 여부를 정밀 판별하지 않습니다. Client Component의 server-only import 방지는 `import 'server-only'`, Next.js 빌드, 리뷰 체크리스트로 함께 검증합니다.
- 상대 경로 deep import와 전체 레이어 그래프까지 CI에서 확인해야 하면 `dependency-cruiser` 같은 별도 검증 도구를 추가합니다.

### 10.1 기존 코드베이스에 도입하기

이 프로젝트는 이미 운영 중이므로, 위 경계 규칙은 한 번에 `error`로 켜지 않고 단계적으로 도입합니다.

- 1단계: `no-restricted-imports` 경계 규칙을 `"warn"`으로 추가해 기존 위반 현황만 먼저 파악합니다. 현재 이 계획은 이 단계를 수행합니다.
- 2단계: 레이어별로 정리하며 `"error"`로 승격합니다. 보통 `features/**`의 feature 간 직접 import부터 시작합니다.
- 3단계: 한 번에 고치기 어려운 기존 위반은 `dependency-cruiser` baseline 또는 한시적 allowlist로 동결해 새 위반만 차단하고, 기존 위반은 점진적으로 줄입니다.
- 신규·수정 파일에는 처음부터 규칙을 적용하고, 대규모 일괄 정리는 기능 변경과 별도 PR로 분리합니다.

---

## 11. 체크리스트

새로운 PR을 올리기 전 다음을 확인합니다.

이 체크리스트의 import 경계·레이어 항목은 §1.3·§4.2 두 기준을 검증합니다. 그 밖 항목은 §3·§5·§8·§9 등 각 절을 검증합니다. 규칙 자체를 바꾸려면 체크리스트가 아니라 해당 절을 먼저 고칩니다.

- [ ] 새로 만든 코드가 올바른 폴더에 위치하는가?
- [ ] feature 간 직접 import가 없는가?
- [ ] feature 내부에서 `components/layout`을 import하지 않았는가?
- [ ] feature 내부에서 `components/landing` 또는 `app/**/_components`를 import하지 않았는가?
- [ ] `components/layout` 또는 `components/landing`이 `features`나 `app/**` route 구현을 직접 import하지 않았는가?
- [ ] `components/ui`에 도메인 로직이 들어가지 않았는가?
- [ ] `components/ui`가 `features`, `store`, `app`, route-specific 컴포넌트에 의존하지 않는가?
- [ ] 외부 노출이 필요한 항목이 `index.ts`에 정리되었는가?
- [ ] 불필요한 barrel 파일을 만들지 않았는가?
- [ ] shadcn/Base UI 컴포넌트는 현재 프로젝트 규칙대로 `@/components/ui/button` 같은 단일 파일 공개 경계를 사용하는가?
- [ ] feature 컴포넌트가 많아졌다면 파일 병합이 아니라 역할별 하위 폴더 분류를 먼저 검토했는가?
- [ ] 절대 경로(`@/`)를 사용했는가?
- [ ] 상대 경로로 다른 feature 내부를 우회 import하지 않았는가? (lint이 잡지 못하는 경로이므로 리뷰에서 확인)
- [ ] 일반 컴포넌트는 Named export를 사용하고, Next route file convention은 default export 예외를 따르는가?
- [ ] 비즈니스 기능 API 호출은 `features/[feature]/api`에 위치하는가?
- [ ] server-only 로직이 클라이언트 컴포넌트나 hook에 직접 import되지 않았는가?
- [ ] secret, DB, 파일 시스템을 다루는 server-only 모듈에 `import 'server-only'`가 있는가?
- [ ] Client Component에서 호출하는 Server Function은 `"use server"` 전용 `actions` 공개 경계를 사용하는가?
- [ ] Client Component에 전달하는 props와 Server Function 반환값이 React가 직렬화할 수 있는 형태인가?
- [ ] 전역 store가 feature 간 의존성 우회 수단으로 쓰이지 않았는가?
- [ ] `hooks`, `lib`, `store`, `types`, `constants`가 `features`, `app`, route-specific 컴포넌트에 역방향 의존하지 않는가?
- [ ] 전역 `types/`, `constants/`에 feature 전용 타입이나 상수가 들어가지 않았는가?
- [ ] 전역 shared layer로 올린 항목이 "여러 파일에서 사용"이 아니라 "소유 feature가 없고 앱 전체가 공유"하는 항목인가?
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
│   │       └── dashboard-shell.tsx
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
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   └── layout.tsx
│   └── landing/
│       ├── hero.tsx
│       ├── features.tsx
│       └── pricing.tsx
├── features/
│   ├── auth/
│   │   ├── components/
│   │   │   ├── login-form.tsx
│   │   │   └── signup-form.tsx
│   │   ├── hooks/
│   │   │   ├── use-login.ts
│   │   │   └── use-signup.ts
│   │   ├── api/
│   │   │   ├── login.ts
│   │   │   └── signup.ts
│   │   ├── server/
│   │   │   └── create-user-on-server.ts
│   │   ├── actions/
│   │   │   └── signup-action.ts
│   │   ├── __tests__/
│   │   │   └── login-form.test.tsx
│   │   ├── types.ts
│   │   └── index.ts
│   └── todo/
│       ├── components/
│       │   ├── todo-list.tsx
│       │   └── todo-form.tsx
│       ├── hooks/
│       │   ├── use-todos.ts
│       │   └── use-create-todo.ts
│       ├── api/
│       │   ├── get-todos.ts
│       │   └── create-todo.ts
│       ├── store/
│       │   └── todo-filter-store.ts
│       ├── mocks/
│       │   └── todo-fixtures.ts
│       ├── types.ts
│       └── index.ts
├── hooks/
│   ├── use-debounce.ts
│   └── use-media-query.ts
├── lib/
│   ├── api-client.ts
│   ├── env.ts
│   └── utils.ts
├── store/
│   ├── session-store.ts
│   └── theme-store.ts
├── types/
│   └── api.ts
└── constants/
    └── routes.ts
```

---

이 문서는 프로젝트의 일관성과 유지보수성을 위한 약속입니다. 규칙을 변경해야 할 합리적인 이유가 있다면 팀과 논의 후 이 문서를 먼저 업데이트한 뒤 코드에 반영합니다.

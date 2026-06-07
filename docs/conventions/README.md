# Project Conventions

`docs/conventions`는 이 프로젝트의 지속적인 컨벤션 기준입니다. 홈페이지를
만들기 위해 잠시 둔 임시 메모가 아니며, 런타임 애플리케이션 코드도 아닙니다.
이 폴더의 목적은 기여자와 에이전트가 코드베이스를 변경할 때 따라야 할 구조,
네이밍, 디자인 규칙을 명확히 두는 것입니다.

코드, 마크업, CSS, 파일 구조를 추가하거나 수정하기 전에는 이 README와 작업에
해당하는 컨벤션 문서를 먼저 확인합니다.

## 문서

- `feature-based-architecture.md`
  - 프로젝트 폴더 구조, 레이어 경계, feature 모듈 형태, Public API 규칙,
    허용되는 import 방향을 정의합니다.
  - 기능 추가, 파일 이동, shared 모듈 생성, import 변경 전에 확인합니다.

- `naming-conventions.md`
  - 파일명, 폴더명, 함수명, 변수명, 타입/인터페이스명, 상수명, Next.js App
    Router 특수 파일의 네이밍 규칙을 정의합니다.
  - 코드 요소를 새로 만들거나 이름을 바꾸기 전에 확인합니다.

- `theme.md`
  - LongformShorts AI의 visual language와 디자인 시스템 규칙을 정의합니다. 다크 전용
    제품 정체성, semantic color token 사용, 타이포그래피, surface 처리,
    amber accent 사용 절제, 금지된 generic AI 스타일이 포함됩니다.
  - UI 마크업, Tailwind class, 컴포넌트 스타일링, theme token, landing-page
    visual을 작성하거나 수정하기 전에 확인합니다.
  - 실제 theme token은 `app/globals.css`에 있으며, 해당 파일도 `theme.md`를
    사용 규칙의 기준으로 참조합니다.

## 이 폴더의 의미

`docs/conventions`는 향후 개발을 위한 작업 합의입니다. 제품이 발전해도
아키텍처, 네이밍, 시각 언어가 흐트러지지 않도록 기준점을 제공합니다.

홈페이지나 개별 기능이 완성된 뒤에도 이 폴더는 유지합니다. 프로젝트 컨벤션을
의도적으로 바꿀 때는 관련 문서를 함께 갱신합니다. 문서를 삭제해야 하는 경우는
해당 규칙이 다른 유지 문서로 완전히 이전됐고, 모든 참조가 함께 갱신된 경우로
제한합니다.

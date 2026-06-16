# 얼굴 추적 기반 자동 리프레임 파이프라인 기능 개발 문서

> **보관 규칙:** 이 계획의 모든 작업을 완료하고 검증한 뒤, 최종 응답을
> 보내기 전에 이 파일을 `docs/plans/archive/`로 옮긴다.

> 이 문서는 대화 중 합의된 브리프를 기반으로 작성됨 — 구현 착수 전 검토 후
> 보완 필요.

> **범위 전제 (2026-06-15 확정):** 현재는 **출시 전 개발 단계**다. 따라서 이번
> 작업은 **로컬 실행 환경에서 기능을 만들고 품질을 검증하는 것**까지를
> 범위로 한다. 렌더 파이프라인의 **워커 분리·배포는 보류**하며(부록 A 참조),
> 기능이 "쓸 만하다"고 확정된 뒤 별도로 진행한다. 워커 분리는 얼굴 추적이
> 아니라 ffmpeg 때문에 어차피 배포 시 필요한 인프라 작업이며, 기능 구현과
> 독립적이다.

---

## 1. 배경/동기

현재 숏 렌더는 `features/project/server/render-clips.ts`의 단일 필터로 16:9
소스를 9:16으로 변환한다.

```js
// render-clips.ts:21
const VERTICAL_FILTER = "crop=min(iw\\,ih*9/16):ih,scale=1080:1920";
```

이는 **고정 중앙 크롭**이다. 1920×1080 소스 기준 가운데 약 608px(가로의
약 31%)만 남기고 좌우 약 68%를 무조건 버린다. "피사체는 항상 화면 중앙에
있다"는 가정이 깔려 있는데, 실제 영상에서는 다음 경우에 핵심이 잘려나가
이질감이 생긴다.

- 화자가 좌/우에 치우쳐 있는 경우
- 화자가 2명 이상인 경우
- 측면에 자막·그래픽·자료 화면이 있는 경우
- 한 클립 안에서 샷이 여러 번 바뀌어(컷 전환) 매 샷의 구도가 다른 경우

이를 해결하려면 "피사체를 찾아 크롭 창을 맞추는" 자동 리프레임이 필요하다.
업계 표준(Opus Clip AutoReframe, Adobe Premiere Auto Reframe, Submagic,
CapCut 등)도 결국 피사체 추적 기반 동적 크롭이다.

탐지는 로컬 OSS 모델(MediaPipe)로 수행하므로 **호출당 추가 과금이 없다**.
클라우드 비전 API(AWS Rekognition 등)는 분당 과금이 발생하므로 채택하지
않는다. 로컬 개발 환경에서는 ffmpeg + 모델이 비용·실행시간·번들 한도 제약
없이 동작하므로, 기능 검증에 가장 적합하다.

> **배포 관련 참고**: ffmpeg를 쓰는 Inngest 함수 3개(`transcribeVideo`의
> cinematic proxy, `renderClips`, `exportShort`)는 Vercel 서버리스의 250MB
> 번들 한도·실행시간 한도와 충돌한다. 따라서 **프로덕션 배포 시점에는** 렌더
> 파이프라인을 Vercel 밖 전용 워커로 분리해야 한다. 이는 이번 범위가 아니며
> 부록 A에 보류 작업으로 정리한다.

---

## 2. 목표 상태

### 목표

- 숏 렌더 시 피사체(주로 얼굴)를 탐지해 크롭 창의 가로 위치를 맞춘다.
- 한 클립 안에서 **씬 컷마다 구도를 다시 잡는다**(샷 단위 재구성).
- 얼굴이 없거나 신뢰도가 낮으면 **콘텐츠 손실 0%인 blur-fill 레이아웃**으로
  자동 폴백한다.
- 위 동작이 **현재 로컬 실행 구조 그대로** 동작한다(새 인프라 도입 없음).

### 비목표

이번 범위에서 의도적으로 제외하는 것:

- **워커 분리·프로덕션 배포**: 부록 A로 보류. 이번엔 로컬 검증까지만.
- **부드러운 패닝(smooth pan)**: v1은 씬 단위 고정 오프셋만 사용한다. 프레임
  단위 추적/이징은 v2로 미룬다. (잘못된 패닝은 고정 크롭보다 더 나쁘다.)
- **Active Speaker Detection / 화자 분할(split-screen)**: 2명 이상 화자 전환은
  v2로 미룬다. v1은 씬별 대표 얼굴 1개만 추적한다.
- **수동 크롭/레이아웃 오버라이드 UI**: v2로 미룬다.
- **DB 스키마 변경**: v1은 탐지를 렌더 시점에 수행하고 결과를 저장하지
  않는다. Prisma 마이그레이션을 발생시키지 않는다.
- **GPU 사용**: v1은 CPU 추론만 사용한다.

### 성공 기준

- talk 콘텐츠 숏에서 화자 얼굴이 9:16 프레임 안전영역(상단 약 70%, 자막
  영역 제외) 안에 유지되는 클립 비율이 기존 고정 중앙 크롭 대비 유의하게
  증가한다(로컬 육안 비교).
- 얼굴 미검출/저신뢰 숏은 **100%** blur-fill로 폴백하며, 어떤 입력에서도
  렌더가 실패하지 않는다(고정 중앙 크롭 대비 회귀 없음).
- 기능 도입 후에도 로컬에서 업로드→전사→탐지→렌더→내보내기 전체
  파이프라인이 정상 동작한다.
- DB 스키마 변경이 없다(마이그레이션 0건).

---

## 3. 대안 분석

### 리프레임 방식

#### Option A: blur-fill만 (크롭 폐기)
- 장점: ffmpeg 필터 몇 줄, ML 불필요, 콘텐츠 손실 0%, 즉시 적용
- 단점: 영상이 작게 보이는 "성의 없는" 미감. 근본적인 "꽉 찬 세로 영상"이
  아님

#### Option B: 클라우드 비전 API 기반 동적 크롭 (Rekognition 등)
- 장점: 구현이 비교적 단순, active-speaker 등 고급 기능 일부 제공
- 단점: **분당 과금 발생**, 비동기 잡 폴링 지연, AWS 락인

#### Option C: 로컬 모델 + 씬 단위 동적 크롭 + blur-fill 폴백 (선택)
- 장점: 추가 과금 0, 이질감을 근본적으로 제거, 폴백으로 모든 입력 안전 처리
- 단점: 렌더에 탐지 단계 추가(2-pass), 모델 의존성 추가

#### 선택: Option C
- 근거: 이질감을 실제로 없애는 것은 동적 크롭뿐이고(A는 회피일 뿐), 비용
  부담 없이 가려면 로컬 모델이어야 한다(B 제외). blur-fill(A)은 폐기하지
  않고 **C의 폴백 경로로 재사용**하므로 A의 구현은 버려지지 않는다.

### 탐지 모델

- **선택: `@vladmandic/face-api` + `@tensorflow/tfjs-node`** (구현 시 확정)
- 근거: 당초 후보였던 `@mediapipe/tasks-vision`은 **브라우저 우선** 패키지라
  Node 단독 실행 시 JSDOM으로 `window`/`document`를 흉내내야 해 취약하다.
  반면 face-api는 Node를 공식 지원하고, `tf.node.decodeImage`로 ffmpeg가 뽑은
  PNG를 바로 텐서로 디코드해 `node-canvas` 같은 추가 네이티브 의존성이 없다.
  MediaPipe를 고른 원래 이유(번들 크기)는 배포 보류(로컬 우선)로 사라졌다.
  우리 요구는 "샷별 얼굴 중심 x 1개"라 TinyFaceDetector로 충분하다.
- 격리: 탐지 구현은 `reframe.ts` 내부에만 있으므로, v2에서 정밀도가 필요하면
  ONNX 등으로 내부 교체가 가능하다(공개 인터페이스 `planReframe` 불변).

### 동적 크롭 적용 방식 (ffmpeg)

- **선택: 단일 패스 + 시간 의존 crop 표현식** (`crop`의 x는 기본적으로 매
  프레임 평가되므로 `eval` 옵션 불필요 — 이 빌드엔 crop `eval`이 없음)
- 근거: 오프셋을 `if(lt(t,b),...)` 계단 함수로 표현해 한 번의 디코드/인코드로
  처리한다. 세그먼트 분할 후 concat 대비 임시 파일·키프레임 정렬 문제가 없다.
- 추적 안정화: 명시적 씬 컷 파싱 대신 **샘플 중심값 스무딩(중앙값) +
  deadband** 로 큰 이동에서만 크롭을 재배치한다(샷별 재구성 효과를 ffmpeg
  scene 메타데이터 파싱의 취약성 없이 달성).

---

## 4. 구현 계획

### 4.1 신규 파일

| 파일 | 역할 |
|------|------|
| `features/project/server/reframe.ts` | 프레임 샘플링·씬 컷 탐지·얼굴 탐지·씬별 크롭 오프셋 계산·`-vf` 필터 문자열 생성(blur-fill 폴백 포함) |

> 워커 관련 신규 파일(`worker/`)은 이번 범위가 아니다(부록 A).

### 4.2 Phase 1 — blur-fill 도입 (`render-clips.ts`)

폴백으로 재사용할 blur-fill 필터를 먼저 도입한다. 이 단계는 얼굴 추적과
독립적으로 머지 가능하다.

**Before:**
```ts
// render-clips.ts
// Center-crop to 9:16, then normalize to 1080x1920.
const VERTICAL_FILTER = "crop=min(iw\\,ih*9/16):ih,scale=1080:1920";

async function renderClipFile(
  tempDir: string,
  sourceName: string,
  target: RenderTarget,
  outputName: string,
): Promise<void> {
  await runFfmpeg(
    [
      "-y",
      "-ss",
      String(target.startSec),
      "-i",
      sourceName,
      "-t",
      String(target.endSec - target.startSec),
      "-vf",
      VERTICAL_FILTER,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "23",
      "-c:a",
      "aac",
      "-movflags",
      "+faststart",
      outputName,
    ],
    tempDir,
  );
}
```

**After:**
```ts
// render-clips.ts
// 9:16 프레임을 콘텐츠 손실 없이 채우는 blur-fill 레이아웃. 전경은 원본을
// 가로폭에 맞춰 중앙 배치, 배경은 동일 프레임의 블러 확대본으로 채운다.
const BLUR_FILL_FILTER =
  "split=2[bg][fg];" +
  "[bg]scale=1080:1920:force_original_aspect_ratio=increase," +
  "crop=1080:1920,gblur=sigma=20[bg];" +
  "[fg]scale=1080:-2[fg];" +
  "[bg][fg]overlay=(W-w)/2:(H-h)/2";

async function renderClipFile(
  tempDir: string,
  sourceName: string,
  target: RenderTarget,
  outputName: string,
  videoFilter: string,
): Promise<void> {
  await runFfmpeg(
    [
      "-y",
      "-ss",
      String(target.startSec),
      "-i",
      sourceName,
      "-t",
      String(target.endSec - target.startSec),
      "-vf",
      videoFilter,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "23",
      "-c:a",
      "aac",
      "-movflags",
      "+faststart",
      outputName,
    ],
    tempDir,
  );
}
```

Phase 1에서는 호출부에서 `BLUR_FILL_FILTER`를 넘긴다. (Phase 2에서 이
인자가 reframe 결과로 대체된다.)

### 4.3 Phase 2 — 얼굴 추적 동적 크롭 (`reframe.ts` + `render-clips.ts`)

**신규 — `features/project/server/reframe.ts` (핵심 시그니처):**
```ts
import "server-only";

// 한 숏 구간의 리프레임 결과. cropFilter가 null이면 호출부는 blur-fill로
// 폴백한다.
export interface ReframePlan {
  cropFilter: string | null;
}

// 2fps 샘플 프레임 추출 → 얼굴 중심 x 검출 → 스무딩+deadband 세그먼트 →
// 계단형 crop x 표현식 생성. 얼굴 검출 프레임 비율이 임계 미만이면 null 반환.
export async function planReframe(
  tempDir: string,
  sourceName: string,
  clipId: string,
  start: number,
  end: number,
  sourceWidth: number,
  sourceHeight: number,
): Promise<ReframePlan>;
```

구현 골자 (실제 구현 반영):
1. `cropW = round(sourceHeight*9/16)`(짝수 보정). `cropW >= sourceWidth`(이미
   세로/정사각)면 바로 `null` 반환 → 호출부 blur-fill.
2. `ffmpeg -ss start -i source -t dur -vf fps=2,scale=640:-2 f_%05d.png` 로
   다운스케일 샘플 추출(탐지 속도용, 중심은 비율로 원본 좌표 환산).
3. face-api TinyFaceDetector로 프레임별 **가장 큰 얼굴**의 중심 x 검출.
4. 검출 프레임 비율 < 0.3 → `null` 반환(blur-fill).
5. 중심값을 슬라이딩 **중앙값**으로 스무딩 → x = `clamp(center - cropW/2, 0,
   sourceWidth-cropW)` → 이전 세그먼트와 차이가 deadband(cropW·0.15) 초과일
   때만 새 세그먼트 시작.
6. `crop=w=<cropW>:h=ih:x=if(lt(t\,b1)\,x0\,...):y=0,scale=1080:1920` 표현식을
   `cropFilter`로 반환(콤마는 ffmpeg 필터 구분자라 `\,`로 escape).

**`render-clips.ts` 렌더 루프 (After, Phase 2):**
```ts
// 다운로드 직후 소스 해상도 1회 측정(ffprobe) 후 숏별로 reframe 계획 수립.
for (const short of shorts) {
  const outputName = `${short.id}.mp4`;
  try {
    const plan = await planReframe(
      tempDir,
      sourceName,
      short.startSec,
      short.endSec,
      sourceWidth,
      sourceHeight,
    );
    const videoFilter = plan.cropFilter ?? BLUR_FILL_FILTER;
    await renderClipFile(tempDir, sourceName, short, outputName, videoFilter);
    const clipKey = `${CLIP_KEY_PREFIX}/${projectId}/${short.id}.mp4`;
    await uploadObject(
      clipKey,
      await readFile(path.join(tempDir, outputName)),
      "video/mp4",
    );
    await setShortClipKey(short.id, clipKey);
    outcomes.push({ shortId: short.id, clipKey });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await setShortRenderError(short.id, message);
    outcomes.push({ shortId: short.id, error: message });
  }
}
```

> `contentType === "cinematic"`인 프로젝트는 얼굴이 없을 확률이 높으므로
> reframe를 건너뛰고 바로 blur-fill로 가는 최적화를 둘 수 있다(선택).

### 4.4 의존성 및 설정 (구현 반영)

```jsonc
// package.json (dependencies)
"@tensorflow/tfjs-node": "^4.22.0",
"@vladmandic/face-api": "^1.7.15"   // 모델 가중치(tiny_face_detector)를 동봉
```

- `next.config.ts`의 `serverExternalPackages`에 두 패키지를 추가해 Next
  번들러가 네이티브/node 빌드를 깨뜨리지 않도록 한다.
- **tfjs-node Windows 바인딩 픽스**: Node 22에서 tfjs-node가 `tfjs_binding.node`
  와 `tensorflow.dll`을 napi-v8/napi-v9 폴더에 엇갈리게 풀어 로드가 실패한다.
  `scripts/fix-tfjs-node-win.mjs`가 두 파일을 양쪽 폴더로 미러링하며,
  `postinstall`에서 자동 실행된다(비-Windows에선 no-op).
- `ffprobe`(ffmpeg 동봉)로 소스 해상도를 측정. 로컬에 `ffmpeg`/`ffprobe`가
  PATH에 있어야 한다(현재 구조와 동일).

---

## 5. 실행 순서

### Phase 1: blur-fill 도입
- 작업 내용: `render-clips.ts`에 `BLUR_FILL_FILTER` 추가, `renderClipFile`에
  `videoFilter` 인자 추가, 호출부에서 blur-fill 전달. `VERTICAL_FILTER` 제거.
- 검증: 로컬에서 숏 렌더 시 출력이 1080×1920이고 좌우 잘림 없이 전체 화면이
  보이며 상하단이 블러로 채워지는지 확인. `npm run lint` 통과.

### Phase 2: 얼굴 추적 동적 크롭
- 작업 내용: `reframe.ts` 구현, `@mediapipe/tasks-vision` 추가, `render-clips.ts`
  루프를 reframe 계획 기반으로 교체(폴백은 Phase 1 blur-fill 재사용),
  소스 해상도 ffprobe 측정 추가.
- 검증: (a) 화자가 좌/우에 치우친 talk 영상에서 얼굴이 프레임 안에 유지되는지
  육안 확인. (b) 씬 컷이 있는 클립에서 샷마다 구도가 재조정되는지 확인.
  (c) 얼굴 없는 영상에서 blur-fill로 폴백하고 실패하지 않는지 확인.
  (d) 클립당 처리시간 증가폭 측정. `npm run lint` 통과.

> 두 Phase 모두 현재 로컬 구조(`app/api/inngest/route.ts` + `inngest-cli dev`)
> 위에서 동작한다. 인프라 변경 없음.

---

## 6. 영향 범위

- **직접 수정 대상**:
  - `features/project/server/render-clips.ts` (Phase 1, 2)
  - `package.json` (Phase 2, 의존성)
- **신규**:
  - `features/project/server/reframe.ts`
- **import/Public API 변경**:
  - 없음. `reframe.ts`는 `render-clips.ts` 내부에서만 사용하므로
    `features/project/server/index.ts`에 추가 export 불필요.
- **외부 의존성**:
  - `@mediapipe/tasks-vision` 추가. 로컬 `ffmpeg`/`ffprobe` 필요(현재와 동일).
- **동작 불변 영역**: transcribe/detect/export 로직은 변경 없음.
- **인프라**: 변경 없음(로컬 실행 유지). 프로덕션 배포 시 부록 A 적용 필요.

---

## 7. 리스크 + 롤백 전략

### 리스크

- **동적 크롭 표현식**: 필터 syntax(escape 콤마, named 인자, crop은 per-frame
  평가라 `eval` 미사용)는 ffmpeg testsrc로 검증 완료. per-short try/catch가
  있어 1개 숏 실패가 전체를 막지 않음. 남은 것은 실제 영상에서 패닝이
  의도대로 추적되는지 육안 확인. (영향: 소)
- **face-api / tfjs-node 환경**: 이 Windows+Node22 박스에서 네이티브 바인딩
  분리 글리치를 `postinstall` 스크립트로 해소. 재설치/다른 환경에서 재발
  가능하나 postinstall이 자동 처리. (영향: 중, 가능성: 소)
- **탐지 정확도**: TinyFaceDetector가 측면·저조도·작은 얼굴을 놓칠 수 있음.
  중앙값 스무딩+deadband로 완화하고, 미검출이 과반이면 blur-fill로 폴백.
  (영향: 소)
- **단일 step 루프 + 처리시간**: `renderClips`가 모든 숏을 한 step에서 루프로
  처리한다(`render-clips.ts:93`). 탐지가 클립당 시간을 늘리므로 숏이 많으면
  로컬에서도 느려진다(로컬은 타임아웃 제약이 없어 기능상 문제는 아님).
  (영향: 소, 가능성: 소)

### 롤백 전략

- Phase별로 독립 머지하므로 문제 발생 시 해당 Phase 커밋만 revert.
- Phase 2 회귀 시: reframe 호출을 제거하고 `BLUR_FILL_FILTER` 고정 사용으로
  되돌리면 ML 의존성 없이 안전한 상태 유지(콘텐츠 손실 0%).

---

## 8. 검증 전략

> 자동화 테스트 코드는 사용자 요청이 없는 한 추가하지 않는다(프로젝트 관행).
> 아래는 수동·관찰 기반 검증 + 정적 검증 중심이다.

- **기존 동작 회귀**: 로컬에서 전체 파이프라인 e2e 수동 실행(업로드→
  내보내기)으로 기존과 동일하게 완료되는지 확인.
- **리프레임 품질(육안)**: 화자 치우침/다중 샷/무얼굴 3종 샘플 영상으로
  각각 (a) 얼굴 유지, (b) 샷별 재구성, (c) blur-fill 폴백을 확인.
- **폴백 안전성**: 얼굴 없는 영상에서 렌더가 예외 없이 완료되는지 확인.
- **정적 검증**: `npm run lint`, `tsc` 타입 체크.
- **성능 관찰**: 클립당 처리시간(탐지 전/후)을 로그로 비교.

---

## 부록 A. 배포 시 보류 작업 — 렌더 파이프라인 워커 분리

> **이번 범위 아님.** 출시 전 개발 단계 동안은 로컬 실행으로 충분하다.
> 프로덕션 배포를 시작할 때 이 부록을 별도 계획으로 승격한다.

### 왜 필요한가
ffmpeg를 `spawn`하는 Inngest 함수 3개(`transcribeVideo`의 cinematic proxy,
`renderClips`, `exportShort`)는 Vercel 서버리스의 250MB 번들 한도·실행시간
한도와 충돌한다. 따라서 배포 시점에는 이 함수들을 Vercel 밖 전용 워커에서
`serve()`로 호스팅하고, Vercel은 `inngest.send()`(이벤트 발신)만 유지한다.
이는 얼굴 추적과 무관하게 ffmpeg 때문에 필요한 작업이다.

### 개요 (배포 시 구체화)
- 신규 `worker/inngest-server.ts`: Node http로 `serve()` 노출, 함수 3개 등록.
- 신규 `worker/Dockerfile`: Node + ffmpeg + MediaPipe wasm 포함 이미지.
- `app/api/inngest/route.ts`: serve 제거(Vercel은 send 전용).
- 워커는 **별도 Inngest 앱 id로 분리**(동일 함수의 중복 등록 사고 차단).
- `@/` alias 런타임 해석(tsx/빌드)과 `server-only`(Node에선 throw 안 함) 확인.
- **무거운 렌더 전용 의존성을 워커로 이전**: `@tensorflow/tfjs-node`,
  `@vladmandic/face-api`는 렌더에서만 쓰이므로 워커 패키지로 옮긴다(현재는
  로컬 우선이라 루트 package.json에 있어 Vercel 빌드에도 설치됨). 분리 시
  `next.config.ts`의 `serverExternalPackages`와 `postinstall` 픽스도 함께 이전.
- face-api 모델 경로는 현재 `process.cwd()/node_modules/...` 기준이므로 워커
  컨테이너의 작업 디렉토리/모델 위치에 맞게 조정 필요.

### 배포 시 결정할 항목 (지금은 보류)
- **워커 호스트**: Fly.io / Railway / Render / Modal·Fargate(종량) 중 택1.
  사용 패턴(상시 vs 간헐)과 예산으로 결정.
- **Inngest 운영**: Cloud(관리형) vs self-host.
- **리프레임 품질 정량 목표**: 배포 전 합격선을 정량화할지(예: 얼굴 유지
  클립 비율 ≥ N%) 여부와 측정 방법.

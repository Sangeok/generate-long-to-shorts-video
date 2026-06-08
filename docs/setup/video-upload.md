# 영상 업로드 설정 (S3 + Inngest)

대시보드의 영상 업로드 기능은 브라우저가 presigned URL 로 S3 에 직접 업로드하고,
Inngest 함수가 S3 객체 검증·signed view URL 생성·DB 상태 갱신을 수행한다. UI 는
DB 상태를 폴링해 진행 상황을 보여준다. 업로드마다 새 `Video` 레코드가 생성된다.

## 1. 환경 변수 (`.env`)

```bash
S3_BUCKET="버킷명"
AWS_REGION="ap-northeast-2"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."

# 로컬 dev server 사용 시 비워둔다. Inngest Cloud 전환 시에만 채운다.
INNGEST_EVENT_KEY=""
INNGEST_SIGNING_KEY=""
```

## 2. IAM 권한

자격 증명에는 버킷 객체에 대한 최소 권한이 필요하다:
`s3:PutObject`, `s3:GetObject`, `s3:HeadObject` (Resource: `arn:aws:s3:::버킷명/*`).

## 3. 버킷 CORS

브라우저가 presigned URL 로 직접 PUT 하므로 CORS 설정이 필요하다:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedOrigins": ["http://localhost:3000"],
    "ExposeHeaders": ["ETag"]
  }
]
```

배포 시 `AllowedOrigins` 에 운영 도메인을 추가한다.

## 4. DB 마이그레이션

`Video` 모델/마이그레이션을 데이터베이스에 적용한다:

```bash
npm run db:deploy
```

## 5. Inngest 로컬 개발

터미널 2개에서 각각 실행한다:

```bash
npm run dev
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
```

Inngest Dev Server 대시보드(기본 http://localhost:8288)에서 이벤트와 함수 실행,
각 `step.run` 단계를 확인할 수 있다. Cloud 전환 시 `INNGEST_EVENT_KEY` /
`INNGEST_SIGNING_KEY` 를 채우고 dev server 없이 운영 엔드포인트에 동기화한다.

## 6. 동작 흐름 요약

1. `POST /api/videos` — Video 생성(status=PENDING), S3 key + presigned PUT URL 반환.
2. 브라우저가 파일을 S3 로 직접 PUT (실제 업로드 진행률).
3. `POST /api/videos/{id}/complete` — status=UPLOADED, Inngest 이벤트(`video/uploaded`) 전송.
4. Inngest `process-uploaded-video` — verify → sign → finalize(status=READY, viewUrl 저장).
5. `GET /api/videos/{id}` 폴링 — READY 가 되면 signed view URL 로 재생.

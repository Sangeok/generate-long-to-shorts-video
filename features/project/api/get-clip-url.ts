// 브라우저 전용: 상대 경로 fetch이므로 Server Component에서 import하면
// 컴파일은 통과하지만 런타임에 URL 파싱 오류가 난다.
interface ClipUrlResponse {
  url: string;
}

// 클립이 아직 렌더되지 않아 clip-url이 404를 반환하는 경우. 호출부가 "준비 중"과
// 실제 실패를 구분해 재시도할 수 있게 한다.
export class ClipNotReadyError extends Error {
  constructor() {
    super("Clip not ready");
    this.name = "ClipNotReadyError";
  }
}

export async function getClipUrl(
  projectId: string,
  shortId: string,
): Promise<string> {
  const res = await fetch(`/api/projects/${projectId}/shorts/${shortId}/clip-url`, {
    cache: "no-store",
  });
  if (res.status === 404) {
    throw new ClipNotReadyError();
  }
  if (!res.ok) {
    throw new Error("Failed to load clip URL");
  }
  const data = (await res.json()) as ClipUrlResponse;
  return data.url;
}

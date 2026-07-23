// 브라우저 전용: 상대 경로 fetch이므로 Server Component에서 import하면
// 컴파일은 통과하지만 런타임에 URL 파싱 오류가 난다.
import type { ProjectStatusResponse } from "../types";

export async function getProjectStatus(
  projectId: string,
): Promise<ProjectStatusResponse> {
  const res = await fetch(`/api/projects/${projectId}/status`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to load project status");
  }
  return res.json();
}

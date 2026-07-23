import type { ProjectStatus } from "./types";

// 상태 분류의 단일 소스. Record가 ProjectStatus 유니온 전체 커버를 강제하므로
// 상태 추가 시 누락이 컴파일 오류로 드러난다.
export const PROJECT_STATUS_META = {
  uploaded: { terminal: false, active: true, label: "Queued" },
  transcribing: { terminal: false, active: true, label: "Transcribing" },
  transcribed: { terminal: false, active: true, label: "Transcribed" },
  generating_shorts: {
    terminal: false,
    active: true,
    label: "Finding moments",
  },
  completed: { terminal: true, active: false, label: "Ready" },
  failed: { terminal: true, active: false, label: "Failed" },
} as const satisfies Record<
  ProjectStatus,
  { terminal: boolean; active: boolean; label: string }
>;

// 종료 상태(completed/failed)를 제외한 진행 중 상태 — Prisma `in` 필터용.
export const ACTIVE_PROJECT_STATUSES: ProjectStatus[] = (
  Object.keys(PROJECT_STATUS_META) as ProjectStatus[]
).filter((status) => PROJECT_STATUS_META[status].active);

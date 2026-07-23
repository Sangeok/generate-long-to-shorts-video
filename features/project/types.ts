import type {
  PROJECT_CONTENT_TYPES,
  PROJECT_LANGUAGES,
} from "@/constants/generation-limits";

export type ProjectStatus =
  | "uploaded"
  | "transcribing"
  | "transcribed"
  | "generating_shorts"
  | "completed"
  | "failed";

export type ProjectContentType = (typeof PROJECT_CONTENT_TYPES)[number]["value"];

export type ProjectLanguage = (typeof PROJECT_LANGUAGES)[number]["value"];

export interface CaptionSegment {
  start: number;
  end: number;
  text: string;
}

export type CaptionFont = "malgun-gothic" | "arial" | "impact" | "verdana";
export type CaptionSize = "sm" | "md" | "lg";
export type CaptionPosition = "top" | "middle" | "bottom";
export type CaptionEdge = "outline" | "box";
export type CaptionAnimation =
  | "none"
  | "fade"
  | "pop"
  | "bounce"
  | "blur"
  | "zoom";

export interface CaptionStyle {
  font: CaptionFont;
  size: CaptionSize;
  position: CaptionPosition;
  edge: CaptionEdge;
  textColor: string;
  edgeColor: string;
  uppercase: boolean;
  animation: CaptionAnimation;
}

export interface TranscriptData {
  text: string;
  language: string | null;
}

export interface ProjectStatusResponse {
  status: ProjectStatus;
  error: string | null;
}

export interface ShortMoment {
  title: string;
  startSec: number;
  endSec: number;
  reason: string;
  seoScore: number;
}

export interface ShortClip extends ShortMoment {
  durationSec: number;
  captionsVtt: string;
  segments: CaptionSegment[];
}

// Render lifecycle as a discriminated union so contradictory combinations
// (ready + failed at once) are unrepresentable.
type ShortRenderStatus =
  | { status: "pending" }
  | { status: "ready"; clipKey: string }
  | { status: "failed"; error: string };

export interface ShortRecord {
  id: string;
  title: string;
  startSec: number;
  endSec: number;
  durationSec: number;
  reason: string;
  seoScore: number;
  segments: CaptionSegment[];
  captionStyle: CaptionStyle;
  renderStatus: ShortRenderStatus;
  exportKey: string | null;
  exportError: string | null;
}

// Library row for the "My Videos" page — one uploaded source video plus the
// shape of the shorts derived from it. `createdAt` is an ISO string so the
// summary stays serializable across the server/client boundary.
export interface ProjectSummary {
  id: string;
  title: string;
  contentType: ProjectContentType;
  status: ProjectStatus;
  durationSec: number | null;
  totalShorts: number;
  readyShorts: number;
  createdAt: string;
}

export type ShortExportStatus =
  | { status: "ready"; url: string }
  | { status: "processing" }
  | { status: "failed"; error: string };

export type VideoMetaRejection =
  | "missing-metadata"
  | "video-too-long"
  | "portrait-video";

export type StartAnalysisRejection =
  | VideoMetaRejection
  | "active-limit"
  | "daily-limit";

export type StartAnalysisResult =
  | { ok: true; projectId: string }
  | { ok: false; reason: StartAnalysisRejection };

export type DeleteProjectResult =
  | { ok: true }
  | { ok: false; reason: "not-found" };

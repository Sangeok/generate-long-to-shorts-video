export type ProjectStatus =
  | "uploaded"
  | "transcribing"
  | "transcribed"
  | "generating_shorts"
  | "completed"
  | "failed";

export type ProjectContentType = "talk" | "cinematic";

export type ProjectLanguage = "ko" | "en";

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
  clipKey: string | null;
  renderError: string | null;
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

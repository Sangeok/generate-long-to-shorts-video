export type ProjectStatus =
  | "uploaded"
  | "transcribing"
  | "transcribed"
  | "generating_shorts"
  | "completed"
  | "failed";

export interface CaptionSegment {
  start: number;
  end: number;
  text: string;
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
  clipKey: string | null;
  renderError: string | null;
}

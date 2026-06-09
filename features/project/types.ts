export type ProjectStatus =
  | "uploaded"
  | "transcribing"
  | "transcribed"
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

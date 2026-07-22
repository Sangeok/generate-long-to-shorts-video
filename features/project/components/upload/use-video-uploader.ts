import {
  type ChangeEvent,
  type DragEvent,
  type SyntheticEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { normalizeClipCount } from "@/constants/generation-limits";

import { createUploadUrl, startAnalysis } from "../../actions";
import {
  getVideoMetaRejection,
  MAX_ACTIVE_PROJECTS,
  MAX_UPLOAD_BYTES,
  MAX_VIDEO_DURATION_SEC,
} from "../../project-limits";
import type {
  ProjectContentType,
  ProjectLanguage,
  StartAnalysisRejection,
} from "../../types";

export type UploadStatus =
  | "idle"
  | "selected"
  | "uploading"
  | "done"
  | "analyzing";

export interface VideoMeta {
  duration: number;
  width: number;
  height: number;
}

const MAX_UPLOAD_GB = MAX_UPLOAD_BYTES / 1024 ** 3;
const MAX_VIDEO_DURATION_HOURS = MAX_VIDEO_DURATION_SEC / 3600;

// 서버 거부 사유 코드 → 사용자 메시지. 한도 수치는 상수에서 파생한다.
const REJECTION_MESSAGES: Record<StartAnalysisRejection, string> = {
  "missing-metadata":
    "We couldn't read this video's metadata. Try a different file.",
  "video-too-long": `Videos must be ${MAX_VIDEO_DURATION_HOURS} hours or shorter.`,
  "portrait-video": "Only landscape videos are supported for now.",
  "active-limit": `You already have ${MAX_ACTIVE_PROJECTS} projects processing. Wait for one to finish.`,
  "daily-limit": "Daily upload limit reached. Try again tomorrow.",
};

function uploadToS3(
  uploadUrl: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("Upload network error"));
    xhr.send(file);
  });
}

interface UseVideoUploaderOptions {
  initialContentType: ProjectContentType;
  initialLanguage: ProjectLanguage;
  initialClipCount: number;
}

export const useVideoUploader = ({
  initialContentType,
  initialLanguage,
  initialClipCount,
}: UseVideoUploaderOptions) => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const videoKeyRef = useRef<string | null>(null);

  const [status, setStatus] = useState<UploadStatus>("idle");
  const [contentType, setContentType] =
    useState<ProjectContentType>(initialContentType);
  const [language, setLanguage] = useState<ProjectLanguage>(initialLanguage);
  const [clipCount, setClipCount] = useState(() =>
    normalizeClipCount(initialClipCount),
  );
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<VideoMeta | null>(null);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openPicker = () => inputRef.current?.click();

  const selectFile = (candidate: File | null | undefined) => {
    if (!candidate) return;
    if (!candidate.type.startsWith("video/")) {
      setError("That file isn't a video. Try an MP4, MOV, or WebM.");
      return;
    }
    if (candidate.size > MAX_UPLOAD_BYTES) {
      setError(`Videos must be ${MAX_UPLOAD_GB}GB or smaller.`);
      return;
    }

    setError(null);
    setMeta(null);
    setProgress(0);
    videoKeyRef.current = null;
    setFile(candidate);
    setPreviewUrl(URL.createObjectURL(candidate));
    setStatus("selected");
  };

  const reset = () => {
    setStatus("idle");
    setFile(null);
    setPreviewUrl(null);
    setMeta(null);
    setProgress(0);
    videoKeyRef.current = null;
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    selectFile(event.target.files?.[0]);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files?.[0]);
  };

  // 메타 위반은 업로드 전에 거르고, 거부 시 선택 전체를 초기화한다.
  const handleLoadedMetadata = (event: SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    const rejection = getVideoMetaRejection(
      video.duration,
      video.videoWidth,
      video.videoHeight,
    );
    if (rejection) {
      reset();
      setError(REJECTION_MESSAGES[rejection]);
      return;
    }
    setMeta({
      duration: video.duration,
      width: video.videoWidth,
      height: video.videoHeight,
    });
  };

  const startUpload = async () => {
    if (!file) return;
    setError(null);
    setProgress(0);
    setStatus("uploading");
    try {
      const { uploadUrl, videoKey } = await createUploadUrl({
        filename: file.name,
        contentType: file.type,
        fileSize: file.size,
      });
      await uploadToS3(uploadUrl, file, setProgress);
      videoKeyRef.current = videoKey;
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setStatus("selected");
    }
  };

  const analyze = async () => {
    if (!file || !videoKeyRef.current) return;
    setError(null);
    setStatus("analyzing");
    try {
      const result = await startAnalysis({
        videoKey: videoKeyRef.current,
        title: file.name,
        contentType,
        language,
        clipCount: normalizeClipCount(clipCount),
        durationSec: meta?.duration ?? null,
        width: meta?.width ?? null,
        height: meta?.height ?? null,
      });
      if (!result.ok) {
        setError(REJECTION_MESSAGES[result.reason]);
        setStatus("done");
        return;
      }
      router.push(`/dashboard/projects/${result.projectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start analysis.");
      setStatus("done");
    }
  };

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  return {
    inputRef,
    status,
    contentType,
    setContentType,
    clipCount,
    setClipCount,
    language,
    setLanguage,
    file,
    previewUrl,
    meta,
    progress,
    isDragging,
    error,
    openPicker,
    reset,
    handleInputChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleLoadedMetadata,
    startUpload,
    analyze,
  };
};

import {
  type ChangeEvent,
  type DragEvent,
  type SyntheticEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import type { ProjectContentType, ProjectLanguage } from "@/features/project";
import { createUploadUrl, startAnalysis } from "@/features/project/actions";

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

export const useVideoUploader = () => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const videoKeyRef = useRef<string | null>(null);

  const [status, setStatus] = useState<UploadStatus>("idle");
  const [contentType, setContentType] = useState<ProjectContentType>("talk");
  const [language, setLanguage] = useState<ProjectLanguage>("en");
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

  const handleLoadedMetadata = (event: SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
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
      const { projectId } = await startAnalysis({
        videoKey: videoKeyRef.current,
        title: file.name,
        contentType,
        language,
        durationSec: meta?.duration ?? null,
        width: meta?.width ?? null,
        height: meta?.height ?? null,
      });
      router.push(`/dashboard/projects/${projectId}`);
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

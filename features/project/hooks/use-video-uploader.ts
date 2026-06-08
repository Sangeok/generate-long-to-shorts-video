"use client";

import {
  type ChangeEvent,
  type DragEvent,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { completeUpload } from "../api/complete-upload";
import { createProject } from "../api/create-project";
import { getProject } from "../api/get-project";
import { uploadToS3 } from "../api/upload-to-s3";
import { mapStatusToPhase } from "../status";
import type { ProjectDTO, UploadPhase } from "../types";

export interface VideoMeta {
  duration: number;
  width: number;
  height: number;
}

const POLL_INTERVAL_MS = 1500;

export const useVideoUploader = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<VideoMeta | null>(null);
  const [progress, setProgress] = useState(0);
  const [project, setProject] = useState<ProjectDTO | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearPoll = () => {
    if (pollRef.current) {
      clearTimeout(pollRef.current);
      pollRef.current = null;
    }
  };

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
    setProject(null);
    setFile(candidate);
    setPreviewUrl(URL.createObjectURL(candidate));
    setPhase("selected");
  };

  const reset = () => {
    clearPoll();
    cancelledRef.current = true;
    setPhase("idle");
    setFile(null);
    setPreviewUrl(null);
    setMeta(null);
    setProgress(0);
    setProject(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) =>
    selectFile(event.target.files?.[0]);

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

  const poll = useCallback((projectId: string) => {
    const tick = async () => {
      try {
        const dto = await getProject(projectId);
        if (cancelledRef.current) return;
        setProject(dto);
        setPhase(mapStatusToPhase(dto.status));
        if (dto.status === "READY") {
          setProgress(100);
          return;
        }
        if (dto.status === "FAILED") {
          setError(dto.error ?? "Processing failed.");
          return;
        }
        pollRef.current = setTimeout(tick, POLL_INTERVAL_MS);
      } catch (err) {
        if (cancelledRef.current) return;
        setError(err instanceof Error ? err.message : "Polling failed.");
        setPhase("failed");
      }
    };
    void tick();
  }, []);

  const startUpload = useCallback(async () => {
    if (!file) return;
    cancelledRef.current = false;
    setError(null);
    setProgress(0);
    setPhase("uploading");
    try {
      const { projectId, uploadUrl } = await createProject({
        filename: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        durationSeconds: meta?.duration ?? null,
        width: meta?.width ?? null,
        height: meta?.height ?? null,
      });
      await uploadToS3(uploadUrl, file, (percent) => {
        if (!cancelledRef.current) setProgress(percent);
      });
      if (cancelledRef.current) return;
      setPhase("processing");
      await completeUpload(projectId);
      poll(projectId);
    } catch (err) {
      if (cancelledRef.current) return;
      setError(err instanceof Error ? err.message : "Upload failed.");
      setPhase("failed");
    }
  }, [file, meta, poll]);

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => clearPoll, []);

  return {
    inputRef,
    phase,
    file,
    previewUrl,
    meta,
    progress,
    project,
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
  };
};

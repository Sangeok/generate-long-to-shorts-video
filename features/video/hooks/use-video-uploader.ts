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
import { createVideo } from "../api/create-video";
import { getVideo } from "../api/get-video";
import { uploadToS3 } from "../api/upload-to-s3";
import { mapStatusToPhase } from "../status";
import type { UploadPhase, VideoDTO } from "../types";

export interface VideoMeta {
  duration: number;
  width: number;
  height: number;
}

const POLL_INTERVAL_MS = 1500;
const MAX_POLL_ATTEMPTS = 80; // ~2 minutes before giving up on a stuck backend

export const useVideoUploader = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollAttemptsRef = useRef(0);
  const cancelledRef = useRef(false);

  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<VideoMeta | null>(null);
  const [progress, setProgress] = useState(0);
  const [video, setVideo] = useState<VideoDTO | null>(null);
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
    setVideo(null);
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
    setVideo(null);
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
    const element = event.currentTarget;
    setMeta({
      duration: element.duration,
      width: element.videoWidth,
      height: element.videoHeight,
    });
  };

  const poll = useCallback((videoId: string) => {
    pollAttemptsRef.current = 0;
    const tick = async () => {
      try {
        const dto = await getVideo(videoId);
        if (cancelledRef.current) return;
        setVideo(dto);
        setPhase(mapStatusToPhase(dto.status));
        if (dto.status === "READY") {
          setProgress(100);
          return;
        }
        if (dto.status === "FAILED") {
          setError(dto.error ?? "Processing failed.");
          return;
        }
        pollAttemptsRef.current += 1;
        if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
          setError("Timed out waiting for processing to finish.");
          setPhase("failed");
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
      const { videoId, uploadUrl } = await createVideo({
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
      await completeUpload(videoId);
      poll(videoId);
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
    video,
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

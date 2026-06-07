import {
  type ChangeEvent,
  type DragEvent,
  type SyntheticEvent,
  useEffect,
  useRef,
  useState,
} from "react";

export type UploadStatus = "idle" | "selected" | "uploading" | "done";

export interface VideoMeta {
  duration: number;
  width: number;
  height: number;
}

export const useVideoUploader = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef(0);

  const [status, setStatus] = useState<UploadStatus>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<VideoMeta | null>(null);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearUploadTimer = () => {
    if (!intervalRef.current) return;
    clearInterval(intervalRef.current);
    intervalRef.current = null;
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
    setFile(candidate);
    setPreviewUrl(URL.createObjectURL(candidate));
    setStatus("selected");
  };

  const reset = () => {
    clearUploadTimer();
    setStatus("idle");
    setFile(null);
    setPreviewUrl(null);
    setMeta(null);
    setProgress(0);
    progressRef.current = 0;
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

  const startUpload = () => {
    clearUploadTimer();
    setStatus("uploading");
    setProgress(0);
    progressRef.current = 0;
    intervalRef.current = setInterval(() => {
      const next = Math.min(100, progressRef.current + Math.random() * 12 + 4);
      progressRef.current = next;
      setProgress(next);
      if (next >= 100) {
        clearUploadTimer();
        setStatus("done");
      }
    }, 220);
  };

  const cancelUpload = () => {
    clearUploadTimer();
    setProgress(0);
    progressRef.current = 0;
    setStatus("selected");
  };

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return {
    inputRef,
    status,
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
    cancelUpload,
  };
};

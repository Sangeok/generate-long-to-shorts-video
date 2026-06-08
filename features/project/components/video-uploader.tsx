"use client";

import { useVideoUploader } from "../hooks/use-video-uploader";
import { UploadControlPanel } from "./upload-control-panel";
import { UploadDropzone } from "./upload-dropzone";
import { VideoPreview } from "./video-preview";

export const VideoUploader = () => {
  const {
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
  } = useVideoUploader();

  return (
    <div className="animate-rise">
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="sr-only"
        onChange={handleInputChange}
      />

      {phase === "idle" ? (
        <UploadDropzone
          isDragging={isDragging}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onOpenPicker={openPicker}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.65fr_1fr]">
          <VideoPreview
            previewUrl={previewUrl}
            viewUrl={project?.viewUrl ?? null}
            phase={phase}
            onLoadedMetadata={handleLoadedMetadata}
            onReset={reset}
          />
          <UploadControlPanel
            file={file}
            meta={meta}
            progress={progress}
            phase={phase}
            project={project}
            error={error}
            onChooseDifferentFile={openPicker}
            onReset={reset}
            onUpload={startUpload}
          />
        </div>
      )}

      {error && phase === "selected" && (
        <p className="mt-3 font-mono text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

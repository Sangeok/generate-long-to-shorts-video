"use client";

import { UploadControlPanel } from "./upload-control-panel";
import { UploadDropzone } from "./upload-dropzone";
import { useVideoUploader } from "./use-video-uploader";
import { VideoPreview } from "./video-preview";

export const VideoUploader = () => {
  const {
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

      {status === "idle" ? (
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
            status={status}
            onLoadedMetadata={handleLoadedMetadata}
            onReset={reset}
          />
          <UploadControlPanel
            contentType={contentType}
            language={language}
            file={file}
            meta={meta}
            progress={progress}
            status={status}
            onAnalyze={analyze}
            onChooseDifferentFile={openPicker}
            onContentTypeChange={setContentType}
            onLanguageChange={setLanguage}
            onReset={reset}
            onUpload={startUpload}
          />
        </div>
      )}

      {error && (
        <p className="mt-3 font-mono text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

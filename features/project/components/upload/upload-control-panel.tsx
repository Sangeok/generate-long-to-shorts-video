import { Check, Loader2, RotateCcw, Sparkles, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  CLIP_COUNT_OPTIONS,
  normalizeClipCount,
  PROJECT_CONTENT_TYPES,
  PROJECT_LANGUAGES,
} from "@/constants/generation-limits";

import { formatTimecode } from "../../format";
import type { ProjectContentType, ProjectLanguage } from "../../types";
import type { UploadStatus, VideoMeta } from "./use-video-uploader";

interface UploadControlPanelProps {
  contentType: ProjectContentType;
  clipCount: number;
  language: ProjectLanguage;
  file: File | null;
  meta: VideoMeta | null;
  progress: number;
  status: UploadStatus;
  onAnalyze: () => void;
  onChooseDifferentFile: () => void;
  onClipCountChange: (clipCount: number) => void;
  onContentTypeChange: (contentType: ProjectContentType) => void;
  onLanguageChange: (language: ProjectLanguage) => void;
  onReset: () => void;
  onUpload: () => void;
}

const CONTENT_TYPE_HINTS: Record<ProjectContentType, string> = {
  talk: "Podcast, interview, lecture",
  cinematic: "Movie, drama, action",
};

const formatBytes = (bytes: number) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  const value = bytes / 1024 ** i;
  return `${value.toFixed(value >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
};

const gcd = (a: number, b: number): number => {
  return b === 0 ? a : gcd(b, a % b);
};

const formatAspect = (width: number, height: number) => {
  if (!width || !height) return "--";
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
};

const getExtension = (file: File) => {
  const fromName = file.name.includes(".")
    ? file.name.split(".").pop()
    : undefined;
  const fromType = file.type.split("/")[1];
  return (fromName ?? fromType ?? "video").toUpperCase();
};

const MetaCell = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-sm tabular-nums text-foreground">
        {value}
      </span>
    </div>
  );
};

interface SelectedStateProps {
  file: File | null;
  meta: VideoMeta | null;
  onChooseDifferentFile: () => void;
  onUpload: () => void;
}

const SelectedState = ({
  file,
  meta,
  onChooseDifferentFile,
  onUpload,
}: SelectedStateProps) => {
  return (
    <>
      <div>
        <p className="eyebrow">Selected clip</p>
        <p
          className="mt-2 truncate font-display text-lg font-semibold tracking-tight"
          title={file?.name}
        >
          {file?.name}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 border-y border-border py-4">
        <MetaCell
          label="Duration"
          value={formatTimecode(meta?.duration)}
        />
        <MetaCell
          label="Aspect"
          value={meta ? formatAspect(meta.width, meta.height) : "--"}
        />
        <MetaCell label="Size" value={file ? formatBytes(file.size) : "--"} />
        <MetaCell
          label="Format"
          value={file ? getExtension(file) : "--"}
        />
      </div>
      <div className="mt-auto flex flex-col gap-2">
        <Button type="button" size="lg" onClick={onUpload}>
          <UploadCloud /> Upload video
        </Button>
        <Button type="button" variant="ghost" onClick={onChooseDifferentFile}>
          Choose a different file
        </Button>
      </div>
    </>
  );
};

interface UploadingStateProps {
  file: File | null;
  progress: number;
}

const UploadingState = ({ file, progress }: UploadingStateProps) => {
  return (
    <>
      <div>
        <p className="eyebrow">Uploading</p>
        <p
          className="mt-2 truncate font-display text-lg font-semibold tracking-tight"
          title={file?.name}
        >
          {file?.name}
        </p>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-display text-5xl font-semibold tabular-nums">
          {Math.round(progress)}
        </span>
        <span className="font-mono text-sm text-muted-foreground">%</span>
      </div>
      <Progress value={progress} aria-label="Upload progress" />
      <p className="font-mono text-xs tabular-nums text-muted-foreground">
        {formatBytes((progress / 100) * (file?.size ?? 0))}
        {" / "}
        {formatBytes(file?.size ?? 0)}
      </p>
    </>
  );
};

interface AnalysisSetupStateProps {
  contentType: ProjectContentType;
  clipCount: number;
  language: ProjectLanguage;
  file: File | null;
  isAnalyzing: boolean;
  onAnalyze: () => void;
  onClipCountChange: (clipCount: number) => void;
  onContentTypeChange: (contentType: ProjectContentType) => void;
  onLanguageChange: (language: ProjectLanguage) => void;
  onReset: () => void;
}

const AnalysisSetupState = ({
  contentType,
  clipCount,
  language,
  file,
  isAnalyzing,
  onAnalyze,
  onClipCountChange,
  onContentTypeChange,
  onLanguageChange,
  onReset,
}: AnalysisSetupStateProps) => {
  return (
    <>
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-4" />
        </span>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground">
          Upload complete
        </p>
      </div>
      <p
        className="truncate font-display text-lg font-semibold tracking-tight"
        title={file?.name}
      >
        {file?.name}
      </p>
      <p className="text-sm text-muted-foreground">
        Run AI analysis to transcribe the video and prepare shorts.
      </p>
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted-foreground">
          Content type
        </span>
        <ToggleGroup
          value={[contentType]}
          onValueChange={(value) => {
            const next = value[0] as ProjectContentType | undefined;
            if (next) onContentTypeChange(next);
          }}
          variant="outline"
          size="sm"
          spacing={0}
          disabled={isAnalyzing}
        >
          {PROJECT_CONTENT_TYPES.map((type) => (
            <ToggleGroupItem key={type.value} value={type.value}>
              {type.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="text-xs text-muted-foreground">
          {CONTENT_TYPE_HINTS[contentType]}
          {contentType === "cinematic" &&
            " — analyzes the video itself, so it takes longer."}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted-foreground">
          Language
        </span>
        <ToggleGroup
          value={[language]}
          onValueChange={(value) => {
            const next = value[0] as ProjectLanguage | undefined;
            if (next) onLanguageChange(next);
          }}
          variant="outline"
          size="sm"
          spacing={0}
          disabled={isAnalyzing}
        >
          {PROJECT_LANGUAGES.map((item) => (
            <ToggleGroupItem key={item.value} value={item.value}>
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="text-xs text-muted-foreground">
          Spoken language of the video — sets transcription accuracy.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted-foreground">
          Clip count
        </span>
        <ToggleGroup
          value={[String(clipCount)]}
          onValueChange={(value) => {
            const next = value[0];
            if (next) onClipCountChange(normalizeClipCount(next));
          }}
          variant="outline"
          size="sm"
          spacing={0}
          disabled={isAnalyzing}
        >
          {CLIP_COUNT_OPTIONS.map((count) => (
            <ToggleGroupItem key={count} value={String(count)}>
              {count}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div className="mt-auto flex flex-col gap-2">
        <Button
          type="button"
          size="lg"
          onClick={onAnalyze}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="animate-spin" /> Starting analysis…
            </>
          ) : (
            <>
              <Sparkles /> AI analysis
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onReset}
          disabled={isAnalyzing}
        >
          <RotateCcw /> Upload another
        </Button>
      </div>
    </>
  );
};

export const UploadControlPanel = ({
  contentType,
  clipCount,
  language,
  file,
  meta,
  progress,
  status,
  onAnalyze,
  onChooseDifferentFile,
  onClipCountChange,
  onContentTypeChange,
  onLanguageChange,
  onReset,
  onUpload,
}: UploadControlPanelProps) => {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5">
      {status === "selected" && (
        <SelectedState
          file={file}
          meta={meta}
          onChooseDifferentFile={onChooseDifferentFile}
          onUpload={onUpload}
        />
      )}

      {status === "uploading" && (
        <UploadingState file={file} progress={progress} />
      )}

      {(status === "done" || status === "analyzing") && (
        <AnalysisSetupState
          contentType={contentType}
          clipCount={clipCount}
          language={language}
          file={file}
          isAnalyzing={status === "analyzing"}
          onAnalyze={onAnalyze}
          onClipCountChange={onClipCountChange}
          onContentTypeChange={onContentTypeChange}
          onLanguageChange={onLanguageChange}
          onReset={onReset}
        />
      )}
    </div>
  );
};

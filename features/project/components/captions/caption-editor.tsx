"use client";

import { Loader2, Play, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { updateShortCaptions } from "../../actions";
import { ClipNotReadyError, getClipUrl } from "../../api/get-clip-url";
import { isSameCaptionStyle } from "../../caption-style";
import { formatTimecode } from "../../format";
import type { CaptionSegment, CaptionStyle } from "../../types";
import { CaptionStyleControls } from "./caption-style-controls";
import { ClipPlayer } from "./clip-player";

// 클립은 프로젝트 완료 후 렌더되므로, 진입 시점에 아직 준비 안 됐으면 폴링한다.
const CLIP_POLL_INTERVAL_MS = 4000;

// 재생헤드에 새 캡션을 꽂을 때 기본으로 부여하는 길이(초).
const NEW_CUE_LENGTH_SEC = 2;

// 에디터 안에서만 쓰는 편집용 큐. id는 추가/삭제 시 리스트 key를 안정화한다.
interface DraftCue {
  id: string;
  start: number;
  end: number;
  text: string;
}

interface CaptionEditorProps {
  projectId: string;
  shortId: string;
  durationSec: number | null;
  segments: CaptionSegment[];
  captionStyle: CaptionStyle;
}

function sameCues(a: DraftCue[], b: DraftCue[]): boolean {
  if (a.length !== b.length) return false;
  return a.every(
    (cue, index) =>
      cue.start === b[index].start &&
      cue.end === b[index].end &&
      cue.text === b[index].text,
  );
}

export const CaptionEditor = ({
  projectId,
  shortId,
  durationSec,
  segments,
  captionStyle,
}: CaptionEditorProps) => {
  const [cues, setCues] = useState<DraftCue[]>(() =>
    segments.map((segment) => ({ id: crypto.randomUUID(), ...segment })),
  );
  const [savedCues, setSavedCues] = useState<DraftCue[]>(cues);
  const [style, setStyle] = useState(captionStyle);
  const [savedStyle, setSavedStyle] = useState(captionStyle);
  const [isSaving, setIsSaving] = useState(false);
  const [clipUrl, setClipUrl] = useState<string | null>(null);
  const [isClipFailed, setIsClipFailed] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const textareaRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    // 404는 "아직 렌더 중"이므로 준비될 때까지 폴링하고, 실제 실패만 에러로 표시.
    const loadClip = async () => {
      try {
        const url = await getClipUrl(projectId, shortId);
        if (!cancelled) setClipUrl(url);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ClipNotReadyError) {
          timer = setTimeout(loadClip, CLIP_POLL_INTERVAL_MS);
        } else {
          setIsClipFailed(true);
        }
      }
    };

    loadClip();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [projectId, shortId]);

  // 프리뷰는 저장 여부와 무관하게 편집 중인 큐를 그대로 반영한다.
  const previewSegments = useMemo<CaptionSegment[]>(
    () => cues.map(({ start, end, text }) => ({ start, end, text })),
    [cues],
  );

  const activeId = cues.find(
    (cue) => currentTime >= cue.start && currentTime < cue.end,
  )?.id;
  const isDirty =
    !sameCues(cues, savedCues) || !isSameCaptionStyle(style, savedStyle);

  const handleTextChange = (id: string, value: string) => {
    setCues((prev) =>
      prev.map((cue) => (cue.id === id ? { ...cue, text: value } : cue)),
    );
  };

  const handleTimeChange = (id: string, field: "start" | "end", value: number) => {
    // 빈/비정상 입력(NaN)은 무시해 서버가 버릴 큐가 로컬에 남지 않게 한다.
    if (!Number.isFinite(value)) return;
    setCues((prev) =>
      prev.map((cue) =>
        cue.id === id ? { ...cue, [field]: Math.max(0, value) } : cue,
      ),
    );
  };

  const registerTextarea = (id: string, el: HTMLTextAreaElement | null) => {
    if (el) textareaRefs.current.set(id, el);
    else textareaRefs.current.delete(id);
  };

  const handleSeek = (cue: DraftCue) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = cue.start;
    video.play().catch(() => {});
  };

  const handleDelete = (id: string) => {
    setCues((prev) => prev.filter((cue) => cue.id !== id));
  };

  // 재생헤드 위치에 빈 캡션을 꽂는다. end는 기본 길이/다음 큐/클립 끝 중 가장
  // 빠른 지점으로 잡아 겹침을 줄이고, start 기준 정렬해 보이는 위치에 삽입한다.
  const handleAddAtPlayhead = () => {
    const start = currentTime;
    const nextStart = cues
      .filter((cue) => cue.start > start)
      .reduce((min, cue) => Math.min(min, cue.start), Number.POSITIVE_INFINITY);
    const cap = durationSec ?? videoRef.current?.duration ?? Number.POSITIVE_INFINITY;
    const candidate = Math.min(start + NEW_CUE_LENGTH_SEC, nextStart, cap);
    const end = candidate > start ? candidate : start + NEW_CUE_LENGTH_SEC;

    const id = crypto.randomUUID();
    setCues((prev) =>
      [...prev, { id, start, end, text: "" }].sort((a, b) => a.start - b.start),
    );
    // 새 행이 마운트된 다음 프레임에 해당 textarea로 포커스/스크롤한다.
    requestAnimationFrame(() => {
      const el = textareaRefs.current.get(id);
      if (el) {
        el.focus();
        el.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    });
  };

  const handleSave = async () => {
    if (!isDirty || isSaving) return;

    const sanitized = cues
      .map((cue) => ({ ...cue, text: cue.text.trim() }))
      .filter((cue) => cue.text.length > 0)
      .sort((a, b) => a.start - b.start);

    if (sanitized.some((cue) => cue.end <= cue.start)) {
      toast.error("Each caption's end time must be after its start time.");
      return;
    }

    setIsSaving(true);
    try {
      await updateShortCaptions(
        shortId,
        sanitized.map(({ start, end, text }) => ({ start, end, text })),
        style,
      );
      setCues(sanitized);
      setSavedCues(sanitized);
      setSavedStyle(style);
      toast.success("Captions saved.");
    } catch {
      toast.error("Couldn't save captions. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_1fr]">
      <div className="relative aspect-[9/16] w-full max-w-[22rem] self-start overflow-hidden rounded-2xl border border-border bg-background">
        {clipUrl ? (
          <ClipPlayer
            src={clipUrl}
            segments={previewSegments}
            style={style}
            videoRef={videoRef}
            onTimeChange={setCurrentTime}
          />
        ) : isClipFailed ? (
          <div className="grid size-full place-items-center px-6 text-center text-sm text-muted-foreground">
            Couldn&apos;t load the clip preview.
          </div>
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
            <span className="font-mono text-[0.625rem] uppercase tracking-[0.2em]">
              Preparing clip…
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <p className="eyebrow">Captions</p>
          <Button onClick={handleSave} disabled={!isDirty || isSaving} size="sm">
            {isSaving && <Loader2 className="animate-spin" />}
            {isDirty ? "Save changes" : "Saved"}
          </Button>
        </div>

        <CaptionStyleControls style={style} onChange={setStyle} />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddAtPlayhead}
          disabled={!clipUrl}
          className="self-start"
        >
          <Plus className="size-3.5" />
          Add caption at {formatTimecode(currentTime)}
        </Button>

        <ul className="flex flex-col gap-2">
          {cues.map((cue) => (
            <CueRow
              key={cue.id}
              cue={cue}
              isActive={cue.id === activeId}
              onSeek={handleSeek}
              onTimeChange={handleTimeChange}
              onTextChange={handleTextChange}
              onDelete={handleDelete}
              registerTextarea={registerTextarea}
            />
          ))}
        </ul>
      </div>
    </div>
  );
};

interface CueRowProps {
  cue: DraftCue;
  isActive: boolean;
  onSeek: (cue: DraftCue) => void;
  onTimeChange: (id: string, field: "start" | "end", value: number) => void;
  onTextChange: (id: string, value: string) => void;
  onDelete: (id: string) => void;
  registerTextarea: (id: string, el: HTMLTextAreaElement | null) => void;
}

const CueRow = ({
  cue,
  isActive,
  onSeek,
  onTimeChange,
  onTextChange,
  onDelete,
  registerTextarea,
}: CueRowProps) => {
  return (
    <li
      className={cn(
        "flex flex-col gap-2 rounded-xl border border-border bg-card p-3 transition-colors",
        isActive && "border-primary/60",
      )}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSeek(cue)}
          title="Seek to start"
          className="text-muted-foreground transition-colors hover:text-primary"
        >
          <Play className="size-3.5" />
        </button>
        <input
          type="number"
          min={0}
          step={0.1}
          value={Number(cue.start.toFixed(2))}
          onChange={(event) =>
            onTimeChange(cue.id, "start", Number(event.target.value))
          }
          aria-label="Start time (seconds)"
          className="w-16 rounded-md border border-border bg-background px-1.5 py-0.5 font-mono text-[0.7rem] tabular-nums"
        />
        <span className="text-xs text-muted-foreground">–</span>
        <input
          type="number"
          min={0}
          step={0.1}
          value={Number(cue.end.toFixed(2))}
          onChange={(event) =>
            onTimeChange(cue.id, "end", Number(event.target.value))
          }
          aria-label="End time (seconds)"
          className="w-16 rounded-md border border-border bg-background px-1.5 py-0.5 font-mono text-[0.7rem] tabular-nums"
        />
        <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-muted-foreground">
          {formatTimecode(cue.start)}
        </span>
        <button
          type="button"
          onClick={() => onDelete(cue.id)}
          title="Delete caption"
          className="ml-auto text-muted-foreground transition-colors hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
      <Textarea
        ref={(el) => registerTextarea(cue.id, el)}
        value={cue.text}
        onChange={(event) => onTextChange(cue.id, event.target.value)}
        rows={2}
        placeholder="Caption text…"
        className="min-h-0 resize-none"
      />
    </li>
  );
};

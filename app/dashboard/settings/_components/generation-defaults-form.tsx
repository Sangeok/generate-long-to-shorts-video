"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  CLIP_COUNT_OPTIONS,
  normalizeClipCount,
} from "@/constants/generation-limits";
import { CaptionStyleControls, parseCaptionStyle } from "@/features/project";
import type {
  CaptionStyle,
  ProjectContentType,
  ProjectLanguage,
} from "@/features/project";
import { updateGenerationDefaults } from "@/features/settings/actions";

interface GenerationDefaultsFormProps {
  language: string;
  contentType: string;
  clipCount: number;
  captionStyle: unknown;
}

const LANGUAGES: { value: ProjectLanguage; label: string }[] = [
  { value: "en", label: "English" },
  { value: "ko", label: "한국어" },
];

const CONTENT_TYPES: { value: ProjectContentType; label: string }[] = [
  { value: "talk", label: "Talk" },
  { value: "cinematic", label: "Cinematic" },
];

export const GenerationDefaultsForm = ({
  language: initialLanguage,
  contentType: initialContentType,
  clipCount: initialClipCount,
  captionStyle: initialCaptionStyle,
}: GenerationDefaultsFormProps) => {
  const [language, setLanguage] = useState<ProjectLanguage>(
    initialLanguage === "ko" ? "ko" : "en",
  );
  const [contentType, setContentType] = useState<ProjectContentType>(
    initialContentType === "cinematic" ? "cinematic" : "talk",
  );
  const [style, setStyle] = useState<CaptionStyle>(() =>
    parseCaptionStyle(initialCaptionStyle),
  );
  const [clipCount, setClipCount] = useState(() =>
    normalizeClipCount(initialClipCount),
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateGenerationDefaults({
        language,
        contentType,
        clipCount: normalizeClipCount(clipCount),
        captionStyle: style,
      });
      toast.success("Defaults saved.");
    } catch {
      toast.error("Couldn't save defaults.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div>
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Generation defaults
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pre-fills your next upload and caption editor. Existing projects are
          unchanged.
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
            if (next) setLanguage(next);
          }}
          variant="outline"
          size="sm"
          spacing={0}
        >
          {LANGUAGES.map((item) => (
            <ToggleGroupItem key={item.value} value={item.value}>
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted-foreground">
          Content type
        </span>
        <ToggleGroup
          value={[contentType]}
          onValueChange={(value) => {
            const next = value[0] as ProjectContentType | undefined;
            if (next) setContentType(next);
          }}
          variant="outline"
          size="sm"
          spacing={0}
        >
          {CONTENT_TYPES.map((item) => (
            <ToggleGroupItem key={item.value} value={item.value}>
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted-foreground">
          Clip count
        </span>
        <ToggleGroup
          value={[String(clipCount)]}
          onValueChange={(value) => {
            const next = value[0];
            if (next) setClipCount(normalizeClipCount(next));
          }}
          variant="outline"
          size="sm"
          spacing={0}
        >
          {CLIP_COUNT_OPTIONS.map((count) => (
            <ToggleGroupItem key={count} value={String(count)}>
              {count}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted-foreground">
          Default caption style
        </span>
        <CaptionStyleControls style={style} onChange={setStyle} />
      </div>

      <div className="flex justify-end border-t border-border pt-4">
        <Button type="button" onClick={handleSave} disabled={isSaving}>
          <Sparkles /> {isSaving ? "Saving…" : "Save defaults"}
        </Button>
      </div>
    </section>
  );
};

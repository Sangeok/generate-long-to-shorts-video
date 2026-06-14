"use client";

import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

import {
  CAPTION_FONTS,
  CAPTION_SIZES,
  DEFAULT_CAPTION_STYLE,
  isSameCaptionStyle,
} from "../../caption-style";
import type {
  CaptionAnimation,
  CaptionFont,
  CaptionPosition,
  CaptionSize,
  CaptionStyle,
} from "../../types";

interface CaptionStyleControlsProps {
  style: CaptionStyle;
  onChange: (style: CaptionStyle) => void;
}

// Caption content colors, not UI chrome — raw values are intentional, the
// same way the preview overlay imitates video pixels.
const CAPTION_COLORS = [
  "#ffffff",
  "#000000",
  "#fde047",
  "#4ade80",
  "#38bdf8",
  "#f472b6",
];

const PRESETS: { label: string; style: CaptionStyle }[] = [
  { label: "Classic", style: DEFAULT_CAPTION_STYLE },
  {
    label: "Highlight",
    style: { ...DEFAULT_CAPTION_STYLE, textColor: "#fde047" },
  },
  {
    label: "Block",
    style: { ...DEFAULT_CAPTION_STYLE, edge: "box" },
  },
];

const POSITIONS: { value: CaptionPosition; label: string }[] = [
  { value: "top", label: "Top" },
  { value: "middle", label: "Middle" },
  { value: "bottom", label: "Bottom" },
];

const ANIMATIONS: { value: CaptionAnimation; label: string }[] = [
  { value: "none", label: "None" },
  { value: "fade", label: "Fade" },
  { value: "pop", label: "Pop" },
];

const ColorSwatches = ({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (color: string) => void;
}) => (
  <div className="flex items-center gap-1.5">
    {CAPTION_COLORS.map((color) => (
      <button
        key={color}
        type="button"
        onClick={() => onSelect(color)}
        aria-label={color}
        aria-pressed={color === selected}
        className={cn(
          "grid size-6 place-items-center rounded-full border border-border transition-shadow",
          color === selected && "ring-2 ring-ring ring-offset-2 ring-offset-card",
        )}
        style={{ backgroundColor: color }}
      >
        {color === selected && (
          <Check
            className="size-3.5"
            style={{ color: color === "#ffffff" ? "#000000" : "#ffffff" }}
          />
        )}
      </button>
    ))}
  </div>
);

const ControlRow = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-center justify-between gap-4">
    <span className="text-sm text-muted-foreground">{label}</span>
    {children}
  </div>
);

export const CaptionStyleControls = ({
  style,
  onChange,
}: CaptionStyleControlsProps) => {
  const patch = (changes: Partial<CaptionStyle>) =>
    onChange({ ...style, ...changes });

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        {PRESETS.map((preset) => (
          <Button
            key={preset.label}
            variant={
              isSameCaptionStyle(style, preset.style) ? "secondary" : "outline"
            }
            size="sm"
            onClick={() => onChange(preset.style)}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      <ControlRow label="Font">
        <NativeSelect
          size="sm"
          value={style.font}
          onChange={(event) =>
            patch({ font: event.target.value as CaptionFont })
          }
        >
          {(Object.keys(CAPTION_FONTS) as CaptionFont[]).map((font) => (
            <NativeSelectOption key={font} value={font}>
              {CAPTION_FONTS[font].label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </ControlRow>

      <ControlRow label="Size">
        <ToggleGroup
          value={[style.size]}
          onValueChange={(value) => {
            const size = value[0] as CaptionSize | undefined;
            if (size) patch({ size });
          }}
          variant="outline"
          size="sm"
          spacing={0}
        >
          {(Object.keys(CAPTION_SIZES) as CaptionSize[]).map((size) => (
            <ToggleGroupItem key={size} value={size}>
              {CAPTION_SIZES[size].label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </ControlRow>

      <ControlRow label="Position">
        <ToggleGroup
          value={[style.position]}
          onValueChange={(value) => {
            const position = value[0] as CaptionPosition | undefined;
            if (position) patch({ position });
          }}
          variant="outline"
          size="sm"
          spacing={0}
        >
          {POSITIONS.map((position) => (
            <ToggleGroupItem key={position.value} value={position.value}>
              {position.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </ControlRow>

      <ControlRow label="Edge">
        <ToggleGroup
          value={[style.edge]}
          onValueChange={(value) => {
            const edge = value[0] as CaptionStyle["edge"] | undefined;
            if (edge) patch({ edge });
          }}
          variant="outline"
          size="sm"
          spacing={0}
        >
          <ToggleGroupItem value="outline">Outline</ToggleGroupItem>
          <ToggleGroupItem value="box">Box</ToggleGroupItem>
        </ToggleGroup>
      </ControlRow>

      <ControlRow label="Text color">
        <ColorSwatches
          selected={style.textColor}
          onSelect={(textColor) => patch({ textColor })}
        />
      </ControlRow>

      <ControlRow label={style.edge === "box" ? "Box color" : "Outline color"}>
        <ColorSwatches
          selected={style.edgeColor}
          onSelect={(edgeColor) => patch({ edgeColor })}
        />
      </ControlRow>

      <ControlRow label="Uppercase">
        <Switch
          checked={style.uppercase}
          onCheckedChange={(uppercase) => patch({ uppercase })}
        />
      </ControlRow>

      <ControlRow label="Animation">
        <ToggleGroup
          value={[style.animation]}
          onValueChange={(value) => {
            const animation = value[0] as CaptionAnimation | undefined;
            if (animation) patch({ animation });
          }}
          variant="outline"
          size="sm"
          spacing={0}
        >
          {ANIMATIONS.map((animation) => (
            <ToggleGroupItem key={animation.value} value={animation.value}>
              {animation.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </ControlRow>
    </div>
  );
};

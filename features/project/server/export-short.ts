import "server-only";

import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { inngest } from "@/lib/inngest";

import { parseCaptionStyle } from "../caption-style";
import { parseSegments } from "../captions";
import { buildAss, splitSegmentsForCaptions } from "./captions";
import { downloadSource, runFfmpeg } from "./ffmpeg";
import {
  getShortForExportOrThrow,
  setShortExportError,
  setShortExportKey,
} from "./project-repository";
import { presignGetUrl } from "./s3-presign";
import { uploadObject } from "./s3-upload";

// The dev IAM user only allows s3:PutObject under uploads/*.
const EXPORT_KEY_PREFIX = "uploads/exports";

// Burns the current captions into the pre-cut base clip. No crop or trim —
// only the subtitles filter — so this pass stays fast.
export const exportShort = inngest.createFunction(
  {
    id: "export-short",
    retries: 1,
    triggers: [{ event: "project/short.export.requested" }],
    onFailure: async ({ event, error }) => {
      const { shortId } = event.data.event.data as { shortId: string };
      await setShortExportError(shortId, error.message);
    },
  },
  async ({ event, step }) => {
    const { shortId } = event.data as { shortId: string };

    const short = await step.run("load-short", async () => {
      const row = await getShortForExportOrThrow(shortId);
      return {
        ...row,
        segments: parseSegments(row.segments),
      };
    });
    if (short.exportKey) {
      return { shortId, exportKey: short.exportKey, skipped: true };
    }
    if (!short.clipKey) {
      throw new Error("Base clip is not rendered yet");
    }

    const exportKey = await step.run("burn-captions", async () => {
      const clipUrl = await presignGetUrl(short.clipKey as string);
      const tempDir = await mkdtemp(path.join(os.tmpdir(), "export-"));
      const baseName = "base.mp4";
      const assName = "captions.ass";
      const outputName = "export.mp4";

      const style = parseCaptionStyle(short.captionStyle);

      try {
        await downloadSource(clipUrl, path.join(tempDir, baseName));
        const cues = splitSegmentsForCaptions(short.segments).map((cue) =>
          style.uppercase ? { ...cue, text: cue.text.toUpperCase() } : cue,
        );
        await writeFile(
          path.join(tempDir, assName),
          buildAss(cues, style),
          "utf8",
        );

        await runFfmpeg(
          [
            "-y",
            "-i",
            baseName,
            "-vf",
            `subtitles=${assName}`,
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-crf",
            "23",
            "-c:a",
            "copy",
            "-movflags",
            "+faststart",
            outputName,
          ],
          tempDir,
        );

        const key = `${EXPORT_KEY_PREFIX}/${short.projectId}/${short.id}.mp4`;
        await uploadObject(
          key,
          await readFile(path.join(tempDir, outputName)),
          "video/mp4",
        );
        await setShortExportKey(short.id, key);
        return key;
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });

    return { shortId, exportKey };
  },
);

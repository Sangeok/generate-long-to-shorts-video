import "server-only";

import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { inngest } from "@/lib/inngest";

import { downloadSource, runFfmpeg } from "./ffmpeg";
import {
  getProjectVideoKey,
  getShortsForRender,
  markPendingShortsFailed,
  setShortClipKey,
  setShortRenderError,
} from "./project-repository";
import { presignGetUrl } from "./s3-presign";
import { uploadObject } from "./s3-upload";

// Fit the centre ~70% of the frame (sides cropped) into a 45%-height band,
// filling the top/bottom with a blurred, zoomed copy of the same frame.
const BLUR_FILL_FILTER =
  "split=2[bg][fg];" +
  "[bg]scale=1080:1920:force_original_aspect_ratio=increase," +
  "crop=1080:1920,gblur=sigma=20[bg];" +
  "[fg]crop=ih*1.25:ih,scale=1080:864[fg];" +
  "[bg][fg]overlay=(W-w)/2:(H-h)/2";

// The dev IAM user only allows s3:PutObject under uploads/*, so rendered
// clips live there as well.
const CLIP_KEY_PREFIX = "uploads/clips";

interface RenderTarget {
  id: string;
  startSec: number;
  endSec: number;
}

// Base clips are rendered without captions; subtitles are overlaid in the
// browser for preview and burned in by export-short at download time.
async function renderClipFile(
  tempDir: string,
  sourceName: string,
  target: RenderTarget,
  outputName: string,
  videoFilter: string,
): Promise<void> {
  await runFfmpeg(
    [
      "-y",
      "-ss",
      String(target.startSec),
      "-i",
      sourceName,
      "-t",
      String(target.endSec - target.startSec),
      "-vf",
      videoFilter,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "23",
      "-c:a",
      "aac",
      "-movflags",
      "+faststart",
      outputName,
    ],
    tempDir,
  );
}

export const renderClips = inngest.createFunction(
  {
    id: "render-clips",
    retries: 1,
    triggers: [{ event: "project/shorts.detected" }],
    // Run-level failures (e.g. source download) never reach the per-short
    // handling below, so pending shorts are settled here to stop the UI from
    // polling a clip that will never arrive.
    onFailure: async ({ event, error }) => {
      const { projectId } = event.data.event.data as { projectId: string };
      await markPendingShortsFailed(projectId, error.message);
    },
  },
  async ({ event, step }) => {
    const { projectId } = event.data as { projectId: string };

    const shorts = await step.run("load-shorts", async () => {
      return getShortsForRender(projectId);
    });
    if (shorts.length === 0) {
      return { projectId, rendered: 0 };
    }

    // Single step: the downloaded source lives in a temp dir that would not
    // survive across separate step invocations.
    const results = await step.run("render-clips", async () => {
      const { videoKey } = await getProjectVideoKey(projectId);
      const sourceUrl = await presignGetUrl(videoKey);
      const tempDir = await mkdtemp(path.join(os.tmpdir(), "clips-"));
      const sourceName = "source.mp4";

      try {
        await downloadSource(sourceUrl, path.join(tempDir, sourceName));

        const outcomes: { shortId: string; clipKey?: string; error?: string }[] =
          [];
        for (const short of shorts) {
          // Failures are recorded per short so one bad clip never blocks the rest.
          const outputName = `${short.id}.mp4`;
          try {
            await renderClipFile(
              tempDir,
              sourceName,
              short,
              outputName,
              BLUR_FILL_FILTER,
            );
            const clipKey = `${CLIP_KEY_PREFIX}/${projectId}/${short.id}.mp4`;
            await uploadObject(
              clipKey,
              await readFile(path.join(tempDir, outputName)),
              "video/mp4",
            );
            await setShortClipKey(short.id, clipKey);
            outcomes.push({ shortId: short.id, clipKey });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            await setShortRenderError(short.id, message);
            outcomes.push({ shortId: short.id, error: message });
          }
        }
        return outcomes;
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });

    return { projectId, rendered: results.filter((r) => r.clipKey).length };
  },
);

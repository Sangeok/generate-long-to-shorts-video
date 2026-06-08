import { serve } from "inngest/next";

import { processUploadedVideo } from "@/features/project/server";
import { inngest } from "@/lib/inngest";

export const runtime = "nodejs";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processUploadedVideo],
});

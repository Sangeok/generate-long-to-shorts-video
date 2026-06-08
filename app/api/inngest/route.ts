import { serve } from "inngest/next";

import { processUploadedVideo } from "@/features/video/server";
import { inngest } from "@/lib/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processUploadedVideo],
});

import { serve } from "inngest/next";

import { transcribeVideo } from "@/features/project/server";
import { inngest } from "@/lib/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [transcribeVideo],
});

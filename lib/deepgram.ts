import "server-only";

import { DeepgramClient } from "@deepgram/sdk";

let client: DeepgramClient | undefined;

export function getDeepgramClient(): DeepgramClient {
  if (!client) {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      throw new Error("DEEPGRAM_API_KEY is required");
    }
    client = new DeepgramClient({ apiKey });
  }
  return client;
}

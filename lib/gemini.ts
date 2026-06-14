import "server-only";

import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | undefined;

export function getGeminiClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is required");
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

import * as functions from "firebase-functions";
import {defineSecret} from "firebase-functions/params";
import OpenAI from "openai";
import {FUNCTIONS_REGION} from "../config";

const openaiApiKey = defineSecret("OPENAI_API_KEY");

interface SummaryPayload {
  messages: {
    text: string;
    sender?: string;
    timestamp?: string;
  }[];
}

const SYSTEM_PROMPT = `You are an assistant for busy parents who need quick context on chat threads.
Write a short paragraph (2-3 sentences) summarizing the key updates, decisions, and follow-ups from the supplied messages.
Highlight schedule changes, commitments, or action items.
If nothing meaningful happened, respond with "No significant updates."`;

export const conversationSummary = functions
  .region(FUNCTIONS_REGION)
  .runWith({
    secrets: [openaiApiKey],
    timeoutSeconds: 180,
    memory: "256MB",
  })
  .https.onCall(async (data: SummaryPayload) => {
    try {
      if (!data || !Array.isArray(data.messages) || data.messages.length === 0) {
        return {summary: null, error: "No messages provided"};
      }

      const trimmed = data.messages
        .filter((entry) => entry && typeof entry.text === "string" && entry.text.trim().length > 0)
        .slice(0, 20)
        .map((entry) => ({
          text: entry.text.trim().slice(0, 600),
          sender: entry.sender ? String(entry.sender).slice(0, 100) : undefined,
          timestamp: entry.timestamp,
        }));

      if (trimmed.length === 0) {
        return {summary: null, error: "No valid message content"};
      }

      const serialized = trimmed
        .map((entry) => {
          const prefix = entry.sender ? `${entry.sender}: ` : "";
          return `${prefix}${entry.text}`;
        })
        .join("\n");

      const client = new OpenAI({
        apiKey: openaiApiKey.value(),
      });

      const response = await client.chat.completions.create({
        model: "gpt-4-turbo-preview",
        temperature: 0.2,
        max_tokens: 220,
        messages: [
          {role: "system", content: SYSTEM_PROMPT},
          {
            role: "user",
            content: `Summarize these chat excerpts:\n${serialized}`,
          },
        ],
      });

      const summary = response.choices[0]?.message?.content?.trim() ?? null;
      return {summary};
    } catch (error) {
      functions.logger.error("conversationSummary error", {error});
      return {
        summary: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

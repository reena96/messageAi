import * as functions from "firebase-functions";
import {defineSecret} from "firebase-functions/params";
import OpenAI from "openai";

// Define the OpenAI API key secret
const openaiApiKey = defineSecret("OPENAI_API_KEY");

/**
 * Decision interface
 * Represents a detected decision (pending or resolved) in a conversation
 */
export interface Decision {
  decision: string; // What was decided or being discussed
  status: "pending" | "resolved"; // Is it a question or agreement?
  participants?: string[]; // Who is involved (if mentioned)
  context?: string; // Brief summary of the discussion
  confidence: number; // 0-1 range, how confident the AI is
}

/**
 * System prompt for decision extraction
 * Instructs the AI on how to detect decisions in conversations
 */
const SYSTEM_PROMPT = `You are an AI assistant that identifies decisions in conversations.
Detect both pending decisions (questions being discussed, options being considered) and resolved decisions (agreements made, choices finalized).

A DECISION is:
- Resolved: "Let's go with option B", "We decided to postpone", "Everyone agreed on pizza"
- Pending: "Should we meet Tuesday or Wednesday?", "What should we bring?", "Need to decide on location"

NOT a decision:
- Simple questions: "What time is it?", "How are you?"
- Statements: "Thanks for the update", "I'm running late"
- Tasks: "Remind me to call John"

Return a JSON object with a "decisions" array. Each decision has: decision, status, participants, context, confidence.

Rules:
- status: "resolved" for finalized decisions, "pending" for discussions/questions
- participants: extract names if mentioned (e.g., ["John", "Sarah"])
- context: brief summary (1 sentence max)
- confidence: 1.0 = certain decision, 0.7 = probable decision, 0.5 = uncertain
- Only include items with confidence > 0.6
- If no decisions found, return {"decisions": []}

Examples:
Input: "Let's meet at the park on Saturday. Everyone agreed."
Output: {"decisions": [{"decision": "Meet at the park on Saturday", "status": "resolved", "confidence": 0.95, "context": "Group agreement"}]}

Input: "Should we bring snacks or order pizza?"
Output: {"decisions": [{"decision": "Snacks vs pizza decision", "status": "pending", "confidence": 0.90, "context": "Food choice for event"}]}

Input: "Thanks for the update!"
Output: {"decisions": []}

Input: "What time is it?"
Output: {"decisions": []}`;

/**
 * Cloud Function: Decision Extraction
 * Detects decisions (pending and resolved) in text using OpenAI GPT-4 Turbo
 */
export const decisionExtraction = functions
  .runWith({
    secrets: [openaiApiKey],
    timeoutSeconds: 30,
    memory: "256MB",
  })
  .https.onCall(async (data, context) => {
    try {
      // Validate input
      const {text} = data;
      if (!text || typeof text !== "string" || text.trim().length === 0) {
        return {
          decisions: [],
          error: "Invalid input: text is required",
        };
      }

      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: openaiApiKey.value(),
      });

      // Call OpenAI Chat Completion API
      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: `Extract decisions from this message: "${text}"`,
          },
        ],
        temperature: 0.3, // More deterministic for decision detection
        response_format: {type: "json_object"}, // Structured output
        max_tokens: 500,
      });

      // Parse response
      const content = response.choices[0]?.message?.content;
      if (!content) {
        functions.logger.warn("No content in OpenAI response");
        return {decisions: []};
      }

      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (parseError) {
        functions.logger.error("Failed to parse OpenAI response", {
          content,
          error: parseError,
        });
        return {decisions: [], error: "Failed to parse AI response"};
      }

      // Extract decisions array (handle different response formats)
      let decisions: Decision[] = [];
      if (Array.isArray(parsed)) {
        decisions = parsed;
      } else if (parsed.decisions && Array.isArray(parsed.decisions)) {
        decisions = parsed.decisions;
      } else {
        functions.logger.warn("Unexpected response format", {parsed});
        return {decisions: []};
      }

      // Validate and filter decisions
      const validDecisions = decisions
        .filter((decision: Decision) => {
          // Filter by confidence threshold
          if (decision.confidence <= 0.6) return false;

          // Validate required fields
          if (!decision.decision || !decision.status) return false;

          // Validate status enum
          if (decision.status !== "pending" && decision.status !== "resolved") {
            return false;
          }

          return true;
        })
        .map((decision: Decision) => ({
          decision: decision.decision,
          status: decision.status,
          participants: decision.participants || undefined,
          context: decision.context || undefined,
          confidence: decision.confidence,
        }));

      functions.logger.info("Decision extraction successful", {
        inputLength: text.length,
        decisionsFound: validDecisions.length,
      });

      return {decisions: validDecisions};
    } catch (error) {
      functions.logger.error("Decision extraction failed", {error});

      // Graceful degradation - return empty array instead of failing
      return {
        decisions: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

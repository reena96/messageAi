import * as functions from "firebase-functions";
import {defineSecret} from "firebase-functions/params";
import OpenAI from "openai";
import {FUNCTIONS_REGION} from "../config";

// Define the OpenAI API key secret
const openaiApiKey = defineSecret("OPENAI_API_KEY");

/**
 * RSVP interface
 * Represents RSVP tracking data extracted from messages
 */
export interface RSVP {
  isInvitation: boolean; // Is this an invitation to an event?
  isResponse: boolean; // Is this an RSVP response?
  event?: string; // What event is it for
  response?: "yes" | "no" | "maybe"; // User's response
  responses?: { yes: number; no: number; maybe: number }; // Aggregate counts
  details?: string; // Additional context
  confidence: number; // 0-1 range
}

/**
 * System prompt for RSVP tracking
 */
const SYSTEM_PROMPT = `You are an AI assistant that tracks RSVPs and invitations for events.

Detect two types of messages:
1. INVITATIONS: Messages inviting people to events
   - Extract: event name/description, any details
   - Set isInvitation=true

2. RSVP RESPONSES: Messages responding to invitations
   - Detect: yes ('I'll be there', 'count me in'), no ('can't make it', 'sorry'), maybe ('might come', 'not sure')
   - Set isResponse=true, response=yes/no/maybe

Return JSON with: isInvitation, isResponse, event, response, details, confidence.
Confidence: 1.0 = certain, 0.5 = uncertain.
Only mark as invitation/response if confidence > 0.7.

Examples:
Input: "Pizza party Friday! Who's coming?"
Output: {"isInvitation": true, "isResponse": false, "event": "Pizza party Friday", "confidence": 0.95}

Input: "Count me in!"
Output: {"isInvitation": false, "isResponse": true, "response": "yes", "confidence": 0.9}

Input: "Sorry, can't make it"
Output: {"isInvitation": false, "isResponse": true, "response": "no", "confidence": 0.9}

Input: "What time should we meet?"
Output: {"isInvitation": false, "isResponse": false, "confidence": 0.1}`;

/**
 * Cloud Function: RSVP Tracking
 * Tracks RSVPs and invitations using OpenAI GPT-4 Turbo
 */
export const trackRSVP = functions
  .region(FUNCTIONS_REGION)
  .runWith({
    secrets: [openaiApiKey],
    timeoutSeconds: 30,
    memory: "256MB",
  })
  .https.onCall(async (data, context) => {
    try {
      // Validate input
      const {text, chatId, messageId} = data;
      if (!text || typeof text !== "string" || text.trim().length === 0) {
        return {
          rsvp: null,
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
            content: `Track RSVP from this message: "${text}"`,
          },
        ],
        temperature: 0.3,
        response_format: {type: "json_object"},
        max_tokens: 300,
      });

      // Parse response
      const content = response.choices[0]?.message?.content;
      if (!content) {
        functions.logger.warn("No content in OpenAI response");
        return {rsvp: null};
      }

      let parsed: RSVP;
      try {
        parsed = JSON.parse(content);
      } catch (parseError) {
        functions.logger.error("Failed to parse OpenAI response", {
          content,
          error: parseError,
        });
        return {rsvp: null, error: "Failed to parse AI response"};
      }

      // Validate confidence threshold
      if (parsed.confidence <= 0.7) {
        return {rsvp: null};
      }

      // Only return if it's actually an invitation or response
      if (!parsed.isInvitation && !parsed.isResponse) {
        return {rsvp: null};
      }

      // If chatId and messageId provided, we could aggregate RSVP counts
      // For now, we'll implement the basic structure
      // Future enhancement: Query Firestore for previous responses in this chat
      const rsvp: RSVP = {
        isInvitation: parsed.isInvitation || false,
        isResponse: parsed.isResponse || false,
        event: parsed.event,
        response: parsed.response,
        details: parsed.details,
        confidence: parsed.confidence,
      };

      // Placeholder for aggregation (would need Firestore access)
      // If this is a response, we could count all yes/no/maybe in the chat
      if (chatId && messageId && parsed.isResponse) {
        // Future: Query Firestore to count responses
        // For now, just return the response without counts
        rsvp.responses = {yes: 0, no: 0, maybe: 0};
      }

      functions.logger.info("RSVP tracking successful", {
        inputLength: text.length,
        isInvitation: rsvp.isInvitation,
        isResponse: rsvp.isResponse,
      });

      return {rsvp};
    } catch (error) {
      functions.logger.error("RSVP tracking failed", {error});

      // Graceful degradation
      return {
        rsvp: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

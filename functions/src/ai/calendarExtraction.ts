import * as functions from "firebase-functions";
import {defineSecret} from "firebase-functions/params";
import OpenAI from "openai";

// Define the OpenAI API key secret
const openaiApiKey = defineSecret("OPENAI_API_KEY");

/**
 * Calendar Event interface
 * Represents an extracted calendar event from a message
 */
export interface CalendarEvent {
  event: string; // Event name/description
  date: string; // ISO format YYYY-MM-DD
  time?: string; // e.g., "3:00 PM", "14:00"
  location?: string; // Event location if mentioned
  confidence: number; // 0-1 range, how confident the AI is
}

/**
 * System prompt for calendar extraction
 * Instructs the AI on how to extract calendar events from text
 */
const SYSTEM_PROMPT = `You are an AI assistant that extracts calendar events from messages.
Extract all events with dates, times, and locations.
Return a JSON object with an "events" array. Each event has: event, date, time, location, confidence.

Rules:
- Use ISO date format (YYYY-MM-DD) for dates
- Convert relative dates like "tomorrow", "next week" to absolute dates
- Time should be in readable format (e.g., "3:00 PM", "14:00")
- Confidence: 1.0 = certain, 0.7 = probable, 0.5 = uncertain, 0.0 = not an event
- Only include items with confidence > 0.6
- If no events found, return {"events": []}

Examples:
Input: "Soccer practice tomorrow at 4pm"
Output: {"events": [{"event": "Soccer practice", "date": "2025-10-25", "time": "4:00 PM", "confidence": 0.95}]}

Input: "Can you pick up milk?"
Output: {"events": []}

Today's date: ${new Date().toISOString().split("T")[0]}`;

/**
 * Cloud Function: Calendar Event Extraction
 * Extracts calendar events from text using OpenAI GPT-4 Turbo
 */
export const calendarExtraction = functions
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
          events: [],
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
            content: `Extract calendar events from this message: "${text}"`,
          },
        ],
        temperature: 0.3, // More deterministic
        response_format: {type: "json_object"},
        max_tokens: 500,
      });

      // Parse response
      const content = response.choices[0]?.message?.content;
      if (!content) {
        functions.logger.warn("No content in OpenAI response");
        return {events: []};
      }

      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (parseError) {
        functions.logger.error("Failed to parse OpenAI response", {
          content,
          error: parseError,
        });
        return {events: [], error: "Failed to parse AI response"};
      }

      // Extract events array (handle different response formats)
      let events: CalendarEvent[] = [];
      if (Array.isArray(parsed)) {
        events = parsed;
      } else if (parsed.events && Array.isArray(parsed.events)) {
        events = parsed.events;
      } else {
        functions.logger.warn("Unexpected response format", {parsed});
        return {events: []};
      }

      // Validate and filter events
      const validEvents = events
        .filter((event: CalendarEvent) => {
          // Filter by confidence threshold
          if (event.confidence <= 0.6) return false;

          // Validate required fields
          if (!event.event || !event.date) return false;

          // Validate date format (basic check)
          if (!/^\d{4}-\d{2}-\d{2}$/.test(event.date)) return false;

          return true;
        })
        .map((event: CalendarEvent) => ({
          event: event.event,
          date: event.date,
          time: event.time || undefined,
          location: event.location || undefined,
          confidence: event.confidence,
        }));

      functions.logger.info("Calendar extraction successful", {
        inputLength: text.length,
        eventsFound: validEvents.length,
      });

      return {events: validEvents};
    } catch (error) {
      functions.logger.error("Calendar extraction failed", {error});

      // Graceful degradation - return empty array instead of failing
      return {
        events: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

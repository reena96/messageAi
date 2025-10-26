import * as functions from "firebase-functions";
import {defineSecret} from "firebase-functions/params";
import OpenAI from "openai";
import {FUNCTIONS_REGION} from "../config";

// Define the OpenAI API key secret
const openaiApiKey = defineSecret("OPENAI_API_KEY");

/**
 * Priority interface
 * Represents the priority level of a message for busy parents
 */
export interface Priority {
  level: "critical" | "high" | "medium" | "low"; // Priority classification
  reason: string; // Why this priority was assigned
  urgency: boolean; // Requires immediate action?
  confidence: number; // 0-1 range, how confident the AI is
}

/**
 * System prompt for priority detection
 * Instructs the AI on how to classify message priority for busy parents
 */
const SYSTEM_PROMPT = `You are an AI assistant that detects message priority for busy parents managing family schedules and communications.

Classify messages into: critical, high, medium, or low priority.

CRITICAL: Emergencies, sick child, urgent schedule changes, safety issues
- "Emma has fever, picking her up from school now"
- "URGENT: Practice cancelled due to weather"
- "School nurse called - Jake hurt on playground"
- "Emergency: Water pipe burst in classroom"

HIGH: Deadlines today/tomorrow, important decisions needed, time-sensitive RSVPs
- "Permission slip due tomorrow morning"
- "Need headcount for party by end of day"
- "Report due tomorrow at 9am"
- "Can you pick up Sarah? I'm stuck in traffic"

MEDIUM: Regular updates, general questions, routine information
- "Parent-teacher conference next week"
- "What should we bring to the picnic?"
- "Field trip schedule attached"
- "Weekly newsletter from teacher"

LOW: Casual chat, social messages, non-urgent updates
- "Thanks for the update!"
- "Have a great weekend!"
- "Just sharing this funny video"
- "How are you doing?"

Return JSON object with: level, reason (why this priority), urgency (bool), confidence.

Rules:
- Parent-specific urgency: sick child, school emergencies, urgent pickups = CRITICAL
- Time-sensitive: deadlines, RSVPs, same-day events = HIGH
- Routine communication: updates, planning = MEDIUM
- Social/casual: greetings, thanks = LOW
- urgency: true if requires immediate action (within hours)
- confidence: 1.0 = certain, 0.7 = probable, 0.5 = uncertain

Examples:
Input: "URGENT: Server is down!"
Output: {"level": "critical", "reason": "System emergency requiring immediate attention", "urgency": true, "confidence": 0.95}

Input: "Emma has fever, picking her up from school now"
Output: {"level": "critical", "reason": "Sick child requiring immediate parent action", "urgency": true, "confidence": 1.0}

Input: "Report due tomorrow at 9am"
Output: {"level": "high", "reason": "Deadline tomorrow morning", "urgency": true, "confidence": 0.90}

Input: "Can you review when you get a chance?"
Output: {"level": "medium", "reason": "Non-urgent request without deadline", "urgency": false, "confidence": 0.85}

Input: "Just wanted to share this funny video"
Output: {"level": "low", "reason": "Casual social sharing", "urgency": false, "confidence": 0.95}`;

/**
 * Cloud Function: Priority Detection
 * Classifies message priority for busy parents using OpenAI GPT-4 Turbo
 */
export const priorityDetection = functions
  .region(FUNCTIONS_REGION)
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
        // Return safe default on invalid input
        return {
          priority: {
            level: "medium",
            reason: "Invalid input",
            urgency: false,
            confidence: 0.0,
          },
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
            content: `Classify the priority of this message: "${text}"`,
          },
        ],
        temperature: 0.2, // Very deterministic for priority classification
        response_format: {type: "json_object"}, // Structured output
        max_tokens: 300,
      });

      // Parse response
      const content = response.choices[0]?.message?.content;
      if (!content) {
        functions.logger.warn("No content in OpenAI response");
        // Return safe default
        return {
          priority: {
            level: "medium",
            reason: "Unable to determine priority",
            urgency: false,
            confidence: 0.5,
          },
        };
      }

      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (parseError) {
        functions.logger.error("Failed to parse OpenAI response", {
          content,
          error: parseError,
        });
        // Return safe default on parse error
        return {
          priority: {
            level: "medium",
            reason: "Failed to parse AI response",
            urgency: false,
            confidence: 0.5,
          },
        };
      }

      // Extract priority object
      let priority: Priority;
      if (parsed.level && parsed.reason !== undefined) {
        // Response is the priority object directly
        priority = parsed as Priority;
      } else if (parsed.priority) {
        // Response has nested priority object
        priority = parsed.priority;
      } else {
        functions.logger.warn("Unexpected response format", {parsed});
        // Return safe default
        return {
          priority: {
            level: "medium",
            reason: "Unexpected response format",
            urgency: false,
            confidence: 0.5,
          },
        };
      }

      // Validate priority level
      const validLevels = ["critical", "high", "medium", "low"];
      if (!validLevels.includes(priority.level)) {
        functions.logger.warn("Invalid priority level", {level: priority.level});
        priority.level = "medium"; // Safe default
      }

      // Ensure required fields
      const validPriority: Priority = {
        level: priority.level,
        reason: priority.reason || "No reason provided",
        urgency: priority.urgency === true, // Ensure boolean
        confidence: typeof priority.confidence === "number" ?
          priority.confidence : 0.5,
      };

      functions.logger.info("Priority detection successful", {
        inputLength: text.length,
        level: validPriority.level,
        urgency: validPriority.urgency,
      });

      return {priority: validPriority};
    } catch (error) {
      functions.logger.error("Priority detection failed", {error});

      // Graceful degradation - return medium priority (safe default)
      return {
        priority: {
          level: "medium" as const,
          reason: error instanceof Error ?
            error.message : "Unknown error",
          urgency: false,
          confidence: 0.0,
        },
      };
    }
  });

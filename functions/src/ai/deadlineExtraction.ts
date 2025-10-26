import * as functions from "firebase-functions";
import {defineSecret} from "firebase-functions/params";
import OpenAI from "openai";
import {FUNCTIONS_REGION} from "../config";

// Define the OpenAI API key secret
const openaiApiKey = defineSecret("OPENAI_API_KEY");

/**
 * Deadline interface
 * Represents a deadline/task extracted from a message
 */
export interface Deadline {
  task: string; // What needs to be done
  dueDate: string; // ISO format YYYY-MM-DD
  dueTime?: string; // Time if specified
  assignedTo?: string[]; // Who is responsible
  priority?: "high" | "medium" | "low";
  completed: boolean; // Default false
  confidence: number; // 0-1 range
}

/**
 * System prompt for deadline extraction
 */
const SYSTEM_PROMPT = `You are an AI assistant that extracts deadlines and tasks from messages.

Deadlines are TASKS with DUE DATES, different from calendar EVENTS:
- 'Permission slip due Friday' → Deadline (task to complete)
- 'Meeting Friday at 3pm' → Event (not a deadline)

Extract: task description, due date (ISO format), due time if mentioned, priority.
Priority: high (due today/tomorrow), medium (this week), low (later).

Return JSON object with "deadlines" array. Each deadline has: task, dueDate, dueTime, priority, confidence, completed.
Confidence: 1.0 = certain, 0.5 = uncertain.
Only include items with confidence > 0.6.

Examples:
Input: "Permission slip due Friday by 5pm"
Output: {"deadlines": [{"task": "Permission slip", "dueDate": "2025-10-26", "dueTime": "5:00 PM", "priority": "high", "completed": false, "confidence": 0.95}]}

Input: "Report due tomorrow"
Output: {"deadlines": [{"task": "Report", "dueDate": "2025-10-25", "priority": "high", "completed": false, "confidence": 0.9}]}

Input: "Meeting Friday at 3pm"
Output: {"deadlines": []}

Input: "Code review due Monday, documentation due Wednesday"
Output: {"deadlines": [{"task": "Code review", "dueDate": "2025-10-28", "priority": "medium", "completed": false, "confidence": 0.9}, {"task": "Documentation", "dueDate": "2025-10-30", "priority": "medium", "completed": false, "confidence": 0.9}]}

Today's date: ${new Date().toISOString().split("T")[0]}`;

/**
 * Cloud Function: Deadline Extraction
 * Extracts deadlines from text using OpenAI GPT-4 Turbo
 */
export const extractDeadlines = functions
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
        return {
          deadlines: [],
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
            content: `Extract deadlines from this message: "${text}"`,
          },
        ],
        temperature: 0.3,
        response_format: {type: "json_object"},
        max_tokens: 500,
      });

      // Parse response
      const content = response.choices[0]?.message?.content;
      if (!content) {
        functions.logger.warn("No content in OpenAI response");
        return {deadlines: []};
      }

      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (parseError) {
        functions.logger.error("Failed to parse OpenAI response", {
          content,
          error: parseError,
        });
        return {deadlines: [], error: "Failed to parse AI response"};
      }

      // Extract deadlines array
      let deadlines: Deadline[] = [];
      if (Array.isArray(parsed)) {
        deadlines = parsed;
      } else if (parsed.deadlines && Array.isArray(parsed.deadlines)) {
        deadlines = parsed.deadlines;
      } else {
        functions.logger.warn("Unexpected response format", {parsed});
        return {deadlines: []};
      }

      // Validate and filter deadlines
      const validDeadlines = deadlines
        .filter((deadline: Deadline) => {
          // Filter by confidence threshold
          if (deadline.confidence <= 0.6) return false;

          // Validate required fields
          if (!deadline.task || !deadline.dueDate) return false;

          // Validate date format
          if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline.dueDate)) return false;

          return true;
        })
        .map((deadline: Deadline) => ({
          task: deadline.task,
          dueDate: deadline.dueDate,
          dueTime: deadline.dueTime || undefined,
          assignedTo: deadline.assignedTo || undefined,
          priority: deadline.priority || "medium",
          completed: false, // Always start as not completed
          confidence: deadline.confidence,
        }));

      functions.logger.info("Deadline extraction successful", {
        inputLength: text.length,
        deadlinesFound: validDeadlines.length,
      });

      return {deadlines: validDeadlines};
    } catch (error) {
      functions.logger.error("Deadline extraction failed", {error});

      // Graceful degradation
      return {
        deadlines: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

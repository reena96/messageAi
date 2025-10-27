import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {ChatOpenAI} from "@langchain/openai";
import {HumanMessage, SystemMessage} from "@langchain/core/messages";
import {StringOutputParser} from "@langchain/core/output_parsers";
import {FUNCTIONS_REGION} from "../config";
import {conflictDetector, ProactiveInsight} from "./conflictDetection";
import {openaiApiKey, pineconeApiKey} from "./vectorStore";

/**
 * Proactive Assistant Response
 */
interface ProactiveAssistantResponse {
  insights: ProactiveInsight[];
  summary: string;
  timestamp: number;
}

/**
 * System prompt for LangChain-powered insight enhancement
 */
const SYSTEM_PROMPT = `You are a proactive AI assistant for busy parents managing family schedules.
Your role is to analyze schedule conflicts, deadlines, pending decisions, and provide actionable suggestions.

When given a list of detected insights (conflicts, reminders, suggestions), your job is to:
1. Summarize the key insights in a friendly, helpful tone
2. Prioritize the most urgent items
3. Provide context and reasoning
4. Suggest practical alternatives

Keep your responses:
- Concise (2-3 sentences max for summaries)
- Action-oriented
- Empathetic to busy parents
- Focused on helping them coordinate family schedules

Format your response as a brief summary paragraph.`;

/**
 * Proactive Assistant Cloud Function
 * Uses LangChain + RAG to analyze schedules and generate insights
 */
export const proactiveAssistant = functions
  .region(FUNCTIONS_REGION)
  .runWith({
    secrets: [openaiApiKey, pineconeApiKey],
    timeoutSeconds: 120, // Increased from 60s to 120s for LangChain/OpenAI calls
    memory: "512MB",
  })
  .https.onCall(async (data, context) => {
    const startTime = Date.now();

    try {
      // Authentication check
      if (!context.auth?.uid) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "User must be authenticated to use proactive assistant"
        );
      }

      const userId = context.auth.uid;
      functions.logger.info("Proactive assistant invoked", {userId});

      // Step 1: Run conflict detection
      functions.logger.info("Running conflict detection...");
      const insights = await conflictDetector.analyzeSchedule(userId);

      if (insights.length === 0) {
        // No insights found - return a reassuring message
        return {
          insights: [],
          summary: "You're all set! No conflicts or urgent items detected in your schedule right now. Keep up the great work managing your family's activities!",
          timestamp: Date.now(),
        } as ProactiveAssistantResponse;
      }

      // Step 2: Enhance insights with LangChain
      functions.logger.info("Enhancing insights with LangChain...", {
        insightCount: insights.length,
      });

      // Initialize LangChain LLM
      const llm = new ChatOpenAI({
        openAIApiKey: openaiApiKey.value(),
        modelName: "gpt-4-turbo-preview",
        temperature: 0.7,
        maxTokens: 500,
      });

      // Prepare insights summary for LLM
      const insightsText = insights
        .map((insight, idx) => {
          return `${idx + 1}. [${insight.type.toUpperCase()}] ${insight.title}
   - Description: ${insight.description}
   - Confidence: ${(insight.confidence * 100).toFixed(0)}%
   - Reasoning: ${insight.reasoning}
   ${insight.alternatives ? `- Alternatives: ${insight.alternatives.join(", ")}` : ""}`;
        })
        .join("\n\n");

      const userMessage = `Analyze these schedule insights for a busy parent and provide a brief, helpful summary:

${insightsText}

Provide a concise summary (2-3 sentences) highlighting the most important items and suggesting next steps.`;

      // Run LangChain chain
      const messages = [
        new SystemMessage(SYSTEM_PROMPT),
        new HumanMessage(userMessage),
      ];

      const parser = new StringOutputParser();
      const response = await llm.invoke(messages);
      const summary = await parser.invoke(response);

      // Step 3: Store insights in Firestore
      functions.logger.info("Storing insights in Firestore...");
      const db = admin.firestore();
      const batch = db.batch();

      for (const insight of insights) {
        const insightRef = db
          .collection("proactiveInsights")
          .doc(userId)
          .collection("insights")
          .doc(insight.id);

        batch.set(insightRef, {
          ...insight,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt: admin.firestore.Timestamp.fromMillis(
            Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days TTL
          ),
        });
      }

      await batch.commit();

      // Step 4: Send notification for high-confidence conflicts
      const highConfidenceConflicts = insights.filter(
        (i) => i.type === "conflict" && i.confidence >= 0.85
      );

      if (highConfidenceConflicts.length > 0) {
        functions.logger.info("Scheduling notifications for high-confidence conflicts", {
          count: highConfidenceConflicts.length,
        });
        // TODO: Implement notification sending (will be added in Phase 2)
      }

      const elapsedTime = Date.now() - startTime;
      functions.logger.info("Proactive assistant completed", {
        userId,
        insightCount: insights.length,
        elapsedTimeMs: elapsedTime,
      });

      // Log performance warning if >5s
      if (elapsedTime > 5000) {
        functions.logger.warn("Proactive assistant response time exceeded 5s", {
          elapsedTimeMs: elapsedTime,
        });
      }

      return {
        insights,
        summary,
        timestamp: Date.now(),
      } as ProactiveAssistantResponse;
    } catch (error) {
      functions.logger.error("Proactive assistant failed", {
        error,
        userId: context.auth?.uid,
      });

      // Graceful degradation
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        "internal",
        "Failed to analyze schedule. Please try again.",
        {error: error instanceof Error ? error.message : "Unknown error"}
      );
    }
  });

/**
 * Submit Proactive Feedback Cloud Function
 * Captures user feedback (thumbs up/down) on insights
 */
export const submitProactiveFeedback = functions
  .region(FUNCTIONS_REGION)
  .https.onCall(async (data, context) => {
    try {
      // Authentication check
      if (!context.auth?.uid) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "User must be authenticated to submit feedback"
        );
      }

      const userId = context.auth.uid;
      const {insightId, vote, note} = data;

      // Validate input
      if (!insightId || !vote) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "insightId and vote are required"
        );
      }

      if (!["up", "down"].includes(vote)) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "vote must be 'up' or 'down'"
        );
      }

      functions.logger.info("Submitting proactive feedback", {
        userId,
        insightId,
        vote,
      });

      // Store feedback in Firestore
      const db = admin.firestore();
      const feedbackRef = db
        .collection("proactiveFeedback")
        .doc(userId)
        .collection("feedback")
        .doc(insightId);

      await feedbackRef.set({
        insightId,
        vote,
        note: note || null,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        userId,
      });

      // TODO: Log analytics event (will be added in Phase 2)

      functions.logger.info("Proactive feedback stored successfully", {
        userId,
        insightId,
      });

      return {success: true};
    } catch (error) {
      functions.logger.error("Submit proactive feedback failed", {error});

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        "internal",
        "Failed to submit feedback. Please try again."
      );
    }
  });

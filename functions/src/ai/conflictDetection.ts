import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import {CalendarEvent} from "./calendarExtraction";
import {Deadline} from "./deadlineExtraction";
import {Decision} from "./decisionExtraction";
import {RSVP} from "./rsvpTracking";

/**
 * Proactive Insight Types
 */
export type InsightType = "conflict" | "suggestion" | "reminder";

/**
 * Proactive Insight Interface
 */
export interface ProactiveInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  confidence: number; // 0-1 range
  reasoning: string; // Why this insight was generated
  alternatives?: string[]; // Suggested alternatives
  relatedItems: {
    type: "calendar" | "deadline" | "decision" | "rsvp";
    id: string;
    data: any;
  }[];
  timestamp: number;
  userId: string;
}

/**
 * User's schedule context from Firestore
 */
interface ScheduleContext {
  calendarEvents: Array<CalendarEvent & {messageId: string; chatId: string}>;
  deadlines: Array<Deadline & {messageId: string; chatId: string}>;
  decisions: Array<Decision & {messageId: string; chatId: string}>;
  rsvps: Array<RSVP & {messageId: string; chatId: string}>;
}

/**
 * Conflict Detection Engine
 */
export class ConflictDetector {
  /**
   * Fetch user's schedule context from Firestore
   */
  async fetchScheduleContext(userId: string): Promise<ScheduleContext> {
    const db = admin.firestore();

    try {
      // Fetch calendar events
      const calendarSnapshot = await db
        .collectionGroup("aiExtraction")
        .where("userId", "==", userId)
        .where("type", "==", "calendar")
        .orderBy("timestamp", "desc")
        .limit(50)
        .get();

      const calendarEvents = calendarSnapshot.docs.map((doc) => ({
        ...doc.data().data,
        messageId: doc.data().messageId,
        chatId: doc.data().chatId,
      }));

      // Fetch deadlines
      const deadlineSnapshot = await db
        .collectionGroup("aiExtraction")
        .where("userId", "==", userId)
        .where("type", "==", "deadline")
        .where("completed", "==", false)
        .orderBy("timestamp", "desc")
        .limit(50)
        .get();

      const deadlines = deadlineSnapshot.docs.map((doc) => ({
        ...doc.data().data,
        messageId: doc.data().messageId,
        chatId: doc.data().chatId,
      }));

      // Fetch decisions
      const decisionSnapshot = await db
        .collectionGroup("aiExtraction")
        .where("userId", "==", userId)
        .where("type", "==", "decision")
        .orderBy("timestamp", "desc")
        .limit(30)
        .get();

      const decisions = decisionSnapshot.docs.map((doc) => ({
        ...doc.data().data,
        messageId: doc.data().messageId,
        chatId: doc.data().chatId,
      }));

      // Fetch RSVPs
      const rsvpSnapshot = await db
        .collectionGroup("aiExtraction")
        .where("userId", "==", userId)
        .where("type", "==", "rsvp")
        .orderBy("timestamp", "desc")
        .limit(30)
        .get();

      const rsvps = rsvpSnapshot.docs.map((doc) => ({
        ...doc.data().data,
        messageId: doc.data().messageId,
        chatId: doc.data().chatId,
      }));

      functions.logger.info("Fetched schedule context", {
        userId,
        calendarCount: calendarEvents.length,
        deadlineCount: deadlines.length,
        decisionCount: decisions.length,
        rsvpCount: rsvps.length,
      });

      return {
        calendarEvents,
        deadlines,
        decisions,
        rsvps,
      };
    } catch (error) {
      functions.logger.error("Failed to fetch schedule context", {error});
      throw error;
    }
  }

  /**
   * Detect time-based conflicts between calendar events
   */
  detectTimeConflicts(
    calendarEvents: Array<CalendarEvent & {messageId: string; chatId: string}>
  ): ProactiveInsight[] {
    const insights: ProactiveInsight[] = [];
    const eventsByDate: Record<string, typeof calendarEvents> = {};

    // Group events by date
    for (const event of calendarEvents) {
      if (!eventsByDate[event.date]) {
        eventsByDate[event.date] = [];
      }
      eventsByDate[event.date].push(event);
    }

    // Check for conflicts on each date
    for (const [date, events] of Object.entries(eventsByDate)) {
      if (events.length > 1) {
        // Multiple events on same date - check for time conflicts
        const eventsWithTime = events.filter((e) => e.time);

        if (eventsWithTime.length > 1) {
          // Sort by time
          eventsWithTime.sort((a, b) => {
            const timeA = this.parseTime(a.time || "");
            const timeB = this.parseTime(b.time || "");
            return timeA - timeB;
          });

          // Check for overlaps
          for (let i = 0; i < eventsWithTime.length - 1; i++) {
            const event1 = eventsWithTime[i];
            const event2 = eventsWithTime[i + 1];

            const time1 = this.parseTime(event1.time || "");
            const time2 = this.parseTime(event2.time || "");

            // Assume 1-hour duration for events
            const event1End = time1 + 60;

            if (time2 < event1End) {
              // Conflict detected
              insights.push({
                id: `conflict-${event1.messageId}-${event2.messageId}`,
                type: "conflict",
                title: `Schedule Conflict on ${date}`,
                description: `"${event1.event}" at ${event1.time} may overlap with "${event2.event}" at ${event2.time}`,
                confidence: 0.85,
                reasoning: `Both events are scheduled close together on ${date}, which may cause a timing conflict.`,
                alternatives: [
                  `Reschedule "${event2.event}" to later in the day`,
                  `Move "${event1.event}" to an earlier time`,
                  `Check if one event can be shortened or skipped`,
                ],
                relatedItems: [
                  {
                    type: "calendar",
                    id: event1.messageId,
                    data: event1,
                  },
                  {
                    type: "calendar",
                    id: event2.messageId,
                    data: event2,
                  },
                ],
                timestamp: Date.now(),
                userId: "",
              });
            }
          }
        }
      }
    }

    return insights;
  }

  /**
   * Detect deadline pressure (approaching deadlines)
   */
  detectDeadlinePressure(
    deadlines: Array<Deadline & {messageId: string; chatId: string}>
  ): ProactiveInsight[] {
    const insights: ProactiveInsight[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const deadline of deadlines) {
      const dueDate = new Date(deadline.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Alert for approaching deadlines
      if (daysUntilDue >= 0 && daysUntilDue <= 3 && !deadline.completed) {
        let urgency = "high";
        let confidence = 0.9;

        if (daysUntilDue === 0) {
          urgency = "critical";
          confidence = 0.95;
        } else if (daysUntilDue === 1) {
          urgency = "high";
          confidence = 0.9;
        } else {
          urgency = "medium";
          confidence = 0.8;
        }

        insights.push({
          id: `deadline-${deadline.messageId}`,
          type: "reminder",
          title: `Deadline ${daysUntilDue === 0 ? "Today" : `in ${daysUntilDue} day(s)`}`,
          description: `"${deadline.task}" is due ${daysUntilDue === 0 ? "today" : `on ${deadline.dueDate}`}${deadline.dueTime ? ` at ${deadline.dueTime}` : ""}`,
          confidence,
          reasoning: `This deadline is approaching soon (${urgency} priority). Make sure to complete it on time.`,
          alternatives: [
            daysUntilDue > 0 ? "Set a reminder to start this task today" : "Complete this task immediately",
            "Delegate to someone else if possible",
            "Request an extension if needed",
          ],
          relatedItems: [
            {
              type: "deadline",
              id: deadline.messageId,
              data: deadline,
            },
          ],
          timestamp: Date.now(),
          userId: "",
        });
      }
    }

    return insights;
  }

  /**
   * Detect pending decisions that need resolution
   */
  detectPendingDecisions(
    decisions: Array<Decision & {messageId: string; chatId: string}>
  ): ProactiveInsight[] {
    const insights: ProactiveInsight[] = [];

    // Find pending decisions
    const pendingDecisions = decisions.filter((d) => d.status === "pending");

    for (const decision of pendingDecisions.slice(0, 5)) {
      // Limit to top 5
      insights.push({
        id: `decision-${decision.messageId}`,
        type: "suggestion",
        title: "Pending Decision",
        description: `"${decision.decision}" is still pending and may need your input.`,
        confidence: 0.75,
        reasoning: "This decision has been discussed but not yet resolved. Following up may help move things forward.",
        alternatives: [
          "Reply to the conversation with your preference",
          "Schedule a time to discuss and decide",
          "Delegate the decision to someone else",
        ],
        relatedItems: [
          {
            type: "decision",
            id: decision.messageId,
            data: decision,
          },
        ],
        timestamp: Date.now(),
        userId: "",
      });
    }

    return insights;
  }

  /**
   * Detect RSVP opportunities (invitations without responses)
   */
  detectRSVPOpportunities(
    rsvps: Array<RSVP & {messageId: string; chatId: string}>
  ): ProactiveInsight[] {
    const insights: ProactiveInsight[] = [];

    // Find invitations without responses
    const invitations = rsvps.filter((r) => r.isInvitation && !r.isResponse);

    for (const invitation of invitations.slice(0, 3)) {
      // Limit to top 3
      insights.push({
        id: `rsvp-${invitation.messageId}`,
        type: "reminder",
        title: "RSVP Needed",
        description: `You have an invitation for "${invitation.event}" that may need a response.`,
        confidence: 0.7,
        reasoning: "Responding to invitations helps organizers plan better and shows consideration.",
        alternatives: [
          "Reply 'yes' if you can attend",
          "Reply 'no' if you can't make it",
          "Reply 'maybe' if you're unsure",
        ],
        relatedItems: [
          {
            type: "rsvp",
            id: invitation.messageId,
            data: invitation,
          },
        ],
        timestamp: Date.now(),
        userId: "",
      });
    }

    return insights;
  }

  /**
   * Main analysis method - runs all detection algorithms
   */
  async analyzeSchedule(userId: string): Promise<ProactiveInsight[]> {
    try {
      functions.logger.info("Starting schedule analysis", {userId});

      // Fetch schedule context
      const context = await this.fetchScheduleContext(userId);

      // Run all detectors
      const timeConflicts = this.detectTimeConflicts(context.calendarEvents);
      const deadlinePressure = this.detectDeadlinePressure(context.deadlines);
      const pendingDecisions = this.detectPendingDecisions(context.decisions);
      const rsvpOpportunities = this.detectRSVPOpportunities(context.rsvps);

      // Combine all insights
      const allInsights = [
        ...timeConflicts,
        ...deadlinePressure,
        ...pendingDecisions,
        ...rsvpOpportunities,
      ].map((insight) => ({
        ...insight,
        userId,
      }));

      // Sort by confidence (highest first)
      allInsights.sort((a, b) => b.confidence - a.confidence);

      functions.logger.info("Schedule analysis complete", {
        userId,
        totalInsights: allInsights.length,
        conflicts: timeConflicts.length,
        deadlines: deadlinePressure.length,
        decisions: pendingDecisions.length,
        rsvps: rsvpOpportunities.length,
      });

      return allInsights;
    } catch (error) {
      functions.logger.error("Schedule analysis failed", {error});
      throw error;
    }
  }

  /**
   * Parse time string to minutes since midnight
   */
  private parseTime(timeStr: string): number {
    // Remove common formats and normalize
    const normalized = timeStr.toLowerCase().replace(/\s+/g, "");

    // Try to match HH:MM format
    const match = normalized.match(/(\d{1,2}):?(\d{2})?/);
    if (!match) return 0;

    let hours = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;

    // Handle AM/PM
    if (normalized.includes("pm") && hours < 12) {
      hours += 12;
    } else if (normalized.includes("am") && hours === 12) {
      hours = 0;
    }

    return hours * 60 + minutes;
  }
}

export const conflictDetector = new ConflictDetector();

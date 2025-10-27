/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Export Cloud Functions
export {calendarExtraction} from "./ai/calendarExtraction";
export {decisionExtraction} from "./ai/decisionExtraction";
export {priorityDetection} from "./ai/priorityDetection";
export {trackRSVP} from "./ai/rsvpTracking";
export {extractDeadlines} from "./ai/deadlineExtraction";
export {conversationSummary} from "./ai/conversationSummary";
export {proactiveAssistant, submitProactiveFeedback} from "./ai/proactive";

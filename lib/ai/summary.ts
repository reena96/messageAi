import { getFunctions, httpsCallable } from 'firebase/functions';
import app, { FUNCTIONS_REGION } from '@/lib/firebase/config';

const functions = getFunctions(app, FUNCTIONS_REGION);

export interface ConversationSummaryMessage {
  text: string;
  sender?: string;
  timestamp?: string;
}

export interface ConversationSummaryPayload {
  messages: ConversationSummaryMessage[];
}

export interface ConversationSummaryResponse {
  summary: string | null;
  error?: string;
}

export async function requestConversationSummary(
  payload: ConversationSummaryPayload
): Promise<ConversationSummaryResponse> {
  try {
    const callable = httpsCallable(functions, 'conversationSummary');
    const result = await callable(payload);
    const data = result.data as ConversationSummaryResponse;

    if (!data || typeof data.summary !== 'string') {
      return {
        summary: null,
        error: data?.error ?? 'No summary available',
      };
    }

    return data;
  } catch (error) {
    console.error('[AI] conversationSummary failed', error);
    return {
      summary: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

import {Pinecone} from "@pinecone-database/pinecone";
import {defineSecret} from "firebase-functions/params";
import OpenAI from "openai";
import * as functions from "firebase-functions";

// Define secrets
const pineconeApiKey = defineSecret("PINECONE_API_KEY");
const openaiApiKey = defineSecret("OPENAI_API_KEY");

// Configuration - Standard OpenAI embedding dimensions
const PINECONE_INDEX_NAME = "messageai-embeddings";

// Using 1536 dimensions (standard for OpenAI embeddings)
const EMBEDDING_DIMENSIONS = 1536;
const EMBEDDING_MODEL = "text-embedding-3-small";

const MAX_MESSAGES_TO_STORE = 200; // Limit per user to control costs

/**
 * PINECONE CONFIGURATION:
 * ✅ Index Created: messageai-embeddings
 * ✅ Host: https://messageai-embeddings-cxd6qgm.svc.gcp-us-central1-4a9f.pinecone.io
 * ✅ Dimensions: 1536
 * ✅ Metric: cosine
 * ✅ Region: GCP us-central1
 *
 * Note: Pinecone SDK v2+ automatically detects the host from the API key.
 * No additional configuration needed!
 */

/**
 * Message embedding interface for vector storage
 */
export interface MessageEmbedding {
  id: string; // Message ID
  chatId: string;
  userId: string;
  text: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Vector Store Manager
 * Handles embedding generation and storage in Pinecone
 */
export class VectorStoreManager {
  private pinecone: Pinecone | null = null;
  private openai: OpenAI | null = null;
  private indexName: string;

  constructor(indexName: string = PINECONE_INDEX_NAME) {
    this.indexName = indexName;
  }

  /**
   * Initialize Pinecone and OpenAI clients
   */
  private async initialize(): Promise<void> {
    if (this.pinecone && this.openai) {
      return; // Already initialized
    }

    try {
      // Initialize Pinecone
      this.pinecone = new Pinecone({
        apiKey: pineconeApiKey.value(),
      });

      // Initialize OpenAI
      this.openai = new OpenAI({
        apiKey: openaiApiKey.value(),
      });

      functions.logger.info("VectorStore initialized successfully");
    } catch (error) {
      functions.logger.error("Failed to initialize VectorStore", {error});
      throw error;
    }
  }

  /**
   * Generate embedding for text using OpenAI
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    await this.initialize();

    if (!this.openai) {
      throw new Error("OpenAI client not initialized");
    }

    try {
      const response = await this.openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text,
        dimensions: EMBEDDING_DIMENSIONS,
      });

      return response.data[0].embedding;
    } catch (error) {
      functions.logger.error("Failed to generate embedding", {error});
      throw error;
    }
  }

  /**
   * Store message embeddings in Pinecone
   */
  async upsertMessages(messages: MessageEmbedding[]): Promise<void> {
    await this.initialize();

    if (!this.pinecone) {
      throw new Error("Pinecone client not initialized");
    }

    try {
      const index = this.pinecone.index(this.indexName);

      // Generate embeddings for all messages
      const vectors = await Promise.all(
        messages.map(async (msg) => {
          const embedding = await this.generateEmbedding(msg.text);

          return {
            id: msg.id,
            values: embedding,
            metadata: {
              chatId: msg.chatId,
              userId: msg.userId,
              text: msg.text,
              timestamp: msg.timestamp,
              ...msg.metadata,
            },
          };
        })
      );

      // Upsert to Pinecone
      await index.upsert(vectors);

      functions.logger.info("Successfully upserted messages to vector store", {
        count: vectors.length,
      });
    } catch (error) {
      functions.logger.error("Failed to upsert messages", {error});
      throw error;
    }
  }

  /**
   * Query vector store for similar messages
   */
  async querySimarMessages(
    queryText: string,
    userId: string,
    topK: number = 10,
    filter?: Record<string, any>
  ): Promise<MessageEmbedding[]> {
    await this.initialize();

    if (!this.pinecone) {
      throw new Error("Pinecone client not initialized");
    }

    try {
      const index = this.pinecone.index(this.indexName);

      // Generate embedding for query
      const queryEmbedding = await this.generateEmbedding(queryText);

      // Build filter
      const queryFilter = {
        userId: {$eq: userId},
        ...filter,
      };

      // Query Pinecone
      const queryResponse = await index.query({
        vector: queryEmbedding,
        topK,
        filter: queryFilter,
        includeMetadata: true,
      });

      // Convert results to MessageEmbedding format
      const results: MessageEmbedding[] = queryResponse.matches.map((match) => ({
        id: match.id,
        chatId: (match.metadata?.chatId as string) || "",
        userId: (match.metadata?.userId as string) || "",
        text: (match.metadata?.text as string) || "",
        timestamp: (match.metadata?.timestamp as number) || 0,
        metadata: match.metadata,
      }));

      functions.logger.info("Query results retrieved", {
        queryText: queryText.substring(0, 50),
        resultsCount: results.length,
      });

      return results;
    } catch (error) {
      functions.logger.error("Failed to query vector store", {error});
      throw error;
    }
  }

  /**
   * Get recent messages for a user (for context)
   */
  async getRecentMessages(
    userId: string,
    limit: number = MAX_MESSAGES_TO_STORE
  ): Promise<MessageEmbedding[]> {
    await this.initialize();

    if (!this.pinecone) {
      throw new Error("Pinecone client not initialized");
    }

    try {
      const index = this.pinecone.index(this.indexName);

      // Query with a dummy vector to get all user messages
      // This is a workaround since Pinecone doesn't have a direct "fetch all" API
      const dummyEmbedding = new Array(EMBEDDING_DIMENSIONS).fill(0);

      const queryResponse = await index.query({
        vector: dummyEmbedding,
        topK: limit,
        filter: {userId: {$eq: userId}},
        includeMetadata: true,
      });

      // Convert and sort by timestamp
      const results: MessageEmbedding[] = queryResponse.matches
        .map((match) => ({
          id: match.id,
          chatId: (match.metadata?.chatId as string) || "",
          userId: (match.metadata?.userId as string) || "",
          text: (match.metadata?.text as string) || "",
          timestamp: (match.metadata?.timestamp as number) || 0,
          metadata: match.metadata,
        }))
        .sort((a, b) => b.timestamp - a.timestamp);

      return results;
    } catch (error) {
      functions.logger.error("Failed to get recent messages", {error});
      throw error;
    }
  }

  /**
   * Delete old messages to maintain size limit
   */
  async pruneOldMessages(userId: string, keepCount: number = MAX_MESSAGES_TO_STORE): Promise<void> {
    await this.initialize();

    if (!this.pinecone) {
      throw new Error("Pinecone client not initialized");
    }

    try {
      const recentMessages = await this.getRecentMessages(userId, keepCount * 2);

      if (recentMessages.length <= keepCount) {
        // No need to prune
        return;
      }

      // Delete messages beyond the keep limit
      const messagesToDelete = recentMessages.slice(keepCount);
      const idsToDelete = messagesToDelete.map((msg) => msg.id);

      const index = this.pinecone.index(this.indexName);
      await index.deleteMany(idsToDelete);

      functions.logger.info("Pruned old messages", {
        userId,
        deletedCount: idsToDelete.length,
      });
    } catch (error) {
      functions.logger.error("Failed to prune old messages", {error});
      throw error;
    }
  }

  /**
   * Delete all messages for a user
   */
  async deleteUserMessages(userId: string): Promise<void> {
    await this.initialize();

    if (!this.pinecone) {
      throw new Error("Pinecone client not initialized");
    }

    try {
      const index = this.pinecone.index(this.indexName);

      // Delete all vectors with this userId
      await index.deleteMany({
        userId: {$eq: userId},
      });

      functions.logger.info("Deleted all messages for user", {userId});
    } catch (error) {
      functions.logger.error("Failed to delete user messages", {error});
      throw error;
    }
  }
}

// Export singleton instance
export const vectorStore = new VectorStoreManager();

// Export secrets for function definitions
export {pineconeApiKey, openaiApiKey};

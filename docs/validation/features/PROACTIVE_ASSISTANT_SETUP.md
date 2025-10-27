# Proactive Assistant Setup Guide

## Firebase Secrets Configuration

The Proactive Assistant feature requires two API keys to be configured as Firebase Secrets:

### 1. OpenAI API Key (Already Configured)
✅ `OPENAI_API_KEY` - Used for LangChain LLM calls

### 2. Pinecone API Key (NEW - Required)
You need to configure this before deploying the proactive assistant function.

#### Steps to Configure Pinecone:

1. **Create a Pinecone Account**
   - Go to https://www.pinecone.io/
   - Sign up for a free account
   - Create a new index with the following settings:
     - Name: `messageai-embeddings` (or your preferred name)
     - Dimensions: See options below based on your Pinecone plan
     - Metric: `cosine`
     - Cloud: Choose your preferred provider (AWS/GCP/Azure)
     - Region: Choose closest to your Firebase region

   **Dimension Options:**
   - **Option 1 (Recommended for Free Tier):** Use `384` dimensions
     - Set EMBEDDING_MODEL to "text-embedding-3-small" with dimensions parameter
     - Cost-effective, good performance

   - **Option 2 (Standard):** Use `1536` dimensions
     - Requires paid Pinecone plan or specific index configurations
     - Set EMBEDDING_MODEL to "text-embedding-ada-002" or "text-embedding-3-small"
     - Higher accuracy but more expensive

   - **Option 3 (Starter):** Use `768` dimensions
     - Good middle ground
     - Modify EMBEDDING_DIMENSIONS in vectorStore.ts accordingly

2. **Get Your API Key**
   - In Pinecone dashboard, go to "API Keys"
   - Copy your API key

3. **Set Firebase Secret**
   ```bash
   cd functions
   firebase functions:secrets:set PINECONE_API_KEY
   ```
   - Paste your Pinecone API key when prompted

4. **Set Pinecone Environment Variable**
   You also need to set your Pinecone environment/host. Add to your `.env` file:
   ```
   PINECONE_ENVIRONMENT=your-environment-here
   PINECONE_INDEX_NAME=messageai-embeddings
   ```

5. **Verify Configuration**
   ```bash
   firebase functions:secrets:access PINECONE_API_KEY
   ```

## Installing Dependencies

After configuring secrets, install the new dependencies:

```bash
cd functions
npm install
```

This will install:
- `@pinecone-database/pinecone` - Vector database client
- `langchain` - LangChain framework
- `@langchain/openai` - OpenAI integration for LangChain
- `@langchain/community` - Community integrations

## Next Steps

Once secrets are configured and dependencies installed:
1. Build the functions: `npm run build`
2. Deploy: `npm run deploy`
3. Test the proactive assistant functionality

## Troubleshooting

### "Secret PINECONE_API_KEY not found"
- Make sure you've set the secret using `firebase functions:secrets:set`
- Verify with `firebase functions:secrets:access`

### Pinecone connection errors
- Check that your API key is correct
- Verify your index name matches the configuration
- Ensure your Pinecone environment/host is correct

### Embedding dimension mismatch
- Make sure your Pinecone index is configured with 1536 dimensions
- This matches OpenAI's text-embedding-3-small model

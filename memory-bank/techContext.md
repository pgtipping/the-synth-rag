# Technical Context - Updated [2024-03-11 07:17:00]

## Current Technical Stack

### AI and Machine Learning

- OpenAI GPT-4 for chat completions
- text-embedding-3-small for embeddings (cost-optimized)
- Pinecone for vector storage
- Custom context optimization system

### Backend Services

- Edge Runtime for API routes
- Redis for multi-level caching
- Upstash for rate limiting
- Custom token tracking middleware

### Cost Optimization Components

- ContextManager for smart context pruning
- Embedding cache with Redis
- Chat response cache
- Token usage tracking
- Hybrid search optimization

### Development Tools

- TypeScript for type safety
- Jest for testing
- ESLint for code quality
- Prettier for formatting

## Technical Decisions

### Cost Optimization Strategy

1. Use text-embedding-3-small for better cost efficiency
2. Implement multi-level caching to reduce API calls
3. Smart context pruning to optimize token usage
4. Response streaming for better UX
5. Hybrid search with configurable weights

### Performance Optimization

1. Edge runtime for faster response times
2. Redis caching for quick retrievals
3. Efficient chunk merging algorithms
4. Smart deduplication strategies

## Current Technology Stack

### Core Technologies

- Next.js for frontend and API routes
- TypeScript for type safety
- Pinecone for vector storage
- Redis for caching
- PostgreSQL for relational data

### Text Processing

- gpt-tokenizer for token counting
- TextSplitter class for semantic chunking
- Document processing pipeline for multiple file types

### Cost Optimization

- Token usage monitoring
- Semantic chunking
- Caching system with TTL
- Context pruning (in progress)

## Development Setup

### Required Environment Variables

```bash
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=...
REDIS_URL=...
DATABASE_URL=...
```

### Development Tools

- VS Code with TypeScript
- Jest for testing
- ESLint for code quality
- Prettier for formatting

## Technical Constraints

### Performance Requirements

- Maximum chunk size: 500 tokens
- Chunk overlap: 50 tokens
- File size limit: 100MB
- Processing timeout: 30s

### Security Requirements

- File type validation
- Size limit enforcement
- PII detection (planned)
- Malware scanning (planned)

## Dependencies

### Core Dependencies

```json
{
  "gpt-tokenizer": "^2.1.1",
  "next": "^14.0.0",
  "react": "^18.2.0",
  "typescript": "^5.0.0",
  "@pinecone-database/pinecone": "^1.1.0"
}
```

### Development Dependencies

```json
{
  "@types/jest": "^29.5.0",
  "jest": "^29.5.0",
  "ts-jest": "^29.1.0",
  "eslint": "^8.0.0"
}
```

## Implementation Details

### Text Chunking

```typescript
interface TextChunk {
  text: string;
  tokens: number;
}

class TextSplitter {
  private chunkSize: number;
  private chunkOverlap: number;
  private separators: string[];
}
```

### Document Processing

- File type detection
- Text extraction
- Metadata handling
- Chunk generation

## Current Limitations

### Known Technical Limitations

1. No malware scanning
2. Limited file type support
3. Processing timeouts for large files
4. Basic error recovery

### Performance Limitations

1. Context retrieval speed
2. Large file processing
3. Concurrent upload handling
4. Memory usage during processing

## Monitoring and Logging

### Logging Implementation

```typescript
logger.info("Processing document", {
  documentId,
  size,
  type,
  timestamp: new Date().toISOString(),
});
```

### Metrics Collection

- Processing times
- Error rates
- Resource usage
- Cache hit rates

## Future Technical Improvements

### Short Term

1. Implement virus scanning
2. Add file processing timeout handling
3. Improve context relevance
4. Optimize queue system

### Long Term

1. Advanced malware detection
2. Enhanced PII handling
3. Improved vector search
4. Better error recovery

## Database Management

### Database Utility Script [2025-03-15 07:45]

- Location: `scripts/db.sh`
- Purpose: Simplifies database operations by using environment variables from `.env`
- Features:
  - Automatically uses credentials from `.env`
  - No need for manual password entry
  - Supports all psql commands and options
- Usage Examples:
  ```bash
  # List tables
  ./scripts/db.sh -c "\d"
  # Run queries
  ./scripts/db.sh -c "SELECT * FROM documents;"
  # Run migrations
  ./scripts/db.sh -f migrations/some_migration.sql
  ```

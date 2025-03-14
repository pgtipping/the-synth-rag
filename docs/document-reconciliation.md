# Document Reconciliation Process

## Overview

The document reconciliation process ensures that all document chunks are properly indexed in the vector database (Pinecone) and that the database records are consistent with the vector store. This is critical for the RAG system to function correctly, as missing or inconsistent vectors can lead to incomplete or inaccurate search results.

## Key Components

### 1. Document Health Check

The health check system examines a document's status by:

- Verifying that all document chunks have vector IDs in the database
- Checking that all vectors referenced in the database exist in Pinecone
- Identifying any inconsistencies between the database and vector store
- Providing detailed diagnostics about the document's health

### 2. Reconciliation Process

When reconciliation is triggered, the system:

1. Updates the document status to "processing"
2. Identifies chunks without vector IDs and reindexes them
3. Verifies that all vectors exist in Pinecone
4. Reindexes any missing vectors in Pinecone
5. Updates the document status to "indexed" upon successful completion

### 3. Status Tracking

The reconciliation process provides real-time status updates:

- Progress percentage based on chunks processed
- Current document status
- Error messages if reconciliation fails
- Completion notification when reconciliation is successful

## User Interface

The document health check UI provides:

- A health check button to diagnose document issues
- Detailed information about document health
- A reconciliation button for unhealthy documents
- Real-time progress tracking during reconciliation
- Automatic refresh of document status after reconciliation

## API Endpoints

### Health Check Endpoint

`GET /api/documents/health?documentId={id}`

Returns detailed information about a document's health, including:

- Document status
- Issues found
- Chunk statistics
- Missing vectors

### Reconciliation Endpoint

`POST /api/documents/reconcile`

- Initiates the reconciliation process for a document

`GET /api/documents/reconcile?documentId={id}`

- Returns the current status of the reconciliation process

## Common Issues and Solutions

1. **Missing Vector IDs**: Chunks without vector IDs are reindexed during reconciliation.

2. **Missing Vectors in Pinecone**: Vectors that exist in the database but not in Pinecone are reindexed.

3. **Failed Indexing**: If indexing fails, the document status is updated to "failed" with an error message.

4. **Inconsistent Status**: The reconciliation process ensures the document status accurately reflects its actual state.

## Best Practices

1. Run health checks periodically to identify issues before they affect search quality.

2. After uploading large documents, verify they were properly indexed.

3. If search results seem incomplete, run a health check on relevant documents.

4. Monitor reconciliation logs for recurring issues that might indicate system problems.

## Technical Implementation

The reconciliation process is implemented in:

- `src/app/api/documents/reconcile/route.ts`: API endpoint for reconciliation
- `src/app/api/documents/health/route.ts`: API endpoint for health checks
- `src/components/documents/document-health-check.tsx`: UI component for health checks
- `src/components/documents/document-list.tsx`: Integration with document list

The process uses batched operations to handle large documents efficiently and provides detailed logging for troubleshooting.

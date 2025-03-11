# System Patterns - Created on March 8, 2023

## System Architecture

The RAG chatbot demo follows a modern web application architecture with the following key components:

### Frontend Architecture

- **Next.js Application**: Server-side rendered React application
- **Single Page Application**: With dynamic routing for different use cases
- **Component-Based Structure**: Reusable UI components organized by functionality
- **Responsive Design**: Mobile-first approach using Tailwind CSS

### Backend Architecture

- **API Routes**: Next.js API routes for serverless backend functionality
- **Serverless Functions**: For document processing and chat functionality
- **Vector Database**: Pinecone for storing and retrieving document embeddings
- **File Storage**: Firebase Storage/Vercel Blob for temporary document storage

### Data Flow Architecture

1. **Document Processing Pipeline**:
   - Upload → Parse → Chunk → Embed → Store
2. **Query Processing Pipeline**:
   - Query → Embed → Retrieve → Generate → Stream

## Key Technical Decisions

1. **Next.js + React**:

   - Provides server-side rendering for better SEO and initial load performance
   - Enables API routes for serverless backend functionality
   - Supports React Server Components for improved performance

2. **Vercel AI SDK**:

   - Simplifies streaming responses from LLMs
   - Provides utilities for handling chat history and message formatting

3. **Pinecone Vector Database**:

   - Serverless vector database for efficient similarity search
   - Scales automatically based on usage
   - Provides low-latency retrieval for RAG applications

4. **Firebase/Vercel Blob for Storage**:

   - Secure, scalable storage for user-uploaded documents
   - Built-in encryption and access controls
   - Automatic expiration for temporary storage

5. **Shadcn/ui + Tailwind CSS**:

   - Consistent, accessible UI components
   - Highly customizable design system
   - Efficient styling with utility classes

6. **Zustand/React Context for State Management**:
   - Lightweight state management for tracking use cases and files
   - Avoids unnecessary re-renders
   - Simplifies state sharing across components

## Design Patterns in Use

1. **Component Composition Pattern**:

   - Building complex UI from smaller, reusable components
   - Example: Chat interface composed of message list, input, and controls

2. **Container/Presenter Pattern**:

   - Separating logic (containers) from presentation (presenters)
   - Example: ChatContainer handles state and API calls, ChatUI handles rendering

3. **Custom Hook Pattern**:

   - Encapsulating reusable logic in custom hooks
   - Example: `useChat`, `useFileUpload`, `useVectorStore`

4. **Context Provider Pattern**:

   - Providing global state through React Context
   - Example: `ChatProvider`, `FileUploadProvider`

5. **Streaming Pattern**:

   - Streaming responses from LLM to improve perceived performance
   - Implemented using Server-Sent Events or similar technology

6. **Repository Pattern**:

   - Abstracting data access behind interfaces
   - Example: `VectorStoreRepository`, `FileStorageRepository`

7. **Factory Pattern**:
   - Creating objects based on configuration
   - Example: Document parser factory for different file types

## Component Relationships

### UI Component Hierarchy

```
App
├── Layout
│   ├── Header
│   ├── Navigation
│   └── Footer
├── UseCaseSelector
├── UseCasePage
│   ├── FileUploadZone
│   │   └── FileItem
│   └── ChatInterface
│       ├── MessageList
│       │   └── Message
│       ├── InputArea
│       └── ControlPanel
└── CTASection
```

### Service Dependencies

```
ChatService
├── depends on → VectorStoreService
├── depends on → LLMService
└── depends on → FileProcessingService
    └── depends on → FileStorageService
```

### Data Flow Relationships

```
User → FileUploadZone → FileProcessingService → VectorStoreService
User → ChatInterface → ChatService → VectorStoreService + LLMService → User
```

## Architectural Constraints

1. **Serverless Architecture**: All components must be deployable to serverless environments
2. **Stateless Backend**: No server-side session state
3. **Security First**: All user data must be encrypted and properly secured
4. **Performance Budget**: Initial load under 2 seconds, chat responses under 5 seconds
5. **Accessibility Compliance**: WCAG 2.1 AA compliance required

## Progress Tracking Architecture

### Component Structure

1. Database Layer

   - Progress sessions table for overall tracking
   - Steps table for granular progress
   - Metrics table for performance data
   - Optimized queries and proper indexing

2. Service Layer

   - ProgressService for database operations
   - Metrics aggregation and calculations
   - Health monitoring functions
   - Error handling and validation

3. API Layer

   - Admin-only endpoints
   - Rate limiting middleware
   - Authentication checks
   - Error handling middleware

4. Admin Dashboard
   - Real-time metrics display
   - System health monitoring
   - Session tracking and debugging
   - Error state handling

### Data Flow

1. Session Tracking

   ```mermaid
   flowchart TD
       A[User Action] --> B[Progress Service]
       B --> C[Database]
       C --> D[Admin Dashboard]
       D --> E[Metrics Display]
   ```

2. Health Monitoring
   ```mermaid
   flowchart TD
       A[System Events] --> B[Health Service]
       B --> C[Metrics Collection]
       C --> D[Admin Dashboard]
       D --> E[Health Display]
   ```

### Security Pattern

1. Admin Access

   - Middleware protection for /admin routes
   - Session-based authentication
   - Rate limiting for API endpoints
   - Security headers

2. Data Protection
   - Sanitized inputs
   - Validated outputs
   - Error masking
   - Rate limiting

### Monitoring Pattern

1. System Metrics

   - Active sessions count
   - Error rates
   - Response times
   - Memory usage

2. Database Metrics
   - Connection status
   - Query latency
   - Active/failed sessions
   - Hourly statistics

### Error Handling Pattern

1. API Errors

   - 401: Authentication
   - 429: Rate limiting
   - 500: Server errors
   - Network issues

2. UI Error States
   - Visual indicators
   - Recovery actions
   - Graceful degradation
   - Auto-retry logic

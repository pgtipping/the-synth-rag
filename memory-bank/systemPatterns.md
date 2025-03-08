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

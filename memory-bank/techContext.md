# Technical Context - Updated on May 28, 2024 15:45 EST

## Technologies Used

### Frontend

- **Next.js 15.2.1**: React framework with server components and app router
- **React 19**: UI library for component-based development
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/ui**: Accessible and customizable component library
  - Added Textarea component for improved text input
- **Framer Motion**: Animation library for smooth transitions
- **Vercel AI SDK**: Utilities for AI chat interfaces and streaming
- **React Dropzone**: File upload component
- **TypeScript**: Strongly typed JavaScript

### Backend

- **Next.js API Routes**: Serverless backend functions
- **Node.js**: JavaScript runtime
- **Vercel Blob**: File storage solution
- **Pinecone**: Vector database for similarity search
- **OpenAI API**: Large language model provider
- **PostgreSQL**: Database for storing document metadata and example prompts

### Document Processing

- **pdf-parse**: PDF parsing library
- **mammoth.js**: DOCX parsing library
- **PapaParse**: CSV parsing library
- **@langchain/core**: Core utilities for LangChain
- **@langchain/openai**: OpenAI integration for LangChain

### State Management

- **Zustand**: Lightweight state management library
- **React Context API**: For component state sharing

### Testing

- **Vitest**: Testing framework
- **React Testing Library**: Component testing utilities
- **MSW**: Mock Service Worker for API mocking

### Build Tools

- **ESLint**: Code linting
- **Prettier**: Code formatting
- **PostCSS**: CSS processing
- **Vercel**: Deployment platform

## Development Setup

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git for version control
- OpenAI API key
- Pinecone API key
- Firebase project (optional)

### Environment Variables

```
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Pinecone
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment
PINECONE_INDEX=your_pinecone_index

# Firebase (optional)
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
FIREBASE_APP_ID=your_firebase_app_id

# File Storage
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env.local`
4. Run the development server: `npm run dev`
5. Access the application at `http://localhost:3000`

### Build and Deployment

1. Build the application: `npm run build`
2. Deploy to Vercel: `vercel deploy` or connect to GitHub for CI/CD

## Technical Constraints

### Performance

- Initial page load: < 2 seconds
- Time to interactive: < 3 seconds
- Chat response time: < 5 seconds
- Maximum file size: 10MB per file, 50MB total per session

### Security

- All user data must be encrypted at rest and in transit
- No PII should be stored permanently
- File uploads must be validated and sanitized
- API keys must be stored securely as environment variables
- Rate limiting for API endpoints

### Compatibility

- Browser support: Latest 2 versions of Chrome, Firefox, Safari, Edge
- Mobile support: iOS 14+, Android 10+
- Responsive design: 320px to 2560px viewport widths

### Accessibility

- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Sufficient color contrast
- Focus management

## Dependencies

### Core Dependencies

```json
{
  "dependencies": {
    "@ai-sdk/openai": "^1.1.2",
    "@langchain/core": "^0.3.42",
    "@langchain/openai": "^0.4.4",
    "@pinecone-database/pinecone": "^4.1.0",
    "@vercel/blob": "^0.27.1",
    "ai": "^4.1.16",
    "framer-motion": "^12.0.5",
    "mammoth": "^1.9.0",
    "next": "^15.2.1",
    "openai": "^4.82.0",
    "pdf-parse": "^1.1.1",
    "pg": "^8.13.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-dropzone": "^14.3.5",
    "tailwindcss": "^3.3.0",
    "zustand": "^5.0.3"
  }
}
```

### Development Dependencies

```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0",
    "msw": "^1.3.0",
    "postcss": "^8.4.0",
    "prettier": "^3.0.0",
    "typescript": "^5.0.0",
    "vitest": "^0.34.0"
  }
}
```

## Integration Points

### OpenAI API

- Used for generating chat responses
- Embedding documents for vector search
- Rate limits and token usage must be monitored

### Pinecone

- Stores document embeddings
- Used for similarity search during chat
- Namespace management for different use cases

### Firebase/Vercel Blob

- Stores uploaded documents temporarily
- Handles file access control
- Manages file expiration

### Authentication (Optional)

- Firebase Auth for user management
- Anonymous sessions for demo users
- Email/password for registered users

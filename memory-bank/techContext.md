# Technical Context - Created on March 8, 2023

## Technologies Used

### Frontend

- **Next.js 14**: React framework with server components and app router
- **React 18**: UI library for component-based development
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/ui**: Accessible and customizable component library
- **Framer Motion**: Animation library for smooth transitions
- **Vercel AI SDK**: Utilities for AI chat interfaces and streaming
- **React Dropzone**: File upload component
- **TypeScript**: Strongly typed JavaScript

### Backend

- **Next.js API Routes**: Serverless backend functions
- **Node.js**: JavaScript runtime
- **Firebase/Vercel Blob**: File storage solution
- **Pinecone**: Vector database for similarity search
- **OpenAI API**: Large language model provider
- **Firebase Auth**: Authentication service (anonymous login for demos)

### Document Processing

- **pdf-parse**: PDF parsing library
- **mammoth.js**: DOCX parsing library
- **PapaParse**: CSV parsing library
- **xlsx**: Excel file parsing library
- **langchain**: Framework for building LLM applications

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
    "@pinecone-database/pinecone": "^1.1.0",
    "@vercel/blob": "^0.14.0",
    "ai": "^2.2.0",
    "firebase": "^10.0.0",
    "framer-motion": "^10.16.0",
    "langchain": "^0.0.150",
    "mammoth": "^1.6.0",
    "next": "^14.0.0",
    "openai": "^4.0.0",
    "pdf-parse": "^1.1.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-dropzone": "^14.2.3",
    "tailwindcss": "^3.3.0",
    "xlsx": "^0.18.5",
    "zustand": "^4.4.0"
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

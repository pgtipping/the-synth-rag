# RAG Chatbot Demo

A Retrieval-Augmented Generation (RAG) chatbot demo showcasing multiple use cases (Onboarding Assistant, Sales Assistant, Knowledge Hub, etc.) built with Next.js, OpenAI, and Pinecone.

## Features

- 📄 Multi-format document processing (PDF, DOCX, TXT, CSV, etc.)
- 🔍 Vector search with Pinecone
- 💬 Streaming chat responses with OpenAI
- 🎨 Clean, Apple-inspired UI with Tailwind CSS and Shadcn/ui
- 📱 Responsive design for all devices
- 🔒 Secure file handling with automatic expiration

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- OpenAI API key
- Pinecone API key
- PostgreSQL database (optional, for production)

### Environment Setup

1. Clone the repository
2. Copy `.env.example` to `.env.local` and fill in your API keys:

```bash
cp .env.example .env.local
```

3. Install dependencies:

```bash
npm install
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment

### Deploy on Vercel

1. Create a Vercel account if you don't have one
2. Install the Vercel CLI:

```bash
npm install -g vercel
```

3. Deploy to Vercel:

```bash
vercel
```

4. Set up the required environment variables in the Vercel dashboard:
   - OPENAI_API_KEY
   - PINECONE_API_KEY
   - PINECONE_ENVIRONMENT
   - PINECONE_INDEX
   - BLOB_READ_WRITE_TOKEN (if using Vercel Blob)
   - DATABASE_URL (if using a PostgreSQL database)

### Database Setup for Production

1. Create a PostgreSQL database
2. Run the database migrations:

```bash
psql -U your_username -d your_database_name -f migrations/init.sql
```

3. Update the DATABASE_URL environment variable with your production database connection string

## Project Structure

- `src/app`: Next.js app router pages and API routes
- `src/components`: React components
- `src/lib`: Utility functions and services
- `src/hooks`: Custom React hooks
- `src/types`: TypeScript type definitions
- `docs`: Project documentation

## Testing

Run the test suite:

```bash
npm run test
```

Run integration tests:

```bash
npm run test:integration
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
# the-synth-rag

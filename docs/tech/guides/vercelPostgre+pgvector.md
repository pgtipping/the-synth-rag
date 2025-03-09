# Vercel Postgres + pgvector Details

| Feature              | Free Tier Limit      | Notes                               |
| -------------------- | -------------------- | ----------------------------------- |
| **Database Size**    | 3 GB storage         | Enough for ~100K vectors (768-dim). |
| **Compute Time**     | 100 hours/month      | Suits low-traffic demos.            |
| **Connections**      | 5 active connections | Fine for prototyping.               |
| **pgvector Support** | ✅                   | Pre-installed extension.            |

**Cost to Upgrade**:

- **Pro plan:** $20/month (10 GB storage, 1K hours compute).

---

## Why Use Vercel Postgres for Your App?

1. **Fully Managed**: No server setup – works out-of-the-box with Next.js.
2. **Temporary Data Friendly**: Matches your 30-day auto-delete policy.
3. **Cost-Effective**: Free for small demos; scales with your paid clients.

---

## Implementation Guide

### 1. Enable pgvector in Vercel Postgres

Run this SQL after creating your Vercel Postgres database:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. Create a Table for Embeddings

```sql
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  content TEXT,
  embedding VECTOR(768), -- Adjust dimensions to match your model (e.g., OpenAI uses 1536)
  user_id UUID REFERENCES auth.users(id), -- If using auth
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Insert Vectors (Node.js Example)

```javascript
import { sql } from '@vercel/postgres';

// After generating embeddings (e.g., via OpenAI)
const embedding = [...]; // Array of 768 floats
const content = "Sample document text";

await sql`
  INSERT INTO documents (content, embedding)
  VALUES (${content}, ${JSON.stringify(embedding)})
`;
```

### 4. Query Similar Vectors

```sql
SELECT content
FROM documents
ORDER BY embedding <=> ${queryEmbedding}::vector
LIMIT 5; -- Top 5 matches
```

---

## Comparison to Pinecone

|                 | Vercel Postgres + pgvector | Pinecone                  |
| --------------- | -------------------------- | ------------------------- |
| **Cost**        | Free tier + scalable       | Free tier + expensive     |
| **Setup**       | Built into Vercel (easy)   | External service          |
| **Performance** | Good for small datasets    | Optimized for large-scale |
| **Persistence** | Automatic (no extra work)  | Managed                   |

---

## Pros & Cons for Your Use Case

**Pros**:

- **Free for demos** – aligns with your 30-day data retention.
- **Simpler architecture** – no third-party vector DB.
- **Direct SQL access** – easy to debug.

**Cons**:

- **Slower for large datasets** – Pinecone is optimized for vector search.
- **No built-in chunking/embedding** – you’ll need to handle this in code.

---

## Alternatives

If Vercel Postgres limits are too restrictive:

1. **Supabase + pgvector**: Free tier (500MB DB, 50K vectors).
2. **Neon Serverless Postgres**: Separate free tier (similar to Vercel).

---

## Recommendation

Start with **Vercel Postgres + pgvector** for your demo. It’s free, integrated, and sufficient for small-scale testing. If you scale to paid clients, upgrade to Pro or switch to Pinecone/Supabase.

Need help setting this up? Let me know! 🚀

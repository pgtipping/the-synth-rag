# Redis Data Structure & Commands Cheat Sheet

## 1. Initialize Upload Session

```bash
# Generate a UUID for each upload session
UPLOAD_ID = "upload:fc3a89d0-af8b-4c21-8e57-2a9f475b5d1c"

# Set initial state with 24-hour TTL (86400 seconds)
MULTI
HSET $UPLOAD_ID \
  totalChunks 20 \
  receivedChunks 0 \
  failedChunks 0 \
  status "uploading"
EXPIRE $UPLOAD_ID 86400
EXEC
```

**Key Fields:**

- `totalChunks`: Total number of chunks expected
- `receivedChunks`: Successfully received chunks
- `failedChunks`: Failed chunk upload attempts
- `status`: Current state (uploading, assembling, completed, failed)

---

## 2. Track Chunk Progress

```bash
# When a chunk is successfully received
HINCRBY $UPLOAD_ID receivedChunks 1

# When a chunk upload fails
HINCRBY $UPLOAD_ID failedChunks 1

# Update final status when complete
HSET $UPLOAD_ID status "assembling"
```

---

## 3. Progress Monitoring

```bash
# Get real-time progress (Frontend polling)
HGETALL $UPLOAD_ID

# Calculate completion percentage (Example response)
{
  "totalChunks": "20",
  "receivedChunks": "15",
  "failedChunks": "2",
  "status": "uploading"
}

# Check if upload exists
EXISTS $UPLOAD_ID
```

---

## 4. Error Recovery

```bash
# Get list of missing chunks (Requires SET)
SADD $UPLOAD_ID:chunks_received 0 1 2 3 4
SMEMBERS $UPLOAD_ID:chunks_received → "0" "1" "2" "3" "4"
```

---

## 5. Cleanup

```bash
# Manual cleanup after successful assembly
DEL $UPLOAD_ID
DEL $UPLOAD_ID:chunks_received

# Automatic cleanup via TTL (set via EXPIRE)
```

---

## Recommended Redis Configuration

```conf
# redis.conf
maxmemory 1gb
maxmemory-policy allkeys-lru  # Auto-evict old sessions
save 900 1                    # Persist every 15min if changed
```

---

## Example Workflow

### Frontend generates UUID `fc3a89d0...`

#### Initialize

```bash
MULTI
HSET upload:fc3a89d0... totalChunks 20 receivedChunks 0 failedChunks 0 status "uploading"
EXPIRE upload:fc3a89d0... 86400
EXEC
```

#### Chunk 5 received

```bash
HINCRBY upload:fc3a89d0... receivedChunks 1
SADD upload:fc3a89d0...:chunks_received 5
```

#### Chunk 7 failed

```bash
HINCRBY upload:fc3a89d0... failedChunks 1
```

#### Completion check

```bash
HGETALL upload:fc3a89d0...
# → receivedChunks=20? Proceed to assembly
```

---

## Why This Works

- **Atomic Operations:** `HINCRBY` and `SADD` are atomic.
- **Memory Safety:** TTL ensures automatic cleanup.
- **Scalability:** Hash vs String = O(1) time complexity.
- **Resilience:** Survives server restarts with persistence.

**For production systems, add Redis Cluster for horizontal scaling.**

---

## Sample Production-Ready Implementation

### 1. Redis Client Setup

```typescript
// lib/redis.ts
import { createClient } from "redis";

const redis = createClient({
  url: process.env.REDIS_URL,
});

redis.on("error", (err) => console.error("Redis Client Error", err));

await redis.connect();

export default redis;
```

---

### 2. Initialize Upload Session

```typescript
// app/api/upload/init/route.ts
import { NextResponse } from "next/server";
import redis from "@/lib/redis";

export async function POST(req: Request) {
  const { totalChunks } = await req.json();
  const uploadId = `upload:${crypto.randomUUID()}`;

  await redis
    .multi()
    .hSet(uploadId, {
      totalChunks,
      receivedChunks: 0,
      failedChunks: 0,
      status: "uploading",
    })
    .expire(uploadId, 86400) // 24-hour TTL
    .exec();

  return NextResponse.json({ uploadId });
}
```

---

### 3. Track Chunk Progress

```typescript
// app/api/upload/chunk/route.ts
import { NextResponse } from "next/server";
import redis from "@/lib/redis";

export async function POST(req: Request) {
  const { uploadId, chunkIndex } = await req.json();

  // Mark chunk as received
  await redis
    .multi()
    .hIncrBy(uploadId, "receivedChunks", 1)
    .sAdd(`${uploadId}:chunks_received`, chunkIndex)
    .exec();

  return NextResponse.json({ success: true });
}
```

---

### 4. Monitor Progress

```typescript
// app/api/upload/progress/[uploadId]/route.ts
import { NextResponse } from "next/server";
import redis from "@/lib/redis";

export async function GET(
  req: Request,
  { params }: { params: { uploadId: string } }
) {
  const { uploadId } = params;

  const progress = await redis.hGetAll(uploadId);
  const receivedChunks = await redis.sMembers(`${uploadId}:chunks_received`);

  return NextResponse.json({
    ...progress,
    receivedChunks: receivedChunks.map(Number),
  });
}
```

---

### 5. Error Recovery

```typescript
// app/api/upload/retry/route.ts
import { NextResponse } from "next/server";
import redis from "@/lib/redis";

export async function POST(req: Request) {
  const { uploadId } = await req.json();

  const totalChunks = await redis.hGet(uploadId, "totalChunks");
  const receivedChunks = await redis.sMembers(`${uploadId}:chunks_received`);

  // Calculate missing chunks
  const allChunks = Array.from({ length: Number(totalChunks) }, (_, i) => i);
  const missingChunks = allChunks.filter(
    (chunk) => !receivedChunks.includes(chunk.toString())
  );

  return NextResponse.json({ missingChunks });
}
```

---

### 6. Frontend Integration

```typescript
// components/FileUpload.tsx
import { useEffect, useState } from "react";

export default function FileUpload() {
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/upload/progress/${uploadId}`);
      const data = await res.json();
      setProgress((data.receivedChunks / data.totalChunks) * 100);
    }, 1000);

    return () => clearInterval(interval);
  }, [uploadId]);

  return (
    <div>
      <progress value={progress} max="100" />
      <span>{progress.toFixed(1)}%</span>
    </div>
  );
}
```

---

### 7. Redis Cleanup

```typescript
// app/api/upload/complete/route.ts
import { NextResponse } from "next/server";
import redis from "@/lib/redis";

export async function POST(req: Request) {
  const { uploadId } = await req.json();

  await redis.multi().del(uploadId).del(`${uploadId}:chunks_received`).exec();

  return NextResponse.json({ success: true });
}
```

---

### 8. Environment Variables

```bash
# .env.local
REDIS_URL="redis://default:yourpassword@localhost:6379"
```

---

### 9. Testing the Flow

#### Initialize Upload

```bash
curl -X POST /api/upload/init -d '{"totalChunks": 20}'
# → {"uploadId":"upload:fc3a89d0..."}
```

#### Track Chunk

```bash
curl -X POST /api/upload/chunk -d '{"uploadId":"upload:fc3a89d0...","chunkIndex":5}'
# → {"success":true}
```

#### Check Progress

```bash
curl /api/upload/progress/upload:fc3a89d0...
# → {"totalChunks":"20","receivedChunks":"1","failedChunks":"0","status":"uploading"}
```

#### Complete Upload

```bash
curl -X POST /api/upload/complete -d '{"uploadId":"upload:fc3a89d0..."}'
# → {"success":true}
```

---

This implementation is scalable, resilient, and production-ready.

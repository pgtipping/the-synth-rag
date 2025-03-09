# Queue Monitoring Guide

## 1. BullMQ Dashboard

Run the dashboard locally:

```bash
npx bullmq-dashboard
```

Access at: <http://localhost:3000>

## 2. Key Metrics to Monitor

- **Pending Jobs**: Jobs waiting to be processed
- **Active Jobs**: Currently processing jobs
- **Completed Jobs**: Successfully processed jobs
- **Failed Jobs**: Jobs that failed after retries

## 3. Common Commands

Check queue status:

```bash
npx bullmq-cli status
```

List failed jobs:

```bash
npx bullmq-cli list failed
```

Retry failed jobs:

```bash
npx bullmq-cli retry [jobId]
```

## 4. Error Scenarios to Test

1. **Network Failure**

   - Disconnect Redis server
   - Verify queue handles connection loss gracefully

2. **File Processing Failure**

   - Upload corrupted files
   - Verify proper error handling and retries

3. **Rate Limiting**

   - Send multiple simultaneous uploads
   - Verify rate limiting works as expected

4. **Storage Failure**
   - Make Vercel Blob storage unavailable
   - Verify proper error handling

## 5. Logging

All queue operations are logged to:

- `logs/queue.log`
- Console output

# Project Plan

Build a single RAG chatbot demo showcasing multiple use cases (Onboarding Assistant, Knowledge Hub, etc.)

## **Revisions (Latest: [1/25])**

1. **Integrated Navigation**: Merged file upload and chat interfaces into a single page per use case.
2. **Collapsible Components**: Added dynamic upload zones and fixed header navigation.
3. **State Management**: Added Zustand/React Context for tracking use cases and files.

### **1. Core Requirements Clarified**

- **Objective**: Build a **single RAG chatbot demo** showcasing multiple use cases (Onboarding Assistant, Knowledge Hub, etc.).
- **User Flow**:
  1. Users land on a clean, Apple-inspired UI.
  2. They select a pre-built use case (e.g., "Sales Assistant").
  3. **On the use case page**, they upload files and chat in a single view.
  4. A CTA encourages users to contact Synthalyst for custom solutions.
- **No Customization Platform**: Avoid building a "create your own chatbot" tool. Focus on demonstrating yexpertise via pre-built use cases.

---

### **2. Compliance Requirements**

For apps handling user-uploaded data, consider:

1. **GDPR/CCPA**: Encrypt files at rest/transit, allow users to delete data, and include a privacy policy.
2. **Data Retention Policy**: Auto-delete uploaded files after 24 hours (unless paid clients request storage).
3. **Anonymization**: Strip personally identifiable information (PII) from user-uploaded data during processing (if applicable).
4. **Transparency**: Clearly state how data is used (e.g., "Your files are only used to power the chatbot and are deleted after 24 hours").

---

### **3. Technology Stack**

#### **Web App (Priority: Launch in 1 Week)**

Component | Technology
Frontend | Next.js (React) + Vercel AI SDK
UI Library | Shadcn/ui + Tailwind CSS
File Upload | react-dropzone + Firebase Storage/Vercel Blob
Backend | Node.js (Next.js API routes) + Python (optional for complex parsing)
Vector DB | Pinecone (serverless)
Auth | Firebase Auth (anonymous login for demos)
State Management | Zustand or React Context API
Animations | Framer Motion for collapsible transitions

#### **Mobile App (Post-Web Launch)**

- **Framework**: React Native (reuse React logic/components).
- **File Upload**: `react-native-document-picker` + Firebase Storage.
- **UI**: Mirror the web app's design for consistency.

---

### **4. UI/UX Specifications**

**Design Inspiration**: [Apple's Store](https://www.apple.com/store) → Minimalist, bold typography, smooth animations.

#### **Key Screens**

1. **Landing Page**:

   - Hero section: "Build Smarter Chatbots with AI + Your Data."
   - Use case cards (Onboarding Assistant, Sales Assistant, etc.) with icons and 1-line descriptions.
   - "Try Now" CTA button.

2. **Dynamic Use Case Page (/use-case/:id)**:

   - Grid of use cases with example prompts (e.g., "Upload sales docs → Get a sales strategy").
   - Tooltips explaining what each use case does.

   **Layout:**

   - Collapsible Upload Zone (expanded by default):
   - Drag-and-drop area with CDN/device upload options.
   - Auto-collapses after successful upload (user can manually toggle).

   **Chat Interface:**

   - Appears once files are processed.
   - Left sidebar with pre-built prompts (e.g., "Summarize my document").

   **Navigation:**
   **Fixed Header:**

   - Back button (returns to landing page).
   - Use case selector dropdown.
   - Upload toggle button (▲/▼).

   **Progressive CTAs:**

   - Contact form link appears after 3 chat interactions.

3. **File Upload Interface**:

   - Drag-and-drop zone (like Apple's clean UI) with support for:
     - Local files (PC/mobile).
     - CDN URLs (e.g., Google Drive, Dropbox links).
   - File previews with thumbnails and delete options.
   - Integrated into the dynamic use case page (no standalone /upload route).
   - Added upload progress indicators and auto-collapse logic.

4. **Chat Interface**:
   - Left sidebar: Toggle between use cases.
   - Chat window: Message bubbles with markdown support (for formatted responses).
   - Pre-built prompts (e.g., "Summarize my document" or "Create a sales plan").
   - "CTA" button in the header linking to a contact form.
   - Only visible after files are uploaded (smooth fade-in animation).
   - Header: Persistent access to use case switching and upload toggling.

#### **Mobile-First Approach**

- Prioritize responsive design (single-column layout for mobile).
- Use mobile-friendly gestures (swipe to delete files).
- Optimize loading times for slow networks.

---

### **5. Implementation Steps (1-Week Timeline)**

#### **Day 1-2: Scaffold the Web App**

1. **Setup**:

   - Create a Next.js app with `npx create-next-app`.
   - Integrate Vercel AI SDK for chat streaming.
   - Add Shadcn/ui and Tailwind CSS for styling.

2. **Landing Page**:

   - Build the hero section and use case cards.
   - Add Firebase Auth for anonymous sign-in.

3. **File Upload**:
   - Implement `react-dropzone` with Firebase Storage/Vercel Blob.
   - Add CDN URL input field.

#### **Day 3-4: RAG Integration**

1. **Backend**:

   - Use the Vercel AI SDK's RAG guide as a base.
   - Create API routes for:
     - File processing (extract text, chunk data).
     - Vector embeddings (OpenAI's `text-embedding-3-small`).
     - Pinecone/Supabase vector DB integration.
   - Add a chat API route for querying the RAG system.

2. **Chat UI**:

   - Build the chat window with message history.
   - Add pre-built prompts based on the selected use case.

#### **Day 5-6: Use Case Demo Logic**

1. **Pre-Configured Use Cases**:

   - Define system prompts for each use case (e.g., "You are a Sales Assistant...").
   - Map use cases to example files (e.g., Sales Assistant → upload product PDFs).
   - Add a sidebar to switch between use cases.

2. **Merge Upload & Chat Interfaces:**

   - Remove /upload route.
   - Build /use-case/[id] page with collapsible zones.

     ```tsx
     // Example: Dynamic use case page structure
     <div className="h-screen flex flex-col">
       <Header onUploadToggle={toggleUpload} />
       <CollapsibleUploadZone isOpen={isUploadOpen} />
       {filesUploaded && <ChatInterface />}
     </div>
     ```

3. **Add Fixed Header:**

   - Back button, use case dropdown, upload toggle.

4. **State Management:**

   - Use Zustand to track:

   ```ts
   interface AppState {
     currentUseCase: string;
     uploadedFiles: File[];
     isUploadOpen: boolean;
   }
   ```

5. **Testing**:
   - Test file upload → processing → chat flow.
   - Ensure responses are context-aware and accurate.

#### **Day 7: Polish & Deploy**

1. **Compliance**:

   - Add a privacy policy and data deletion disclaimer.
   - Auto-delete files after 24 hours (cron job or Firebase function).

2. **Deploy**:

   - Deploy to Vercel with `vercel deploy`.
   - Set up a custom domain (e.g., `ragdemo.yourname.com`).

3. **Demo Content**:

   - Pre-load example files for each use case (e.g., a sample employee handbook for Onboarding Assistant).

4. **Additions**:

   - Test collapsible components on mobile.
   - Add ARIA labels for accessibility compliance.

---

### **6. Post-Launch Steps**

1. **Mobile App Development**:

   - Reuse Next.js logic in React Native.
   - Prioritize core features: file upload, chat, use case selection.

2. **Monetization**:

   - Add a "CTA" page with pricing tiers (e.g., "Custom RAG Chatbot: $X/month").
   - Include a contact form for client inquiries.

3. **Compliance Deep Dive** (Post-MVP):

   - Audit data handling with tools like GDPRchecker.
   - Add user consent checkboxes during file upload.

4. **Accessibility**:
   - Verify screen reader support for collapsible components.

---

Below is the **development blueprint**, including solutions for user accounts, file-type handling, data guidance, and a sophisticated monetization strategy.

---

### **Finalized Plan Refinements**

#### **1. User Accounts & Data Retention**

**Requirements**:

- **User Accounts**: Simple email/password sign-up (no social logins for simplicity).
- **Free Tier**: 30-day data retention, max **500MB total uploads/user**.
- **Storage Quotas**: Track usage via Firebase/Firestore (e.g., `userDoc: { email, hashedPassword, files: [{ id, size, expirationDate }] }`).

**Implementation**:

- **Auth**: Use **Firebase Auth** or **Supabase** (simpler row-level security).
- **Data Retention**:
  - Schedule a cron job (e.g., GitHub Actions) or Firebase Function to delete files older than 30 days.
  - Add a dashboard showing storage usage and expiration dates.
- **Security**:
  - Hash passwords with bcrypt (Firebase handles this automatically).
  - Encrypt files at rest (AWS S3/Firebase Storage encryption).

---

#### **2. Multi-File Format Support**

**Supported Formats**: PDF, DOCX, TXT, CSV.
**Tools**:

- **PDF**: `pdf-parse` (Node.js) or `PyPDF2` (Python microservice).
- **DOCX**: `mammoth.js` (Node.js).
- **CSV**: `PapaParse` for structured data extraction.
- **TXT**: Direct processing.

**UI Guidance**:

- **Upload Hints**: Add placeholder text in the upload zone (e.g., "Upload product docs for Sales Assistant").
- **File Type Warnings**: Show alerts for unsupported formats (e.g., images).
- **Example Filenames**: Display suggested filenames for each use case (e.g., "sales_data.csv" for Sales Assistant).

---

#### **3. Preconfigured Datasets vs. User Data**

**Conflict Resolution**:

- **Sample Datasets** (Optional): Preload system-wide datasets (e.g., a generic employee handbook for Onboarding Assistant). These are **not** tied to user accounts.
- **User Uploads**: Only the user's uploaded files are used for their RAG context. Sample data remains separate.
- **Clear Separation**: Add a toggle for users to "Use Sample Data" (demo mode) or "Use My Data" (custom mode).

**Example Workflow**:

1. User selects "Sales Assistant" use case.
2. UI suggests: _"Upload product sheets, competitor analysis, or sales reports. Need inspiration? Try sample data."_
3. If user uploads files, only their data is used. Sample data is never mixed.

---

#### **4. Sophisticated "CTA" Strategy**

**Avoiding Clichés**:

- **Contextual CTAs**:
  - In the chat sidebar: _"Need a custom AI chatbot for your business? Let's discuss →"_
  - After 3 interactions: Floating button with _"Custom solutions for your unique needs"_ (subtle animation).
- **Footer Section**: _"Enterprise-ready AI chatbots built for your workflows. [Explore tailored solutions]"_ (links to a contact form).
- **Post-Chat Feedback**: After a successful output (e.g., generated sales plan), show: _"Like this? We can build one trained exclusively on your data."_

**Contact Form**:

- Ask for: Company name, use case, and data requirements (avoid lengthy forms).
- Auto-reply with a Calendly link for a consultation.

---

### **5. UI/UX Refinements**

#### **Guiding Users on Data Uploads**

- **Use Case Landing Pages**:
  - Example: For **Sales Assistant**:
    - Header: _"How it works: Upload product info, competitor data, or past sales reports."_
    - Bullet points: _"I can help you: Generate sales scripts, identify key features, create client-specific plans."_
  - Add a "?" button that opens a tooltip with example file types.
- **Empty State**:
  - If no files are uploaded: Show _"Start by uploading a product sheet or CSV file to get personalized advice."_

#### **Apple-Inspired Design Tweaks**

- **Animations**: Smooth transitions when switching use cases (like Apple's product page scroll effects).
- **Typography**: Use SF Pro (Apple's font) via `@fontsource/sf-pro`.
- **Chat Interface**:
  - Message bubbles with subtle gradients.
  - "Thinking" animation (e.g., three pulsating dots) while the chatbot processes queries.

---

### **6. Tech Stack Adjustments**

#### **Backend**

- **Node.js (Priority)**: Use Express.js or Next.js API routes.
- **Python Microservices (Optional)**:
  - Use for complex DOCX/PDF parsing (if Node.js libraries underperform).
  - Deploy via Vercel Serverless Functions or AWS Lambda.
- **Vector DB**: Stick with Pinecone (serverless) for simplicity.

#### **File Processing Flow**

1. User uploads files → stored in Firebase Storage.
2. Backend extracts text (using Node.js/Python tools).
3. Text is chunked, embedded, and stored in Pinecone.
4. Chat queries Pinecone for relevant context + LLM response.

---

### **7. Revised 1-Week Implementation Plan**

#### **Day 1-2: Core Setup**

- Scaffold Next.js app with Firebase Auth.
- Build landing page with use case cards.
- Implement file upload UI with `react-dropzone`.

#### **Day 3-4: RAG Integrations**

- Process PDF/DOCX/CSV/TXT files in Node.js.
- Configure Pinecone and OpenAI embeddings.
- Build API route for chat (Vercel AI SDK).

#### **Day 5-6: User Guidance & Polish**

- Add use case-specific upload hints and tooltips.
- Implement storage quotas and expiration logic.
- Design contextual CTAs (avoid "Hire Me" buttons).

#### **Day 7: Testing & Deployment**

- Test all file formats and use cases.
- Deploy to Vercel with Firebase integration.
- Add a privacy policy and GDPR-friendly data deletion flow.

---

### **8. Compliance Checklist**

- **GDPR/CCPA**:

  - Encrypt user data, files at rest/transit.
  - Let users delete accounts/files permanently.
  - Add cookie consent (use `react-cookie-consent`).
  - Auto-delete files after 24 hours (demo) or 30 days (free tier).
  - Privacy policy with clear data usage terms.

- **Data Minimization**: Only store necessary user data (email, hashed password, files).

- **Transparency**: Explain data usage in the privacy policy (e.g., "Files are processed to generate AI responses and deleted after 30 days").

- **Accessibility**:

  - ARIA labels for collapsible buttons and upload zones.
  - Screen reader support for chat messages.

### **9. Post-Launch**

- **Mobile App**

  - Reuse React logic in React Native.
  - Prioritize core features: file upload, chat, collapsible UI.

- **Monetization**
  - "Custom Solutions" CTA linked to a Calendly contact form.

### **10. Risk Mitigation**

- Risk: Cluttered UI
- Solution: Collapsible components + progressive disclosure.

- Risk: Data Mixing (User/Sample)
- Solution: Isolate user uploads from preloaded datasets.

- Risk: Navigation Confusion
- Solution: Fixed header with persistent back button.

### **11. Full Code Snippets**

**Dynamic Use Case Page** (/app/use-case/[id]/page.tsx)

```tsx
import { Collapsible } from "@/components/ui/collapsible";
import { useAppStore } from "@/store";

export default function UseCasePage() {
  const { isUploadOpen, uploadedFiles } = useAppStore();

  return (
    <div className="h-screen flex flex-col">
      {/* Fixed Header */}
      <Header />

      {/* Collapsible Upload Zone */}
      <Collapsible open={isUploadOpen}>
        <FileUploader />
      </Collapsible>

      {/* Chat Interface (Post-Upload) */}
      {uploadedFiles.length > 0 && (
        <motion.div animate={{ opacity: 1 }}>
          <ChatInterface />
        </motion.div>
      )}
    </div>
  );
}
```

---

### **Next Steps**

1. Start with the **web app** using the 1-week plan above.
2. For the **mobile app** (post-web):
   - Reuse 80% of the React code with React Native.
   - Prioritize file upload and chat features.
3. **Monetization**:
   - Offer "Custom Chatbot Development" as a service on your website.
   - Use the demo app as a portfolio piece to attract clients.

### **12. Testing Implementation**

#### **Unit & Integration Tests**

```typescript
// __tests__/unit/fileProcessing.test.ts
import { processFile } from "@/lib/file-processor";

describe("File Processing", () => {
  test("handles PDF files correctly", async () => {
    const mockPDF = new File(["test content"], "test.pdf", {
      type: "application/pdf",
    });
    const result = await processFile(mockPDF);
    expect(result.text).toBeDefined();
    expect(result.metadata.mimeType).toBe("application/pdf");
  });
});

// __tests__/integration/upload.test.ts
describe("Upload Flow", () => {
  test("complete upload → process → vectorize flow", async () => {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    expect(response.status).toBe(200);

    const job = await fileQueue.getJob(response.data.jobId);
    expect(job).toBeDefined();

    await job.waitUntilFinished();

    const vectors = await pinecone.fetch([job.data.vectorId]);
    expect(vectors).toBeDefined();
  });
});
```

#### **Performance Testing**

```typescript
// __tests__/performance/chat.test.ts
import { test, expect } from "@playwright/test";

test("chat response times under load", async () => {
  const start = performance.now();
  await page.locator(".chat-input").fill("Analyze the sales data");
  await page.click('button[type="submit"]');
  await page.waitForSelector(".chat-response");
  const duration = performance.now() - start;
  expect(duration).toBeLessThan(3000); // 3s max response time
});
```

### **13. Error Recovery System**

#### **Queue Configuration**

```typescript
// src/lib/queue.ts
export const fileQueue = new Queue("file-processing", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: false,
    removeOnFail: false,
  },
});

// src/lib/error-handling.ts
export class RetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RetryableError";
  }
}
```

#### **Upload Error Handling**

```typescript
// src/app/api/upload/route.ts
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";

  try {
    const { success, reset } = await ratelimit.limit(ip);
    if (!success) {
      return new Response("Too Many Requests", {
        status: 429,
        headers: { "Retry-After": String(reset) },
      });
    }

    const file = await req.blob();
    const validation = await validateFile(file);
    if (!validation.isValid) {
      return new Response(validation.error, { status: 400 });
    }

    const job = await fileQueue.add("process", { file });

    return new Response(
      JSON.stringify({
        jobId: job.id,
        status: "queued",
        statusUrl: `/api/status/${job.id}`,
      })
    );
  } catch (error) {
    console.error("Upload error:", error);
    const isRetryable = error instanceof RetryableError;

    return new Response(
      JSON.stringify({
        error: isRetryable ? "Please try again" : "Internal server error",
        retryable: isRetryable,
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      }),
      { status: isRetryable ? 503 : 500 }
    );
  }
}
```

### **14. Monitoring & Analytics**

#### **System Setup**

```typescript
// src/lib/monitoring.ts
import { Sentry } from "@sentry/nextjs";
import { Analytics } from "@segment/analytics-node";
import { Datadog } from "@datadog/browser-rum";

// Error tracking
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  integrations: [new Sentry.Integrations.Http({ tracing: true })],
});

// Usage analytics
const analytics = new Analytics({ writeKey: process.env.SEGMENT_WRITE_KEY });

// Performance monitoring
Datadog.init({
  applicationId: process.env.DATADOG_APP_ID,
  clientToken: process.env.DATADOG_CLIENT_TOKEN,
  site: "datadoghq.com",
  service: "rag-demo",
  env: process.env.NODE_ENV,
  trackInteractions: true,
  defaultPrivacyLevel: "mask-user-input",
});
```

#### **Custom Metrics**

```typescript
export const metrics = {
  async trackUpload(fileSize: number, fileType: string) {
    analytics.track("file_uploaded", { fileSize, fileType });
    Datadog.addTiming("file_upload_size", fileSize);
  },

  async trackProcessingTime(duration: number) {
    Datadog.addTiming("file_processing_duration", duration);
  },

  async trackChatResponse(duration: number, tokens: number) {
    Datadog.addTiming("chat_response_time", duration);
    analytics.track("chat_completion", {
      duration,
      tokens,
      avgTokensPerSecond: tokens / (duration / 1000),
    });
  },
};
```

#### **Monitoring Dashboard**

```typescript
export function MonitoringDashboard() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <MetricsCard
        title="Upload Success Rate"
        metric={successRate}
        trend={weekOverWeekChange}
      />
      <MetricsCard
        title="Avg Processing Time"
        metric={avgProcessingTime}
        threshold={5000}
      />
      <MetricsCard
        title="Error Rate"
        metric={errorRate}
        status={errorRate > 0.01 ? "error" : "success"}
      />
    </div>
  );
}
```

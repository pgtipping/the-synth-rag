# Project Plan

---

## **Refined Development Plan**

### **1. Core Requirements Clarified**

- **Objective**: Build a **single RAG chatbot demo** showcasing multiple use cases (Onboarding Assistant, Knowledge Hub, etc.).
- **User Flow**:
  1. Users land on a clean, Apple-inspired UI.
  2. They select a pre-built use case (e.g., "Sales Assistant").
  3. They upload files (PDFs, docs, etc.) via drag-and-drop, CDN, or device storage.
  4. They interact with the chatbot, which uses their uploaded data as context.
  5. A CTA encourages users to contact you for custom solutions.
- **No Customization Platform**: Avoid building a "create your own chatbot" tool. Focus on demonstrating your expertise via pre-built use cases.

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

| Component       | Technology                                                       | Why?                                                               |
| --------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Frontend**    | Next.js (React) + Vercel AI SDK                                  | Built-in API routes, fast deployment on Vercel, SSR for SEO.       |
| **UI Library**  | Shadcn/ui (modern, Apple-like components) + Tailwind CSS         | Pre-built, customizable components for rapid development.          |
| **File Upload** | `react-dropzone` + AWS S3 (or Vercel Blob for simplicity)        | Drag-and-drop, CDN support, easy integration.                      |
| **Backend**     | Node.js (Express.js) + Python (optional for advanced RAG tweaks) | Use Node.js for APIs; Python microservices if needed for ML tasks. |
| **Vector DB**   | Pinecone (serverless) / Supabase pgvector                        | Fast, scalable, minimal setup.                                     |
| **Auth**        | Firebase Auth (Anonymous login for demo users)                   | Quick to implement; no passwords needed for trial.                 |
| **Storage**     | Firebase Storage or Vercel Blob                                  | Simple integration with Next.js.                                   |

#### **Mobile App (Post-Web Launch)**

- **Framework**: React Native (reuse React logic/components).
- **File Upload**: `react-native-document-picker` + Firebase Storage.
- **UI**: Mirror the web app’s design for consistency.

---

### **4. UI/UX Specifications**

**Design Inspiration**: [Apple’s Store](https://www.apple.com/store) → Minimalist, bold typography, smooth animations.

#### **Key Screens**

1. **Landing Page**:

   - Hero section: "Build Smarter Chatbots with AI + Your Data."
   - Use case cards (Onboarding Assistant, Sales Assistant, etc.) with icons and 1-line descriptions.
   - "Try Now" CTA button.

2. **Use Case Selection**:

   - Grid of use cases with example prompts (e.g., "Upload sales docs → Get a sales strategy").
   - Tooltips explaining what each use case does.

3. **File Upload Interface**:

   - Drag-and-drop zone (like Apple’s clean UI) with support for:
     - Local files (PC/mobile).
     - CDN URLs (e.g., Google Drive, Dropbox links).
   - File previews with thumbnails and delete options.

4. **Chat Interface**:
   - Left sidebar: Toggle between use cases.
   - Chat window: Message bubbles with markdown support (for formatted responses).
   - Pre-built prompts (e.g., "Summarize my document" or "Create a sales plan").
   - "CTA" button in the header linking to a contact form.

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

   - Use the Vercel AI SDK’s RAG guide as a base.
   - Create API routes for:
     - File processing (extract text, chunk data).
     - Vector embeddings (OpenAI’s `text-embedding-3-small`).
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

2. **Testing**:
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

---

Below is an updated **development blueprint**, including solutions for user accounts, file-type handling, data guidance, and a sophisticated monetization strategy.

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

- **Upload Hints**: Add placeholder text in the upload zone (e.g., “Upload product docs for Sales Assistant”).
- **File Type Warnings**: Show alerts for unsupported formats (e.g., images).
- **Example Filenames**: Display suggested filenames for each use case (e.g., “sales_data.csv” for Sales Assistant).

---

#### **3. Preconfigured Datasets vs. User Data**

**Conflict Resolution**:

- **Sample Datasets** (Optional): Preload system-wide datasets (e.g., a generic employee handbook for Onboarding Assistant). These are **not** tied to user accounts.
- **User Uploads**: Only the user’s uploaded files are used for their RAG context. Sample data remains separate.
- **Clear Separation**: Add a toggle for users to “Use Sample Data” (demo mode) or “Use My Data” (custom mode).

**Example Workflow**:

1. User selects “Sales Assistant” use case.
2. UI suggests: _“Upload product sheets, competitor analysis, or sales reports. Need inspiration? Try sample data.”_
3. If user uploads files, only their data is used. Sample data is never mixed.

---

#### **4. Sophisticated "CTA" Strategy**

**Avoiding Clichés**:

- **Contextual CTAs**:
  - In the chat sidebar: _“Need a custom AI chatbot for your business? Let’s discuss →”_
  - After 3 interactions: Floating button with _“Custom solutions for your unique needs”_ (subtle animation).
- **Footer Section**: _“Enterprise-ready AI chatbots built for your workflows. [Explore tailored solutions]”_ (links to a contact form).
- **Post-Chat Feedback**: After a successful output (e.g., generated sales plan), show: _“Like this? We can build one trained exclusively on your data.”_

**Contact Form**:

- Ask for: Company name, use case, and data requirements (avoid lengthy forms).
- Auto-reply with a Calendly link for a consultation.

---

### **5. UI/UX Refinements**

#### **Guiding Users on Data Uploads**

- **Use Case Landing Pages**:
  - Example: For **Sales Assistant**:
    - Header: _“How it works: Upload product info, competitor data, or past sales reports.”_
    - Bullet points: _“I can help you: Generate sales scripts, identify key features, create client-specific plans.”_
  - Add a “?” button that opens a tooltip with example file types.
- **Empty State**:
  - If no files are uploaded: Show _“Start by uploading a product sheet or CSV file to get personalized advice.”_

#### **Apple-Inspired Design Tweaks**

- **Animations**: Smooth transitions when switching use cases (like Apple’s product page scroll effects).
- **Typography**: Use SF Pro (Apple’s font) via `@fontsource/sf-pro`.
- **Chat Interface**:
  - Message bubbles with subtle gradients.
  - “Thinking” animation (e.g., three pulsating dots) while the chatbot processes queries.

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
- Design contextual CTAs (avoid “Hire Me” buttons).

#### **Day 7: Testing & Deployment**

- Test all file formats and use cases.
- Deploy to Vercel with Firebase integration.
- Add a privacy policy and GDPR-friendly data deletion flow.

---

### **8. Compliance Checklist**

- **GDPR/CCPA**:
  - Encrypt user data.
  - Let users delete accounts/files permanently.
  - Add cookie consent (use `react-cookie-consent`).
- **Data Minimization**: Only store necessary user data (email, hashed password, files).
- **Transparency**: Explain data usage in the privacy policy (e.g., “Files are processed to generate AI responses and deleted after 30 days”).

---

### **Next Steps**

1. Start with the **web app** using the 1-week plan above.
2. For the **mobile app** (post-web):
   - Reuse 80% of the React code with React Native.
   - Prioritize file upload and chat features.
3. **Monetization**:
   - Offer “Custom Chatbot Development” as a service on your website.
   - Use the demo app as a portfolio piece to attract clients.

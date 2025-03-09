# optimal placement strategy for the file upload component

---

## Individual Chatbot Pages (Post-Use Case Selection)

**Why?**

1. **Context-Specific Uploads**:  
   Each pre-built use case (e.g., "Sales Assistant") will require **different types of files** (sales docs vs. onboarding manuals). Placing the uploader directly on the chatbot page ensures users upload files _specific to the selected use case_.

2. **User Flow Alignment**:  
   Your flow is:  
   **Landing Page → Select Use Case → Upload Files → Chat**  
   Users expect to upload files **after** choosing a use case, not before.

3. **UI/UX Clarity**:
   - Avoid overwhelming users with upload options upfront.
   - Keep the landing page focused on **use case discovery** (your "hero" demo).
   - Use the chatbot page to guide users with **use-case-specific upload hints** (e.g., “Upload sales reports here”).

---

### Implementation Breakdown

#### 1. Landing Page

- **Purpose**: Showcase use cases (no uploads here).
- **Components**:
  - Hero section with demo chatbot examples.
  - Grid of use case cards (Sales Assistant, Onboarding Assistant, etc.).
  - “Try Now” button → Directs to /use-case/[id]

#### 2. Unified Use Case Page (/use-case/[id])

##### Components

```graph TD
A[Fixed Header] --> B[Back Button]
A --> C[Use Case Selector]
A --> D[Upload Toggle]
E[Collapsible Upload Zone] --> F[File Preview Thumbnails]
G[Chat Interface] --> H[Message History]
G --> I[Pre-built Prompts]
```

##### Collapsible Upload Zone

- Default: Expanded on first visit
- Auto-hides after successful upload
- Manual toggle via header button

  **Enhanced User Flow**

  - User selects "Sales Assistant"
    → Navigates to /use-case/sales-assistant
  - Sees upload zone with contextual guidance: "Upload product sheets or sales reports"
  - Option to paste a CDN link (e.g., Google Drive).
  - Files upload → Zone collapses with animation
  - Chat interface fades in using uploaded context

##### Technical Improvements

1. State Management

   ```TypeScript
   interface UseCaseState {
   currentUseCase: string;
   uploadedFiles: File[];
   isUploadOpen: boolean;
   }
   ```

2. Dynamic Routing

```TypeScript
// app/use-case/[id]/page.tsx
export default function Page({ params }: { params: { id: string } }) {
const { setUseCase, toggleUpload } = useStore();
useEffect(() => {
setUseCase(params.id);
toggleUpload(true);
}, [params.id]);
}
```

3. UI Transitions

```TypeScript
<AnimatePresence>    {isUploadOpen && (
<motion.div
initial={{ opacity: 0, height: 0 }}
animate={{ opacity: 1, height: "auto" }}
exit={{ opacity: 0, height: 0 }} >
<FileUploader />
</motion.div>
)}
</AnimatePresence>
```

---

### Edge Case Handling

- **Switching Use Cases**:

  - Warn users if they navigate away:  
    _“Switching use cases will clear your current uploads. Continue?”_
  - Reset uploads/chat when switching to maintain context integrity.

- **Reusing Files**:  
  If a user wants to reuse files across use cases, add a **“Copy Files to New Use Case”** button (post-MVP).

---

### Visual Reference

![Upload Component Placement](https://i.imgur.com/6BzFd7L.png)  
_Landing Page (left) vs. Chatbot Page (right) with upload zone._

---

### Technical Implementation

Use Next.js **dynamic routes** for use-case-specific pages:

```tsx
// File structure
app/
  chat/
    [useCase]/
      page.tsx  ← Upload + Chat UI here
```

Store uploaded files in a global state (e.g., Zustand) scoped to the `useCase` parameter.

---

This approach aligns with your Apple-inspired design goals (minimalist, focused) while ensuring a logical, frustration-free user experience.

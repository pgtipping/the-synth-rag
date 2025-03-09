# Motion Design Principles

These are **core motion design principles** tailored to the RAG chatbot app. These will ensure animations feel intentional, enhance usability, and align with Apple’s design philosophy while avoiding distractions. Here’s a structured breakdown:

---

## **1. Purpose-Driven Motion**

**Principle**: Every animation should serve a functional purpose (e.g., guiding focus, providing feedback).  
**Examples in the App**:

- **File Upload Success**: A subtle checkmark animation confirms successful upload.
- **Error State**: A gentle horizontal shake on invalid file types.
- **Context Preservation**: Smooth transitions when switching use cases (e.g., sliding from Sales Assistant to Knowledge Hub).

**Implementation**:

- Use `framer-motion` for declarative animations tied to UI state (e.g., `animate={{ opacity: 1 }}` when files finish uploading).
- Avoid decorative animations (e.g., floating particles).

---

## **2. Fluidity & Continuity**

**Principle**: Motion should feel natural, with smooth acceleration/deceleration.  
**Examples in the App**:

- **Chat Message Entry**: Messages slide in with spring physics (`stiffness: 300, damping: 20`).
- **Theme Toggle**: Icons morph smoothly (sun ↔ moon) instead of abruptly swapping.
- **Loading Spinner**: Continuous rotation with linear easing.

**Implementation**:

- Use spring animations (not linear easing) for interactive elements:

  ```tsx
  <motion.button
    whileHover={{ scale: 1.05 }}
    transition={{ type: "spring", stiffness: 300 }}
  />
  ```

- Apply `transform` properties (GPU-accelerated) instead of `margin`/`padding` for smoothness.

---

## **3. Hierarchy & Choreography**

**Principle**: Animate elements in sequence to guide attention and avoid visual chaos.  
**Examples in the App**:

- **File Upload List**: Staggered entry animations (first file fades in, subsequent ones follow with a slight delay).
- **Use Case Cards**: Hover effects scale the card slightly while dimming others.
- **Bot Response**: Typing dots appear first, followed by the message sliding in.

**Implementation**:

- Use `staggerChildren` in `framer-motion`:

  ```tsx
  <motion.div
    initial="hidden"
    animate="visible"
    variants={{
      visible: { transition: { staggerChildren: 0.1 } }
    }}
  >
    {files.map((file) => (
      <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 }} />
    ))}
  </motion.div>
  ```

---

## **4. Spatial Relationships**

**Principle**: Animations should reinforce spatial relationships between elements.

**Examples in the App**:

- **Sidebar Navigation**: When switching use cases, the new content slides in from the same direction as the sidebar selection.
- **Chat Input Expansion**: If the input box grows for multiline text, adjacent elements adjust position smoothly.

**Implementation**:

- Use shared layout animations in `framer-motion` to connect related components:

  ```tsx
  <motion.div layout className="chat-input-container">
    {/* Input grows smoothly when expanded */}
  </motion.div>
  ```

---

## **5. Performance & Accessibility**

**Principle**: Prioritize 60fps animations and respect user preferences.  
**Implementation Details**:

- **Reduced Motion Support**: All animations respect the user's system preference for reduced motion. When `prefers-reduced-motion: reduce` is enabled:
  - Complex animations are simplified to opacity changes only
  - Spring physics are replaced with linear transitions
  - Staggered delays are removed
  - Motion duration is minimized

**Examples in Your App**:

- **Reduced Motion**: Disable message slide-ins if `prefers-reduced-motion` is enabled.
- **GPU Acceleration**: Animate `transform` and `opacity` (not `width`/`height`).

**Implementation**:

- Detect reduced motion:

  ```tsx
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  ```

- Use CSS `@media (prefers-reduced-motion: reduce)` to override animations.

---

## **6. Consistency**

**Principle**: Reuse timing, easing, and scale values across components.  
**Examples in Your App**:

- **Button Hovers**: All buttons scale by 1.02 with the same easing curve.
- **Transitions**: Use a standard duration (e.g., 300ms) for all page transitions.

**Implementation**:

- Define a **motion theme** in your design system:

  ```tsx
  const motionConfig = {
    button: { whileHover: { scale: 1.02 }, transition: { duration: 0.2 } },
    card: { whileHover: { y: -2 } },
  };
  ```

---

## **7. User Control**

**Principle**: Never trap users in animations or delay critical actions.  
**Examples in Your App**:

- **Cancel Upload**: Allow users to stop an upload mid-animation.
- **Instant Feedback**: Buttons respond to taps immediately (even if the backend is processing).

**Implementation**:

- Use `useCancel` in `@react-spring/web` to interrupt animations.
- For long processes (e.g., RAG indexing), show a non-blocking progress bar.

---

## **Motion Design Checklist**

- [ ] All animations serve a clear purpose (feedback, guidance, continuity).
- [ ] Spring physics are used for interactive elements (buttons, cards).
- [ ] Reduced motion preferences are respected.
- [ ] Animation durations are consistent (200–500ms).
- [ ] No animations block user input.

---

## **Apple-Specific Motion Tips**

1. **Depth & Parallax**: Subtle parallax effects when scrolling (e.g., hero section layers move at different speeds).
2. **Overlay Transitions**: Modals animate from the source (e.g., a “Hire Me” CTA expands from the button that triggered it).
3. **System Sounds**: Pair success/failure animations with subtle audio feedback (optional, but adds polish).

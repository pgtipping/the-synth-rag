# **Interaction Animation Plan**

**Apple-inspired interaction animations** for the chatbot app. These will prioritize smoothness, subtlety, and purpose-driven motion to enhance usability without overwhelming users.

## **1. File Upload Interactions**

### **A. Drag-and-Drop Zone Feedback**

- **Pulse Effect**:

  - When files are dragged over the zone, animate a gradient pulse (like Apple’s focus rings).

  ```css
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(0, 125, 255, 0.1);
    }
    100% {
      box-shadow: 0 0 0 12px rgba(0, 125, 255, 0);
    }
  }

  .drag-active {
    animation: pulse 1.5s infinite;
    border-color: rgb(0, 125, 255);
  }
  ```

### B. File Upload Progress

- **Smooth Progress Bar**:

  - Animate width transitions with cubic-bezier timing.

  ```tsx
  // React component
  <div className="h-1 bg-gray-200 dark:bg-gray-700 overflow-hidden">
    <div
      className="h-full bg-blue-500 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
      style={{ width: `${progress}%` }}
    />
  </div>
  ```

### C. File Card Entry

- **Staggered Fade-In**:

  - Use `@react-spring/web` for list animations.

  ```tsx
  import { animated, useTransition } from "@react-spring/web";

  const transitions = useTransition(files, {
    keys: (file) => file.id,
    from: { opacity: 0, transform: "translateY(10px)" },
    enter: { opacity: 1, transform: "translateY(0)" },
    leave: { opacity: 0 },
    config: { tension: 300, friction: 30 },
  });

  return transitions((style, file) => (
    <animated.div style={style}>
      <FileCard {...file} />
    </animated.div>
  ));
  ```

---

## **2. Chat Interface Animations**

### **A. Message Entry**

- **Differentiated Animation for User/Bot**:

  - User messages slide in from the right, bot messages from the left.

  ```css
  /* User message */
  @keyframes slideInRight {
    from {
      transform: translateX(20px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  /* Bot message */
  @keyframes slideInLeft {
    from {
      transform: translateX(-20px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .user-message {
    animation: slideInRight 0.3s ease-out;
  }

  .bot-message {
    animation: slideInLeft 0.3s ease-out;
  }
  ```

### B. Typing Indicator

- **Bouncing Dots** (like Apple Messages):

  ```tsx
  const TypingDots = () => (
    <div className="flex space-x-1">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );
  ```

### C. Auto-Scroll to New Messages

- **Smooth Scroll Behavior**:

  ```tsx
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);
  ```

---

## **3. Button & Toggle Interactions**

### A. Hover/Focus States

- **Subtle Scale + Shadow** (Apple-style buttons):

  ```css
  .button-primary {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .button-primary:hover {
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .button-primary:active {
    transform: scale(0.98);
  }
  ```

### B. Theme Toggle Transition

- **Morphing Sun/Moon Icons**:

  ```tsx
  import { AnimatePresence, motion } from "framer-motion";

  <AnimatePresence mode="wait">
    {isDark ? (
      <motion.div
        key="moon"
        initial={{ rotate: -30, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        exit={{ rotate: 30, opacity: 0 }}
      >
        <Moon className="w-5 h-5" />
      </motion.div>
    ) : (
      <motion.div
        key="sun"
        initial={{ rotate: 30, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        exit={{ rotate: -30, opacity: 0 }}
      >
        <Sun className="w-5 h-5" />
      </motion.div>
    )}
  </AnimatePresence>;
  ```

---

## **4. Page Transitions**

### A. Use Case Switching

- **Crossfade + Directional Slide**:

  ```tsx
  const [selectedUseCase, setSelectedUseCase] = useState("sales");

  <AnimatePresence mode="wait">
    <motion.div
      key={selectedUseCase}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.2 }}
    >
      {/* Content */}
    </motion.div>
  </AnimatePresence>;
  ```

### B. Loading Spinner

- **Smooth Rotation**:

  ```tsx
  <motion.div
    className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"
    animate={{ rotate: 360 }}
    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
  />
  ```

---

### **Implementation Strategy**

1. **Animation Library**: Use `framer-motion` for complex interactions and `@react-spring` for performant list animations.
2. **Performance**:
   - Prioritize CSS animations for simple effects
   - Use `will-change: transform` judiciously for complex animations
3. **Accessibility**:

   - Respect `prefers-reduced-motion` with CSS media queries
   - Ensure animations don’t trigger motion sickness

   ```css
   @media (prefers-reduced-motion: reduce) {
     * {
       animation: none !important;
       transition: none !important;
     }
   }
   ```

---

### **Apple-Specific Touches**

1. **Spring Physics**:

   ```tsx
   // Apple-like button press (spring animation)
   <motion.button
     whileHover={{ scale: 1.02 }}
     whileTap={{ scale: 0.98 }}
     transition={{ type: "spring", stiffness: 300, damping: 10 }}
   />
   ```

2. **System-Style Scrolling**:

   ```css
   /* Smooth inertial scrolling (iOS-like) */
   .chat-container {
     -webkit-overflow-scrolling: touch;
     scroll-behavior: smooth;
   }
   ```

3. **Focus Rings**:

   ```css
   /* Subtle blue ring matching Apple's style */
   input:focus {
     outline: none;
     box-shadow: 0 0 0 3px rgba(0, 125, 250, 0.3);
   }
   ```

---

### **Final Animation Checklist**

- [ ] Test all animations in light/dark modes
- [ ] Verify performance on low-end devices
- [ ] Add loading states for RAG processing
- [ ] Implement error state animations (e.g., failed upload shake)
- [ ] Ensure keyboard navigation works with animations

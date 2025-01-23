# Chat Message Stream

Let’s refine the **chat message stream** with motion design principles, focusing on Apple-like fluidity and purpose. Below is a component-by-component breakdown:

---

## **1. Chat Message Entry**

### **Animation Goals1**

- Reinforce sender identity (user vs. bot).
- Maintain scroll position for continuity.
- Prioritize readability over flashy effects.

### **Implementation1**

```tsx
import { AnimatePresence, motion } from "framer-motion";

// User message: Slides from the right
const UserMessage = ({ text }: { text: string }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    transition={{ type: "spring", stiffness: 300 }}
    className="user-message-bubble"
  >
    {text}
  </motion.div>
);

// Bot message: Slides from the left
const BotMessage = ({ text }: { text: string }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ type: "spring", stiffness: 300 }}
    className="bot-message-bubble"
  >
    {text}
  </motion.div>
);

// Full chat stream
const ChatStream = ({ messages }: { messages: Message[] }) => (
  <div className="chat-container">
    <AnimatePresence initial={false}>
      {messages.map((msg) => (
        <div key={msg.id}>
          {msg.sender === "user" ? (
            <UserMessage text={msg.text} />
          ) : (
            <BotMessage text={msg.text} />
          )}
        </div>
      ))}
    </AnimatePresence>
    <div ref={chatEndRef} /> {/* Auto-scroll anchor */}
  </div>
);
```

---

## **2. Typing Indicator**

### **Animation Goals2**

- Signal “bot is thinking” without distraction.
- Match Apple’s iMessage typing bubbles.

### **Implementation2**

```tsx
const TypingIndicator = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    className="bot-message-bubble"
  >
    <div className="flex space-x-1 px-2 py-1">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-gray-500 rounded-full"
          animate={{
            y: ["0%", "-50%", "0%"],
            scale: [1, 1.2, 1],
          }}
          transition={{
            repeat: Infinity,
            duration: 0.6,
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  </motion.div>
);
```

---

## **3. Message Reactions**

### **Animation Goals3**

- Provide subtle feedback for actions (e.g., copy to clipboard).

### **Implementation3**

```tsx
// When user copies a message, show a checkmark
const CopyFeedback = () => (
  <motion.div
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    className="absolute -top-2 -right-2"
  >
    <CheckCircle className="w-4 h-4 text-green-500" />
  </motion.div>
);

// On message hover, fade in copy button
<motion.div
  whileHover={{ opacity: 1 }}
  className="opacity-0 absolute top-2 right-2"
>
  <CopyButton />
</motion.div>;
```

---

## **4. Error State**

### **Animation Goals4**

- Alert users without causing panic.

### **Implementation4**

```tsx
const ErrorMessage = ({ text }: { text: string }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{
      opacity: 1,
      x: 0,
      transition: { type: "spring", stiffness: 300 },
    }}
    exit={{ opacity: 0 }}
    className="error-bubble"
  >
    <AlertTriangle className="w-4 h-4 mr-2" />
    {text}
  </motion.div>
);
```

---

### **5. Auto-Scroll Behavior**

#### **Implementation5**

```tsx
// Smoothly scroll to new messages
const chatEndRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  chatEndRef.current?.scrollIntoView({
    behavior: messages.length > 1 ? "smooth" : "auto",
    block: "end",
  });
}, [messages]);

// Respect reduced motion
const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

useEffect(() => {
  if (prefersReducedMotion) {
    chatEndRef.current?.scrollIntoView({ behavior: "auto" });
  }
}, [messages, prefersReducedMotion]);
```

---

### **6. Performance Optimizations**

1. **Debounce Scroll Events**:

   ```tsx
   import { debounce } from "lodash-es";

   const handleScroll = debounce(() => {
     /* Track scroll position */
   }, 100);
   ```

2. **Virtualize Long Lists**:  
   Use `react-virtuoso` for chat streams with 100+ messages.
3. **Recycle Animations**:  
   Reuse motion components instead of re-mounting:

   ```tsx
   <AnimatePresence mode="popLayout">
     {messages.map((msg) => (
       <Message key={msg.id} {...msg} />
     ))}
   </AnimatePresence>
   ```

---

### **Motion Design Validation**

#### **Test Cases**

1. **Slow Connection**:

   - Verify typing indicator remains smooth.
   - Test message queuing animation (messages don’t overlap).

2. **Quick Back-and-Forth**:

   - Ensure user/bot messages don’t collide mid-animation.

3. **Long Responses**:

   - Confirm auto-scroll works even for multi-page bot replies.

4. **Accessibility**:
   - Toggle `prefers-reduced-motion` in OS settings to disable animations.

---

### **Final Polish**

1. **Sound Effects** (Optional):  
   Add subtle "sent" or "received" sounds using `use-sound`:

   ```tsx
   import { useSound } from "use-sound";

   const [playSend] = useSound("/sounds/send.mp3", { volume: 0.25 });
   const [playReceive] = useSound("/sounds/receive.mp3", { volume: 0.15 });
   ```

2. **Haptic Feedback** (Mobile):  
   Use `navigator.vibrate` for message sends:

   ```tsx
   const sendMessage = () => {
     if ("vibrate" in navigator) navigator.vibrate(10);
     // ...
   };
   ```

---

By anchoring motion to user intent (e.g., differentiating sender direction, signaling processing states), the chat stream will feel **purposeful and polished** – like a native Apple experience.

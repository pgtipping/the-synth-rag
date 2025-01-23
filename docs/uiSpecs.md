# UI Plan

Below are detailed specifications, including color schemes, component behavior, and implementation steps.

---

## **UI Components Deep Dive**

### **1. Theming Strategy**

- **Design System**: Use Apple’s minimalist aesthetic with subtle gradients, soft shadows, and smooth transitions.
- **Color Schemes**:
  - **Light Mode**: Clean, airy, and focused on readability (similar to Apple’s white/light gray palette).
  - **Dark Mode**: Deep grays with blue-tinged accents (like macOS Dark Mode).
- **Dynamic Toggle**: Add a theme switcher in the header (sun/moon icon) with a smooth fade animation.

---

### **2. Key UI Components**

#### **A. Landing Page**

- **Hero Section**:
  - **Light Mode**: White background (`#ffffff`) with soft gradients (e.g., `linear-gradient(45deg, #f5f5f7 0%, #ffffff 100%)`).
  - **Dark Mode**: Dark gray background (`#1a1a1a`) with subtle depth (`linear-gradient(45deg, #2c2c2e 0%, #1a1a1a 100%)`).
  - **Typography**: Bold headings in SF Pro (Apple’s font) with `text-gray-900` (light) / `text-gray-100` (dark).
- **Use Case Cards**:
  - **Light Mode**: White cards with soft shadows (`shadow-lg`), hover effect: slight elevation.
  - **Dark Mode**: Dark gray cards (`#2c2c2e`) with `border-gray-700` and hover glow (`rgba(0, 125, 250, 0.1)`).

#### **B. File Upload Interface**

- **Drag-and-Drop Zone**:
  - **Light Mode**: `bg-gray-50` with dashed `border-gray-300`.
  - **Dark Mode**: `bg-gray-900` with dashed `border-gray-600`.
  - **Active State**: Pulse animation on file drag-over.
- **Uploaded Files List**:
  - **File Cards**: `bg-white` (light) / `bg-gray-800` (dark) with `hover:bg-gray-100` / `hover:bg-gray-700`.
  - **Delete Button**: Red-500 (light) / Red-400 (dark) on hover.

#### **C. Chat Interface**

- **Chat Window**:
  - **Background**: `bg-white` (light) / `bg-gray-900` (dark).
  - **User Message**: `bg-blue-100` (light) / `bg-blue-900` (dark) with `text-gray-900` / `text-blue-50`.
  - **Bot Message**: `bg-gray-100` (light) / `bg-gray-800` (dark) with `text-gray-800` / `text-gray-100`.
  - **Input Box**: `bg-gray-50` (light) / `bg-gray-800` (dark) with focus ring `ring-blue-500`.

#### **D. Sidebar (Use Case Selection)**

- **Background**: `bg-gray-50` (light) / `bg-gray-900` (dark).
- **Active Use Case**: `bg-blue-100` (light) / `bg-blue-900` (dark) with `border-l-4 border-blue-500`.
- **Hover Effect**: `hover:bg-gray-100` (light) / `hover:bg-gray-800` (dark).

#### **E. Dashboard (Storage Usage)**

- **Progress Bar**: `bg-blue-500` (light) / `bg-blue-400` (dark).
- **Text**: `text-gray-600` (light) / `text-gray-300` (dark).

---

### **3. Implementation Steps**

#### **A. Set Up Theming**

1. **CSS Variables** (using Tailwind):

   ```css
   /* globals.css */
   :root {
     --background: 255, 255, 255;
     --foreground: 0, 0, 0;
     --primary: 0, 125, 250;
     --border: 229, 229, 229;
   }

   .dark {
     --background: 26, 26, 26;
     --foreground: 255, 255, 255;
     --primary: 100, 210, 255;
     --border: 64, 64, 64;
   }
   ```

2. **Tailwind Config**:

   ```javascript
   // tailwind.config.js
   module.exports = {
     darkMode: "class", // Manual toggle (not system-prefix)
     theme: {
       extend: {
         colors: {
           background: "rgb(var(--background))",
           foreground: "rgb(var(--foreground))",
           primary: "rgb(var(--primary))",
           border: "rgb(var(--border))",
         },
       },
     },
   };
   ```

#### **B. Theme Toggle Component**

```tsx
// components/ThemeToggle.tsx
"use client";
import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    setIsDark(savedTheme === "dark");
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "light" : "dark");
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
    </button>
  );
}
```

#### **C. Apply Themes to Components**

- **Button Example**:

  ```tsx
  <button className="bg-primary text-foreground hover:bg-primary/90">
    Upload Files
  </button>
  ```

- **Chat Message**:

  ```tsx
  // User message
  <div className="bg-blue-100 dark:bg-blue-900 text-foreground rounded-lg p-4">
    {message}
  </div>
  ```

#### **D. Animations**

- **Pulse on File Drag**:

  ```css
  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  ```

- **Smooth Theme Transition**:

  ```css
  * {
    transition: background-color 0.3s ease, border-color 0.3s ease;
  }
  ```

---

### **4. Apple-Inspired Touches**

1. **Font**: Use SF Pro (Apple’s system font) via:

   ```bash
   npm install @fontsource/sf-pro
   ```

   ```css
   /* globals.css */
   @import "@fontsource/sf-pro";
   body {
     font-family: "SF Pro", sans-serif;
   }
   ```

2. **Input Fields**:

   - Subtle inner shadow on focus (like macOS inputs).
   - Rounded corners (`rounded-lg`).

3. **Chat Scrollbar**:

   ```css
   /* Hide scrollbar in WebKit */
   ::-webkit-scrollbar {
     width: 0;
     background: transparent;
   }
   ```

---

### **5. Final UI Checklist**

- [ ] Test all components in light/dark modes.
- [ ] Ensure contrast ratios meet accessibility standards (WCAG AA).
- [ ] Add smooth transitions for theme toggling.
- [ ] Prefer SVG icons (e.g., Lucide) that adapt to theme colors.

---

Would you like to refine any specific component (e.g., chat bubbles, file uploader) further, or focus on interaction animations?

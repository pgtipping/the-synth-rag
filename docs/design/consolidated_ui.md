# Consolidated UI/UX Specifications

## Design Inspiration

Apple's Store: Minimalist, bold typography, smooth animations, sophisticated depth.

## Theming Strategy

- **Design System**: Apple's minimalist aesthetic with layered depth (shadows, elevation, subtle gradients).
- **Color Schemes**:
  - **Light Mode**:
    - Primary Background: `#ffffff`
    - Secondary Background: `#f5f5f7`
    - Primary Text: `#1d1d1f`
    - Secondary Text: `#6e6e73`
    - Accent Blue: `#0066cc`
    - Success Green: `#23a55a`
    - Destructive Red: `#ff3b30`
  - **Dark Mode**:
    - Primary Background: `#000000`
    - Secondary Background: `#1c1c1e`
    - Primary Text: `#f5f5f7`
    - Secondary Text: `#aeaeb2`
    - Accent Blue: `#0a84ff`
    - Success Green: `#32d74b`
    - Destructive Red: `#ff453a`
- **Dynamic Toggle**: Theme switcher with 0.3s transition using `cubic-bezier(0.4, 0, 0.2, 1)`

## Key UI Components

### Global Header

- Height: Fixed 44px
- Background: Light mode: `rgba(255, 255, 255, 0.8)`, Dark mode: `rgba(0, 0, 0, 0.8)`
- Backdrop filter: `blur(20px)`
- Border-bottom: `1px solid rgba(0, 0, 0, 0.1)` (light) / `1px solid rgba(255, 255, 255, 0.1)` (dark)
- Sticky positioning with z-index: 50
- Elements maintain 20px minimum margins from edges
- Typography: SF Pro Text 12px with -0.01em letter-spacing

### Footer

- Background: Light mode: `#f5f5f7`, Dark mode: `#1c1c1e`
- Padding: 40px 20px
- Border-top: `1px solid rgba(0, 0, 0, 0.1)` (light) / `1px solid rgba(255, 255, 255, 0.1)` (dark)
- Links: 12px SF Pro Text, grouped by category
- Max-width: 980px margin auto
- 5-column grid with 20px gaps

### Landing Page

- **Hero Section**:

  - Background gradients:
    - Light: `linear-gradient(180deg, #ffffff 0%, #f5f5f7 100%)`
    - Dark: `linear-gradient(180deg, #1c1c1e 0%, #2c2c2e 100%)`
  - Typography:
    - Heading: 48px SF Pro Display, -0.015em letter-spacing
    - Subheading: 21px SF Pro Text, -0.01em letter-spacing

- **Use Case Cards**:
  - Background: `#ffffff` (light) / `#2c2c2e` (dark)
  - Border-radius: 18px
  - Box-shadow:
    - Light: `0 2px 8px rgba(0, 0, 0, 0.04), 0 4px 24px rgba(0, 0, 0, 0.08)`
    - Dark: `0 2px 8px rgba(0, 0, 0, 0.2), 0 4px 24px rgba(0, 0, 0, 0.3)`
  - Hover transform: `translateY(-2px)`
  - Transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)
  - Padding: 30px
  - Gap between cards: 20px

### File Upload Interface

- **Drag-and-Drop Zone**:

  - Border: 2px dashed `rgba(0, 0, 0, 0.1)` (light) / `rgba(255, 255, 255, 0.1)` (dark)
  - Border-radius: 18px
  - Background: `#f5f5f7` (light) / `#2c2c2e` (dark)
  - Active state:
    - Border-color: `#0066cc` (light) / `#0a84ff` (dark)
    - Background: `rgba(0, 102, 204, 0.05)` (light) / `rgba(10, 132, 255, 0.1)` (dark)
  - Pulse animation: 2s cubic-bezier(0.4, 0, 0.6, 1) infinite

- **Uploaded Files List**:
  - File cards background: `#ffffff` (light) / `#1c1c1e` (dark)
  - Border-radius: 12px
  - Box-shadow: `0 1px 3px rgba(0, 0, 0, 0.1)`
  - Hover: `bg-gray-50` (light) / `bg-gray-800` (dark)
  - Delete button: Red icon with hover scale 1.1

### Chat Interface

- **Chat Window**:

  - Background: `#ffffff` (light) / `#000000` (dark)
  - Padding: 20px
  - Max-width: 880px margin auto

- **Message Bubbles**:

  - User Message:
    - Background: `#0066cc` (light) / `#0a84ff` (dark)
    - Text: `#ffffff`
    - Border-radius: 18px 18px 4px 18px
    - Max-width: 70%
    - Margin: 8px 0
    - Box-shadow: `0 1px 2px rgba(0, 0, 0, 0.1)`
  - Bot Message:
    - Background: `#f5f5f7` (light) / `#1c1c1e` (dark)
    - Text: `#1d1d1f` (light) / `#f5f5f7` (dark)
    - Border-radius: 18px 18px 18px 4px
    - Max-width: 70%
    - Margin: 8px 0
    - Box-shadow: `0 1px 2px rgba(0, 0, 0, 0.1)`

- **Input Box**:
  - Height: 44px
  - Border-radius: 22px
  - Background: `#f5f5f7` (light) / `#1c1c1e` (dark)
  - Border: none
  - Box-shadow: `0 1px 3px rgba(0, 0, 0, 0.1)`
  - Focus ring: `#0066cc` 2px
  - Padding: 0 20px
  - Font: 17px SF Pro Text

### Sidebar

- **Background**: `#f5f5f7` (light) / `#1c1c1e` (dark)
- **Width**: 280px
- **Border-right**: `1px solid rgba(0, 0, 0, 0.1)` (light) / `1px solid rgba(255, 255, 255, 0.1)` (dark)
- **Menu Items**:
  - Height: 44px
  - Padding: 0 16px
  - Font: 14px SF Pro Text
  - Active state:
    - Background: `#ffffff` (light) / `#2c2c2e` (dark)
    - Border-left: 4px solid `#0066cc` (light) / `#0a84ff` (dark)
  - Hover state:
    - Background: `rgba(0, 0, 0, 0.05)` (light) / `rgba(255, 255, 255, 0.05)` (dark)
  - Transition: all 0.2s ease

### Buttons

- **Primary Button**:

  - Background: `#0066cc` (light) / `#0a84ff` (dark)
  - Text: `#ffffff`
  - Height: 44px
  - Border-radius: 22px
  - Padding: 0 24px
  - Font: 17px SF Pro Text
  - Hover: Opacity 0.9
  - Active: Scale 0.98
  - Disabled: Opacity 0.5

- **Secondary Button**:

  - Background: `rgba(0, 0, 0, 0.05)` (light) / `rgba(255, 255, 255, 0.1)` (dark)
  - Text: `#1d1d1f` (light) / `#ffffff` (dark)
  - Height: 44px
  - Border-radius: 22px
  - Padding: 0 24px
  - Font: 17px SF Pro Text
  - Hover: Background opacity increase 0.1
  - Active: Scale 0.98

- **Destructive Button**:
  - Background: `#ff3b30` (light) / `#ff453a` (dark)
  - Text: `#ffffff`
  - Other properties same as primary

### Dashboard Elements

- **Progress Bar**:

  - Height: 6px
  - Border-radius: 3px
  - Background: `#0066cc` (light) / `#0a84ff` (dark)
  - Track: `rgba(0, 0, 0, 0.1)` (light) / `rgba(255, 255, 255, 0.1)` (dark)

- **Stats Cards**:
  - Background: `#ffffff` (light) / `#1c1c1e` (dark)
  - Border-radius: 18px
  - Box-shadow: `0 2px 8px rgba(0, 0, 0, 0.04), 0 4px 24px rgba(0, 0, 0, 0.08)`
  - Padding: 24px
  - Gap: 20px

### Responsive Behavior

- **Breakpoints**:

  - Mobile: 375px
  - Tablet: 834px
  - Desktop: 1440px

- **Mobile Adjustments**:
  - Sidebar becomes bottom sheet or slide-over
  - Card grid switches to single column
  - Reduced padding and margins by 25%
  - Touch targets minimum 44px

### Animations

- **Page Transitions**: 0.3s fade
- **Component Transitions**: 0.2s ease
- **Button Interactions**: 0.2s cubic-bezier(0.4, 0, 0.2, 1)
- **Card Hover**: 0.3s transform + shadow
- **Theme Toggle**: 0.3s background-color transition

## Implementation Notes

- Use `@apply` in Tailwind for consistent component styles
- Implement dark mode using CSS variables
- Use Framer Motion for complex animations
- Ensure all interactive elements have hover/active states
- Maintain consistent spacing using 4px grid
- Use SF Pro fonts throughout the interface

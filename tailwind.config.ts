import type { Config } from "tailwindcss/types";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class", "class"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        display: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      colors: {
        light: {
          background: "#ffffff",
          secondary: "#f5f5f7",
          text: {
            primary: "#1d1d1f",
            secondary: "#6e6e73",
          },
          accent: "#0066cc",
          success: "#23a55a",
          destructive: "#ff3b30",
        },
        dark: {
          background: "#000000",
          secondary: "#1c1c1e",
          text: {
            primary: "#f5f5f7",
            secondary: "#aeaeb2",
          },
          accent: "#0a84ff",
          success: "#32d74b",
          destructive: "#ff453a",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      spacing: {
        header: "44px",
      },
      borderRadius: {
        card: "18px",
        button: "22px",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "card-light":
          "0 2px 8px rgba(0, 0, 0, 0.04), 0 4px 24px rgba(0, 0, 0, 0.08)",
        "card-dark":
          "0 2px 8px rgba(0, 0, 0, 0.2), 0 4px 24px rgba(0, 0, 0, 0.3)",
      },
      backgroundImage: {
        "gradient-light": "linear-gradient(180deg, #ffffff 0%, #f5f5f7 100%)",
        "gradient-dark": "linear-gradient(180deg, #1c1c1e 0%, #2c2c2e 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      },
      keyframes: {
        fadeIn: {
          "0%": {
            opacity: "0",
          },
          "100%": {
            opacity: "1",
          },
        },
        slideUp: {
          "0%": {
            transform: "translateY(10px)",
            opacity: "0",
          },
          "100%": {
            transform: "translateY(0)",
            opacity: "1",
          },
        },
      },
      fontSize: {
        "heading-large": [
          "48px",
          {
            letterSpacing: "-0.015em",
            lineHeight: "1.1",
          },
        ],
        "body-large": [
          "21px",
          {
            letterSpacing: "-0.01em",
            lineHeight: "1.4",
          },
        ],
        "body-small": [
          "12px",
          {
            letterSpacing: "-0.01em",
            lineHeight: "1.4",
          },
        ],
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;

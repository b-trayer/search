import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Crimson Pro', 'serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        notion: {
          bg: {
            DEFAULT: '#ffffff',
            secondary: '#f7f6f3',
            tertiary: '#f1f1ef',
            hover: 'rgba(55, 53, 47, 0.04)',
            active: 'rgba(55, 53, 47, 0.08)',
          },
          text: {
            DEFAULT: '#37352f',
            secondary: '#6b6b6b',
            tertiary: '#9b9a97',
          },
          border: {
            DEFAULT: 'rgba(55, 53, 47, 0.09)',
            strong: 'rgba(55, 53, 47, 0.16)',
          },
          accent: {
            DEFAULT: '#2383e2',
            hover: '#1a73d4',
            light: 'rgba(35, 131, 226, 0.1)',
          },
          success: '#0f7b6c',
          warning: '#d9730d',
          error: '#e03e3e',
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        'notion': '6px',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateX(-10px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.8)" },
          "70%": { transform: "scale(1.05)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "glow": {
          "0%, 100%": { boxShadow: "0 0 5px hsl(var(--primary) / 0.3)" },
          "50%": { boxShadow: "0 0 20px hsl(var(--primary) / 0.6)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "count-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "bounce-soft": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-3px)" },
        },
        "highlight-pulse": {
          "0%, 100%": { backgroundColor: "hsl(var(--highlight) / 0.3)" },
          "50%": { backgroundColor: "hsl(var(--highlight) / 0.6)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out forwards",
        "slide-in": "slide-in 0.3s ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "slide-up": "slide-up 0.5s ease-out forwards",
        "pop-in": "pop-in 0.4s ease-out forwards",
        "glow": "glow 2s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "count-up": "count-up 0.5s ease-out forwards",
        "bounce-soft": "bounce-soft 0.6s ease-in-out",
        "highlight-pulse": "highlight-pulse 1.5s ease-in-out infinite",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        card: "var(--shadow-card)",
        'notion-sm': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'notion-md': '0 4px 6px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.08)',
        'notion-lg': '0 12px 24px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [import("tailwindcss-animate")],
} satisfies Config;

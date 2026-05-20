import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0f1115",
          soft: "#1a1d24",
          muted: "#6b7280",
        },
        paper: {
          DEFAULT: "#fafaf7",
          soft: "#f3f2ec",
        },
        accent: {
          DEFAULT: "#16a34a", // money green
          dark: "#15803d",
        },
        warn: "#dc2626",
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['ui-serif', 'Georgia', 'Cambria', 'serif'],
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
      },
    },
  },
  plugins: [],
};

export default config;

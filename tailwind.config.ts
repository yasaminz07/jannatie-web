import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F6F6F3",
        foreground: "#0D0D0D",
        primary: {
          DEFAULT: "#0066CC",
          50: "#EEF4FF",
          100: "#DDEAFF",
          500: "#0066CC",
          600: "#0052A3",
          700: "#003D7A",
        },
        accent: {
          DEFAULT: "#E07B00",
          50: "#FFF7ED",
          100: "#FFEDD5",
          500: "#E07B00",
          600: "#B36200",
        },
        danger: "#DC2626",
        card: "#FFFFFF",
        border: "#E5E7EB",
        muted: "#6B7280",
        sidebar: "#0D0D0D",
      },
      fontFamily: {
        heading: ["var(--font-geist-sans)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
        arabic: ["var(--font-noto-naskh-arabic)", "serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "count-up": "countUp 1.5s ease-out",
        "pulse-dot": "pulseDot 1.4s ease-in-out infinite",
        shimmer: "shimmer 1.5s infinite",
        ticker: "ticker 30s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseDot: {
          "0%, 80%, 100%": { transform: "scale(0)", opacity: "0.5" },
          "40%": { transform: "scale(1)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.07)",
        "card-hover": "0 4px 12px 0 rgba(0,0,0,0.12)",
        "blue-glow": "0 0 20px rgba(0,102,204,0.3)",
      },
    },
  },
  plugins: [],
};

export default config;

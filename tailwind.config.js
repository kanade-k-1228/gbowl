/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: [
          "ui-sans-serif",
          "Inter",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "JetBrains Mono",
          "Menlo",
          "monospace",
        ],
      },
      colors: {
        bg: {
          DEFAULT: "#0a0a0c",
          elevated: "#15161b",
          panel: "#1a1c23",
        },
        accent: {
          DEFAULT: "#22d3ee",
          warm: "#f97316",
          danger: "#f43f5e",
        },
      },
      boxShadow: {
        glow: "0 0 24px rgba(34, 211, 238, 0.35)",
        "glow-warm": "0 0 18px rgba(249, 115, 22, 0.35)",
      },
      backgroundImage: {
        "gradient-radial":
          "radial-gradient(circle at center, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "gf-deep": "#06060b",
        "gf-card": "#0c0c14",
        "gf-elevated": "#12121c",
        "gf-border": "#1a1a2e",
        "gf-border-hover": "#2a2a44",
        "gf-text": "#ededf0",
        "gf-text-secondary": "#8888a0",
        "gf-text-muted": "#55556a",
        "gf-blue": "#4d8fcc",
        "gf-red": "#e05572",
        "gf-green": "#3ddc84",
      },
      fontFamily: {
        sans: ["Space Grotesk", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;

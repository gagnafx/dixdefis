import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#07131f",
        ocean: "#0b2535",
        lagoon: "#0e7490",
        sand: "#f6e8c9",
        coral: "#f97362",
        mint: "#43d6b0"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(67, 214, 176, .18), 0 20px 60px rgba(2, 12, 20, .35)"
      }
    }
  },
  plugins: []
};

export default config;
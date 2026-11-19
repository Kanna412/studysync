import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: { extend: { colors: { brand: { 500: "#0f766e", 600: "#0d5f59" } } } },
  plugins: [],
} satisfies Config;

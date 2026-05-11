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
        // ベースの灰色（背景・罫線）
        ink: {
          50:  "#f5f6f7",
          100: "#eceef0",
          200: "#dde0e3",
          300: "#c5c9ce",
          400: "#9aa0a6",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827",
        },
        // ブランド色：医療・ケアの清潔感を狙ったティールブルー
        brand: {
          50:  "#e6f4f5",
          100: "#c1e4e7",
          200: "#92cfd5",
          300: "#60b9c1",
          400: "#34a3ae",
          500: "#0d8a96",
          600: "#067782",
          700: "#04606a",
          800: "#054c54",
          900: "#063a40",
        },
        // ステータスバッジ用
        info: { 50: "#eaf4fb", 600: "#1976d2", 700: "#155fa8" },
        ok:   { 50: "#e7f6ee", 600: "#1f8a4c", 700: "#176a3a" },
        warn: { 50: "#fff4e3", 600: "#b46a00", 700: "#8a5100" },
        err:  { 50: "#fcebec", 600: "#c1393f", 700: "#9c2d33" },
      },
      fontFamily: {
        sans: [
          "Meiryo",
          "メイリオ",
          "Hiragino Kaku Gothic ProN",
          "Hiragino Sans",
          "Yu Gothic Medium",
          "Yu Gothic",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(0,0,0,0.02)",
      },
      borderRadius: {
        card: "8px",
      },
    },
  },
  plugins: [],
};
export default config;

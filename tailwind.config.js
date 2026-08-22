/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.tsx",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
    "./navigation/**/*.{js,jsx,ts,tsx}",
    "./contexts/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Health-monitoring palette: calm greens with a warm alert accent.
        brand: {
          50: "#f0f9f4",
          100: "#dcf0e3",
          500: "#2e7d4f",
          600: "#276a43",
          700: "#215838",
          900: "#123122",
        },
        alert: "#b3401f",
      },
    },
  },
  plugins: [],
};

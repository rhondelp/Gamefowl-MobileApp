/** @type {import('tailwindcss').Config} */

// Poppins ships as one static file per weight (Regular/Medium/SemiBold/Bold),
// not a variable font, so a custom `fontFamily` on RN Text can't be
// synthesized by `fontWeight` the way a system font would — each weight
// needs to be selected by its own family name. The plugin below re-targets
// the app's existing font-weight utilities (font-normal/medium/semibold/
// bold — the only four the app uses) to do that, and gives every font-size
// utility a Poppins Regular default so unweighted body text picks it up too
// — together that covers text app-wide without editing any screen.
const POPPINS_BY_WEIGHT = {
  normal: "Poppins_400Regular",
  medium: "Poppins_500Medium",
  semibold: "Poppins_600SemiBold",
  bold: "Poppins_700Bold",
};

function poppinsPlugin({ addUtilities }) {
  addUtilities(
    Object.fromEntries(
      ["xs", "sm", "base", "lg", "xl", "2xl", "3xl"].map((size) => [
        `.text-${size}`,
        { fontFamily: POPPINS_BY_WEIGHT.normal },
      ])
    )
  );
  addUtilities(
    Object.fromEntries(
      Object.entries(POPPINS_BY_WEIGHT).map(([weight, family]) => [
        `.font-${weight}`,
        // !important: a weight utility must win over the text-size default
        // above regardless of which one Tailwind happens to emit later.
        { fontFamily: `${family} !important` },
      ])
    )
  );
}

module.exports = {
  content: [
    "./App.tsx",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
    "./navigation/**/*.{js,jsx,ts,tsx}",
    "./contexts/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  // The numeric fontWeight this generates is inert on a custom, non-variable
  // font (RN can't synthesize Bold from Regular + fontWeight), so it's
  // disabled outright rather than left in place alongside our replacement.
  corePlugins: {
    fontWeight: false,
  },
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
      fontFamily: {
        sans: [POPPINS_BY_WEIGHT.normal],
      },
    },
  },
  plugins: [poppinsPlugin],
};

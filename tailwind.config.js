/** @type {import('tailwindcss').Config} */

// Poppins ships as one static file per weight (Regular/Medium/SemiBold/Bold),
// not a variable font, so a custom `fontFamily` on RN Text can't be
// synthesized by `fontWeight` the way a system font would — each weight
// needs to be selected by its own family name. The plugin below re-targets
// the app's existing font-weight utilities (font-normal/medium/semibold/
// bold — the only four the app uses) to do that, and gives every font-size
// utility a Poppins Regular default so unweighted body text picks it up too
// — together that covers text app-wide without editing any screen.
const { brand, surface, status, text } = require("./components/ui/palette");

const POPPINS_BY_WEIGHT = {
  normal: "Poppins_400Regular",
  medium: "Poppins_500Medium",
  semibold: "Poppins_600SemiBold",
  bold: "Poppins_700Bold",
};

// One scale, app-wide: 12 / 14 / 16 / 20 / 24 / 32. Anything outside it was a
// per-screen one-off, so the ladder deliberately stops at six steps.
const TYPE_SCALE = {
  xs: ["12px", { lineHeight: "16px" }],
  sm: ["14px", { lineHeight: "20px" }],
  base: ["16px", { lineHeight: "24px" }],
  lg: ["20px", { lineHeight: "28px" }],
  xl: ["24px", { lineHeight: "32px" }],
  "2xl": ["32px", { lineHeight: "40px" }],
};

function poppinsPlugin({ addUtilities }) {
  addUtilities(
    Object.fromEntries(
      Object.keys(TYPE_SCALE).map((size) => [
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
    // Replaced, not extended: the point is that sizes outside this ladder
    // stop being reachable.
    fontSize: TYPE_SCALE,
    extend: {
      colors: {
        brand,
        alert: status.critical.solid,
        surface,
        // Semantic status tones — see components/ui/palette.js. Flattened to
        // `healthy-soft` / `attention-text` etc. so they read as one system.
        ...Object.fromEntries(
          Object.entries(status).map(([name, shades]) => [name, shades])
        ),
        ink: text,
      },
      borderRadius: {
        // Cards sit at 20, controls and chips at 16.
        card: "20px",
        control: "16px",
      },
      fontFamily: {
        sans: [POPPINS_BY_WEIGHT.normal],
      },
    },
  },
  plugins: [poppinsPlugin],
};

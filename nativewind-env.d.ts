/// <reference types="nativewind/types" />

// Gives TypeScript the JSX `className` prop support added by NativeWind.

// Side-effect import of global.css has no runtime types; declaring the
// module pattern lets TypeScript allow it in App.tsx.
declare module "*.css";

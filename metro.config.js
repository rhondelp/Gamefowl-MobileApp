const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// withNativeWind teaches Metro to process global.css (Tailwind directives).
module.exports = withNativeWind(config, { input: "./global.css" });

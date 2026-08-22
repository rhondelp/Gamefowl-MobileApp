module.exports = function (api) {
  api.cache(true);
  return {
    // jsxImportSource "nativewind" lets className work on RN components;
    // nativewind/babel transforms className into style objects.
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"],
  };
};

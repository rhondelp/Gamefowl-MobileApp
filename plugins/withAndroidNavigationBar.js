/**
 * File: plugins/withAndroidNavigationBar.js
 *
 * Local Expo config plugin (no extra dependency — `expo/config-plugins` ships
 * with `expo`). Runs at prebuild/EAS build time and edits AppTheme in
 * android/app/src/main/res/values/styles.xml.
 *
 * Why:
 *   Edge-to-edge (mandatory since SDK 54) makes the system navigation bar
 *   transparent and draws the app under it. With 3-button navigation Android
 *   then adds a translucent grey "contrast scrim" behind the buttons
 *   (android:enforceNavigationBarContrast, default true) — the mismatched
 *   grey band under the white tab bar. Turning the scrim off lets the tab
 *   bar's own white background (which already extends under the buttons)
 *   show through.
 *
 *   With the scrim off, React Native no longer picks the button colour, so
 *   windowLightNavigationBar=true keeps the buttons / gesture pill DARK on
 *   the light UI (the app is locked to userInterfaceStyle "light").
 */
const { AndroidConfig, withAndroidStyles } = require("expo/config-plugins");

const ITEMS = [
  // API 29+ attribute; older devices ignore it via targetApi.
  { name: "android:enforceNavigationBarContrast", value: "false", targetApi: "29" },
  // API 27+ attribute.
  { name: "android:windowLightNavigationBar", value: "true", targetApi: "27" },
];

module.exports = function withAndroidNavigationBar(config) {
  return withAndroidStyles(config, (cfg) => {
    let xml = cfg.modResults;
    for (const item of ITEMS) {
      xml = AndroidConfig.Styles.assignStylesValue(xml, {
        add: true,
        parent: AndroidConfig.Styles.getAppThemeGroup(),
        ...item,
      });
    }
    cfg.modResults = xml;
    return cfg;
  });
};

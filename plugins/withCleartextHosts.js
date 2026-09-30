/**
 * TEMPORARY: allow plain-HTTP traffic to specific hosts only.
 *
 * The backend currently lives on a bare VPS IP over http:// (no domain, no
 * TLS). Android and iOS both block cleartext requests in release builds, so
 * this plugin adds a narrowly scoped exception for the listed hosts — it does
 * NOT turn off HTTPS enforcement globally.
 *
 * Remove this plugin (and its entry in app.json) once the backend has a real
 * domain + HTTPS. Swap for real domain + HTTPS before release.
 *
 * Usage in app.json:
 *   ["./plugins/withCleartextHosts", { "hosts": ["201.18.208.199"] }]
 */
const fs = require("fs");
const path = require("path");
const {
  AndroidConfig,
  withAndroidManifest,
  withDangerousMod,
  withInfoPlist,
} = require("expo/config-plugins");

const NETWORK_CONFIG_NAME = "network_security_config";

function buildNetworkSecurityXml(hosts) {
  const domains = hosts
    .map((h) => `        <domain includeSubdomains="false">${h}</domain>`)
    .join("\n");
  // Everything not listed keeps the platform default (cleartext blocked).
  return `<?xml version="1.0" encoding="utf-8"?>
<!-- TEMPORARY: cleartext allowed only for the VPS host(s) below. Remove once the API is on HTTPS. -->
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
${domains}
    </domain-config>
</network-security-config>
`;
}

function withAndroidCleartextHosts(config, hosts) {
  config = withDangerousMod(config, [
    "android",
    async (cfg) => {
      const xmlDir = path.join(
        cfg.modRequest.platformProjectRoot,
        "app/src/main/res/xml",
      );
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(
        path.join(xmlDir, `${NETWORK_CONFIG_NAME}.xml`),
        buildNetworkSecurityXml(hosts),
      );
      return cfg;
    },
  ]);

  return withAndroidManifest(config, (cfg) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(
      cfg.modResults,
    );
    app.$["android:networkSecurityConfig"] = `@xml/${NETWORK_CONFIG_NAME}`;
    return cfg;
  });
}

function withIosCleartextHosts(config, hosts) {
  return withInfoPlist(config, (cfg) => {
    const ats = cfg.modResults.NSAppTransportSecurity ?? {};
    const exceptions = ats.NSExceptionDomains ?? {};
    for (const host of hosts) {
      exceptions[host] = {
        NSExceptionAllowsInsecureHTTPLoads: true,
        NSIncludesSubdomains: false,
      };
    }
    // NSAllowsArbitraryLoads is intentionally left untouched (ATS stays on).
    cfg.modResults.NSAppTransportSecurity = {
      ...ats,
      NSExceptionDomains: exceptions,
    };
    return cfg;
  });
}

module.exports = function withCleartextHosts(config, { hosts = [] } = {}) {
  if (hosts.length === 0) return config;
  config = withAndroidCleartextHosts(config, hosts);
  config = withIosCleartextHosts(config, hosts);
  return config;
};

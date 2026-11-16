/**
 * Regression test for the v1.0.1 (versionCode 3) launch crash.
 *
 * A stray `XMLDocument` token at the end of services/api/auth.ts type-checked
 * (lib.dom declares it) but threw `ReferenceError: Property 'XMLDocument'
 * doesn't exist` when Hermes evaluated the module at startup — killing the
 * app before the first frame. Hermes has no DOM globals, so every API module
 * must evaluate cleanly without them.
 */
const DOM_ONLY_GLOBALS = ["XMLDocument", "Document", "HTMLElement", "window", "document"];

const API_MODULES = [
  "../services/api/client",
  "../services/api/auth",
  "../services/api/admin",
  "../services/api/diseases",
  "../services/api/gamefowls",
  "../services/api/healthAssessments",
  "../services/api/healthHistory",
  "../services/api/symptoms",
];

describe("API service modules", () => {
  const g = globalThis as Record<string, unknown>;
  const saved: Record<string, PropertyDescriptor | undefined> = {};

  beforeAll(() => {
    // Mirror the Hermes runtime: no DOM globals at all.
    for (const name of DOM_ONLY_GLOBALS) {
      saved[name] = Object.getOwnPropertyDescriptor(g, name);
      if (saved[name]) delete g[name];
    }
  });

  afterAll(() => {
    for (const name of DOM_ONLY_GLOBALS) {
      const d = saved[name];
      if (d) Object.defineProperty(g, name, d);
    }
  });

  it.each(API_MODULES)("%s evaluates without DOM globals", (path) => {
    jest.isolateModules(() => {
      expect(() => require(path)).not.toThrow();
    });
  });
});

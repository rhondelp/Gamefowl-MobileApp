/**
 * Guard for a bug that shipped once and is invisible to tsc, to the web
 * build, and to iOS.
 *
 * On Android, ScrollView renders a refreshControl by calling
 *   cloneElement(refreshControl, { style }, <NativeScrollView>…</NativeScrollView>)
 * — it injects the whole scroll view as that element's CHILDREN. A custom
 * wrapper component that renders its own <RefreshControl> drops those
 * children on the floor, so the list silently renders empty while headers,
 * counts and empty states keep working.
 *
 * So `refreshControl={...}` must always be handed a literal <RefreshControl>.
 */
import fs from "fs";
import path from "path";

const ROOT = path.join(__dirname, "..");

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(full));
    else if (entry.name.endsWith(".tsx")) out.push(full);
  }
  return out;
}

describe("refreshControl prop", () => {
  const files = ["screens", "components"].flatMap((d) =>
    sourceFiles(path.join(ROOT, d))
  );

  it("is always given a literal <RefreshControl> element", () => {
    const offenders: string[] = [];

    for (const file of files) {
      const src = fs.readFileSync(file, "utf8");
      const re = /refreshControl=\{\s*(?:\/\*[\s\S]*?\*\/\s*)?<(\w+)/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(src)) !== null) {
        // Skip the documentation example in the tint-props module.
        if (file.endsWith("BrandRefreshControl.tsx")) continue;
        if (m[1] !== "RefreshControl") {
          offenders.push(`${path.relative(ROOT, file)} -> <${m[1]}>`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it("checks a meaningful number of call sites", () => {
    const total = files.reduce(
      (n, f) =>
        n + (fs.readFileSync(f, "utf8").match(/refreshControl=\{/g) ?? []).length,
      0
    );
    expect(total).toBeGreaterThan(0);
  });
});

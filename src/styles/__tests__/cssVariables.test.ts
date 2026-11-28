import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// An undefined var() inside a shorthand (for example `padding: var(--space-24) var(--space-20)`)
// makes the browser drop the whole declaration, so a typo here removes padding without any error.
function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(css|tsx)$/.test(name) ? [path] : [];
  });
}

describe("CSS custom properties", () => {
  it("uses only variables that are defined, unless a fallback is given", () => {
    const files = sourceFiles(join(__dirname, "../.."));
    const defined = new Set<string>();
    const used = new Map<string, string>();
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      for (const m of text.matchAll(/(--[a-z0-9-]+)\s*:/g)) defined.add(m[1]);
      for (const m of text.matchAll(/var\((--[a-z0-9-]+)\)/g)) used.set(m[1], file.split("/src/")[1]);
    }
    const missing = [...used].filter(([name]) => !defined.has(name)).map(([name, file]) => `${name} (${file})`);
    expect(missing).toEqual([]);
  });

  it("hides only the compact bottom navigation labels, not their icons", () => {
    const css = readFileSync(join(__dirname, "../main.css"), "utf8");
    expect(css).toContain("@media (max-width: 400px)");
    expect(css).toContain(".bottom-tab-bar .tab-link-label { display: none; }");
    expect(css).not.toContain(".bottom-tab-bar .tab-link > span {");
  });
});

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, relative } from "node:path";
import { zipSync } from "fflate";

const root = fileURLToPath(new URL("../", import.meta.url));
const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url));
const excluded = new Set([
  "node_modules",
  "dist",
  ".git",
  ".local",
  ".npm-cache",
  "uploads",
  "coverage",
  "playwright-report",
  "test-results",
  "source-code.zip",
]);
const entries = {};
function collect(directory) {
  for (const item of readdirSync(directory, { withFileTypes: true })) {
    if (
      excluded.has(item.name) ||
      (item.name.startsWith(".env") &&
        ![".env.example", ".env.demo"].includes(item.name))
    )
      continue;
    const absolute = join(directory, item.name);
    if (item.isDirectory()) collect(absolute);
    else if (item.isFile())
      entries[relative(repositoryRoot, absolute).replaceAll("\\", "/")] =
        readFileSync(absolute);
  }
}
collect(root);
collect(join(repositoryRoot, "BE"));
entries["README.md"] = readFileSync(join(repositoryRoot, "README.md"));
writeFileSync(
  join(root, "public", "source-code.zip"),
  zipSync(entries, { level: 6 }),
);
console.log(
  `Packaged ${Object.keys(entries).length} source files into public/source-code.zip`,
);

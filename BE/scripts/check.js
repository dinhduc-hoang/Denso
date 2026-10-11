import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
async function check(path) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const file = `${path}/${entry.name}`;
    if (entry.isDirectory()) await check(file);
    else if (file.endsWith(".js")) {
      const result = spawnSync(process.execPath, ["--check", file], {
        stdio: "inherit",
      });
      if (result.status) process.exit(result.status);
    }
  }
}
await check("src");
await check("scripts");
await check("tests");
console.log("All JavaScript syntax checks passed.");
